/**
 * motion/core.js - the one motion vocabulary every page uses.
 *
 * Lenis is the only scroll authority, gsap.ticker the only clock. Every
 * entrance fires once; nothing moves again after it lands except on hover.
 * Under prefers-reduced-motion every helper writes the final state and
 * returns null, so reduced motion is a designed state, not a missing one.
 *
 * Helpers that take `start` also accept `start: null` (or false): the tween
 * then plays immediately (after `delay`) with no ScrollTrigger, for load-time
 * moves such as the hero.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

// Overshoots then settles; the doodle engine's spring, done at about .45 s.
gsap.registerEase('doodleSpring', (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-x * 8) * Math.cos(x * 20)));

export { gsap, ScrollTrigger };

export const REDUCED = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DASH = '0.04 0.03';

/** Element, selector, NodeList or array -> array of elements. */
function els(t, scope) {
    if (!t) return [];
    if (typeof t === 'string') return Array.from((scope || document).querySelectorAll(t));
    if (t instanceof Element) return [t];
    return Array.from(t).filter(Boolean);
}

/** ScrollTrigger config, or undefined when start is null/false (play now). */
function st(trigger, start, extra = {}) {
    if (start === null || start === false) return undefined;
    return { trigger, start, once: true, ...extra };
}

/** -> Lenis | null (null when REDUCED: native scroll, no Lenis at all). */
export function initScroll() {
    if (REDUCED) return null;
    // Lenis ignores scroll-margin-top, so hash targets get the sticky nav height as an offset
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 4.5;
    const offset = -navH * 16;
    const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: .9,
        touchMultiplier: 2,
        anchors: { offset },
    });
    lenis.on('scroll', ScrollTrigger.update);
    // gsap.ticker is the single clock; Lenis autoRaf stays off
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
}

export function onFontsReady(fn) {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        return document.fonts.ready.then(fn);
    }
    return Promise.resolve().then(fn);
}

function finishPath(p) {
    p.style.strokeDasharray = p.dataset.dash ? DASH : '1 1';
    p.style.strokeDashoffset = '0';
    p.style.opacity = '1';
}

/**
 * Draw strokes on: dasharray '1 1', dashoffset 1 -> 0, power3.out (ease none when scrubbed).
 * paths: SVGPathElement[] | SVGSVGElement (all its paths). Dashed strokes (data-dash) get
 * their dash pattern once drawn, and lose it again if a scrub runs backwards.
 */
export function drawOn(paths, { stagger = .08, dur = .55, start = 'top 80%', end, scrub = false, trigger, delay = 0 } = {}) {
    let list;
    if (paths instanceof SVGSVGElement) list = Array.from(paths.querySelectorAll('path'));
    else list = els(paths);
    if (!list.length) return null;

    if (REDUCED) {
        list.forEach(finishPath);
        return null;
    }

    const svg = list[0].ownerSVGElement || list[0];
    list.forEach((p) => {
        if (!p.hasAttribute('pathLength')) p.setAttribute('pathLength', '1');
        p.style.strokeDasharray = '1 1';
        p.style.opacity = '1';
    });
    gsap.set(list, { strokeDashoffset: 1 });

    const dashed = list.filter((p) => p.dataset.dash);
    const syncDash = dashed.length
        ? () => dashed.forEach((p) => {
            const off = parseFloat(gsap.getProperty(p, 'strokeDashoffset')) || 0;
            p.style.strokeDasharray = off <= 0.001 ? DASH : '1 1';
        })
        : undefined;

    const scrollTrigger = (start === null || start === false) ? undefined : {
        trigger: trigger || svg,
        start,
        ...(end ? { end } : {}),
        ...(scrub ? { scrub } : { once: true }),
    };

    return gsap.to(list, {
        strokeDashoffset: 0,
        duration: dur,
        ease: scrub ? 'none' : 'power3.out',
        stagger,
        delay,
        scrollTrigger,
        onUpdate: syncDash,
        // Drop the dash once drawn: pathLength with a non-scaling stroke can leave a long line a few % short
        onComplete: () => { list.forEach((p) => { if (!p.dataset.dash) p.style.strokeDasharray = 'none'; }); syncDash?.(); },
    });
}

