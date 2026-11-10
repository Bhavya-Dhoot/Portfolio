/**
 * motion/wipe.js - the lime scribble wipe between pages.
 *
 * Out: an internal link to another pathname draws one zig scribble over the
 * viewport (.35 s), sets sessionStorage.bd_wipe and navigates. In: the next page
 * starts covered and erases the scribble (.35 s). Failsafes: pageshow from the
 * bfcache uncovers at once, and a 1 s timer after load uncovers whatever
 * happened. Under REDUCED this is a no-op and links navigate natively.
 */

import { gsap, REDUCED } from './core.js';
import { doodle } from '../doodle/paths.js';

const NS = 'http://www.w3.org/2000/svg';
const KEY = 'bd_wipe';
let ready = false;

const root = document.documentElement;
const uncloak = () => root.classList.remove('bd-wipe-in');

const norm = (p) => (p.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/+$/, '') || '/');

function store(op, v) {
    try {
        if (op === 'get') return sessionStorage.getItem(KEY);
        if (op === 'set') sessionStorage.setItem(KEY, v);
        if (op === 'del') sessionStorage.removeItem(KEY);
    } catch (e) { /* private mode: wipe simply never plays on arrival */ }
    return null;
}

export function initWipe() {
    if (REDUCED) { uncloak(); return; }
    if (ready) return;
    ready = true;

    const svg = document.createElementNS(NS, 'svg');
    svg.id = 'wipe';
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('preserveAspectRatio', 'none');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('pathLength', '1');
    svg.appendChild(path);
    document.body.appendChild(svg);

    function layout() {
        const W = window.innerWidth, H = window.innerHeight;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        path.setAttribute('d', doodle(7).zig(-.15 * W, -.15 * H, 1.3 * W, 1.3 * H, 11));
        path.style.strokeWidth = String(Math.max(W, H) * .17);
    }
    layout();
    window.addEventListener('resize', layout, { passive: true });

    const hide = () => {
        uncloak();
        gsap.killTweensOf(path);
        gsap.set(path, { strokeDashoffset: -1 });
        svg.style.visibility = 'hidden';
    };
    gsap.set(path, { strokeDasharray: '1 1', strokeDashoffset: 1 });

    // Arrival: start covered, then erase.
    if (store('get') === '1') {
        store('del');
        svg.style.visibility = 'visible';
        gsap.set(path, { strokeDashoffset: 0 });
        uncloak();   // the lime cover is up, so the page underneath can show
        // Wipe in: uncover the new page
        gsap.to(path, { strokeDashoffset: -1, duration: .35, ease: 'power2.inOut', onComplete: hide });
    } else {
        svg.style.visibility = 'hidden';
        uncloak();
    }
    setTimeout(uncloak, 1000);   // a JS failure must never leave the page hidden

    // Failsafe: never leave the page covered.
    const failsafe = () => setTimeout(() => {
        if (!gsap.isTweening(path)) hide();
    }, 1000);
    if (document.readyState === 'complete') failsafe();
    else window.addEventListener('load', failsafe, { once: true });

    window.addEventListener('pageshow', (e) => {
        if (e.persisted) { store('del'); hide(); }
    });

    document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a || a.hasAttribute('download')) return;
        if (a.target && a.target !== '_self') return;
        let url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (url.origin !== location.origin) return;
        if (norm(url.pathname) === norm(location.pathname)) return;   // same page or hash-only

        e.preventDefault();
        svg.style.visibility = 'visible';
        gsap.killTweensOf(path);
        gsap.set(path, { strokeDashoffset: 1 });
        // Wipe out: cover, then navigate
        gsap.to(path, {
            strokeDashoffset: 0,
            duration: .35,
            ease: 'power2.inOut',
            onComplete: () => {
                store('set', '1');
                location.assign(url.href);
                // Navigation cancelled or very slow: uncover rather than trap the page
                setTimeout(hide, 1000);
            },
        });
    });
}