/** Marker swipe: background-size 0% -> 100% on every `.mk` in scope, .35 s, once. */
export function swipe(scope, { start = 'top 85%', delay = .25 } = {}) {
    const root = typeof scope === 'string' ? document.querySelector(scope) : scope;
    if (!root) return null;
    const marks = root.matches && root.matches('.mk') ? [root] : Array.from(root.querySelectorAll('.mk'));
    if (!marks.length) return null;
    if (REDUCED) {
        gsap.set(marks, { backgroundSize: '100% 48%' });
        return null;
    }
    gsap.set(marks, { backgroundSize: '0% 48%' });
    return gsap.to(marks, {
        backgroundSize: '100% 48%',
        duration: .35,
        ease: 'power3.out',
        delay,
        stagger: .2,
        scrollTrigger: st(root, start),
    });
}

/** Spring pop: scale 0 -> 1, .45 s, doodleSpring, once. */
export function pop(el, { origin = 'left center', delay = 0, start = 'top 85%' } = {}) {
    const list = els(el);
    if (!list.length || REDUCED) return null;
    return gsap.fromTo(list, { scale: 0 }, {
        scale: 1,
        duration: .45,
        ease: 'doodleSpring',
        transformOrigin: origin,
        delay,
        scrollTrigger: st(list[0], start),
    });
}

/**
 * Stamp: scale 2.4 -> 1, opacity 0 -> 1, .16 s, once.
 * Rotation is owned by CSS (`--rot`); scale goes through the `--sc` custom property that
 * components.css composes after the rotate, so this never writes `transform` or rotate.
 */
export function stamp(el, { start = 'top 80%', delay = 0 } = {}) {
    const list = els(el);
    if (!list.length || REDUCED) return null;
    // Hidden and at rest scale until the trigger: a pre-rendered 2.4 scale would overflow the page sideways
    gsap.set(list, { opacity: 0 });
    return gsap.fromTo(list, { '--sc': 2.4, opacity: 0 }, {
        '--sc': 1,
        opacity: 1,
        immediateRender: false,
        duration: .16,
        ease: 'power3.out',
        delay,
        scrollTrigger: st(list[0], start),
    });
}

/** Count up into textContent with en-US grouping. el needs font-variant-numeric: tabular-nums. */
export function countUp(el, { to, from = 0, decimals = 0, prefix = '', suffix = '', dur = .8, start = 'top 80%' } = {}) {
    const node = typeof el === 'string' ? document.querySelector(el) : el;
    if (!node || typeof to !== 'number' || !isFinite(to)) return null;
    const fmt = (v) => prefix + v.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }) + suffix;
    if (REDUCED) {
        node.textContent = fmt(to);
        return null;
    }
    const proxy = { v: from };
    // No eager write: the HTML value stays until the first tick, so crawlers and readers never see zeros
    return gsap.to(proxy, {
        v: to,
        duration: dur,
        ease: 'power3.out',
        scrollTrigger: st(node, start),
        onUpdate: () => { node.textContent = fmt(proxy.v); },
        onComplete: () => { node.textContent = fmt(to); },
    });
}

/** Single-line hand note: clip-path inset reveal, duration max(.5, chars * .03), once. */
export function writeOn(el, { start = 'top 85%' } = {}) {
    const node = typeof el === 'string' ? document.querySelector(el) : el;
    if (!node || REDUCED) return null;
    return gsap.fromTo(node, { clipPath: 'inset(-30% 100% -30% -2%)' }, {
        clipPath: 'inset(-30% 0% -30% -2%)',
        duration: Math.max(.5, node.textContent.length * .03),
        ease: 'none',
        scrollTrigger: st(node, start),
        clearProps: 'clipPath',
    });
}

/** THE default text entrance: opacity 0 -> 1, y -> 0, .5 s power3.out, once. */
export function reveal(targets, { y = 14, stagger = .06, start = 'top 85%', delay = 0 } = {}) {
    const list = els(targets);
    if (!list.length || REDUCED) return null;
    return gsap.fromTo(list, { opacity: 0, y }, {
        opacity: 1,
        y: 0,
        duration: .5,
        ease: 'power3.out',
        stagger,
        delay,
        scrollTrigger: st(list[0], start),
        clearProps: 'opacity,transform',
    });
}

/** gsap.timeline passthrough, so pages never import gsap twice. */
export function timeline(opts) {
    return gsap.timeline(opts);
}
