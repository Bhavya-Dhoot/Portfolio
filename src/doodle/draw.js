/**
 * doodle/draw.js - put generated strokes into an SVG, and run the boil.
 * hand-drawn by brief: brag-styles doodle
 *
 * Strokes are created undrawn (dashoffset 1) so drawOn() or a page timeline can
 * draw them on; under REDUCED, or with opts.drawn, they are created finished.
 * Labels and lime fills always sit outside any boil group: text and highlighter
 * blocks stay crisp, only ink wobbles.
 */

import { gsap, REDUCED } from '../motion/core.js';

const NS = 'http://www.w3.org/2000/svg';
const DASH = '0.04 0.03';

function group(svg, boil) {
    const sel = boil ? ':scope > g.ink.boil' : ':scope > g.ink:not(.boil)';
    let g = svg.querySelector(sel);
    if (!g) {
        g = document.createElementNS(NS, 'g');
        g.setAttribute('class', boil ? 'ink boil' : 'ink');
        svg.appendChild(g);
        if (boil) registerBoil(g);
    }
    return g;
}

/**
 * strokes: Array<{ d, w = 5, dash, boil, cls }>. Appends to (or reuses) <g class="ink"> and
 * <g class="ink boil"> in svg. Returns SVGPathElement[] in stroke order.
 * opts.drawn: create the strokes already drawn (no entrance).
 */
export function ink(svg, strokes, opts = {}) {
    const done = REDUCED || !!opts.drawn;
    return strokes.map((s) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', s.d);
        p.setAttribute('pathLength', '1');
        p.setAttribute('vector-effect', 'non-scaling-stroke');
        p.setAttribute('stroke-width', String(s.w ?? 5));
        if (s.cls) p.setAttribute('class', s.cls);
        if (s.dash) p.dataset.dash = '1';
        p.style.strokeDasharray = done && s.dash ? DASH : '1 1';
        p.style.strokeDashoffset = done ? '0' : '1';
        group(svg, !!s.boil).appendChild(p);
        return p;
    });
}

/** Text in viewBox units, outside any boil group. Mono labels are uppercase, .14em tracking (CSS). */
export function label(svg, x, y, text, { font = 'mono', size = 14, anchor = 'start', muted = false } = {}) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('font-size', String(size));
    t.setAttribute('text-anchor', anchor);
    t.setAttribute('class', `lbl lbl-${font === 'hand' ? 'hand' : 'mono'}${muted ? ' lbl-muted' : ''}`);
    t.textContent = text;
    svg.appendChild(t);
    return t;
}

/** Lime highlighter block, rx 4, inserted before the ink groups so ink draws over it. */
export function fillBlock(svg, x, y, w, h, { rot = 0 } = {}) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('class', 'fill');
    r.setAttribute('x', String(x));
    r.setAttribute('y', String(y));
    r.setAttribute('width', String(w));
    r.setAttribute('height', String(h));
    r.setAttribute('rx', '4');
    if (rot) r.setAttribute('transform', `rotate(${rot} ${x + w / 2} ${y + h / 2})`);
    const firstInk = svg.querySelector(':scope > g.ink');
    svg.insertBefore(r, firstInk);
    return r;
}

// ---------------------------------------------------------------- boil
// One shared filter, one ticker, IntersectionObserver-gated, at most two groups live.

const MAX_LIVE = 2;
const groups = [];            // every g.boil ever created, in creation order
const visible = new Set();
let started = false;
let disabled = false;
let io = null;
let turb = null;
let ticking = false;
let lastStep = -1;

function registerBoil(g) {
    groups.push(g);
    if (started && !disabled && io) io.observe(g);
}

function tick(time) {
    if (document.hidden) return;
    // 10 fps, five seeds, as in the engine
    const step = Math.floor(time * 10) % 5;
    if (step !== lastStep) {
        lastStep = step;
        turb.setAttribute('seed', String(1 + step));
    }
}

function apply() {
    const live = groups.filter((g) => visible.has(g)).slice(0, MAX_LIVE);
    groups.forEach((g) => {
        if (live.includes(g)) g.setAttribute('filter', 'url(#boil)');
        else g.removeAttribute('filter');
    });
    if (live.length && !ticking) { gsap.ticker.add(tick); ticking = true; }
    if (!live.length && ticking) { gsap.ticker.remove(tick); ticking = false; }
}

/**
 * Idempotent. No-op under REDUCED, on phones (max-width 767px) and on touch-only
 * devices (hover: none): feDisplacementMap re-rasterises the whole group on every
 * seed step, a steady paint cost under a phone's scroll.
 */
export function boilStart() {
    if (started) return;
    started = true;
    if (REDUCED
        || window.matchMedia('(max-width: 767px)').matches
        || window.matchMedia('(hover: none)').matches) {
        disabled = true;
        return;
    }

    const host = document.createElementNS(NS, 'svg');
    host.setAttribute('width', '0');
    host.setAttribute('height', '0');
    host.setAttribute('aria-hidden', 'true');
    host.setAttribute('focusable', 'false');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    host.innerHTML = '<filter id="boil" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">'
        + '<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="1"/>'
        + '<feDisplacementMap in="SourceGraphic" scale="4.5" xChannelSelector="R" yChannelSelector="G"/>'
        + '</filter>';
    document.body.appendChild(host);
    turb = host.querySelector('feTurbulence');

    io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) visible.add(e.target);
            else visible.delete(e.target);
        });
        apply();
    });
    groups.forEach((g) => io.observe(g));

    window.addEventListener('pagehide', () => {
        if (ticking) gsap.ticker.remove(tick);
        ticking = false;
        if (io) io.disconnect();
        groups.forEach((g) => g.removeAttribute('filter'));
    }, { once: true });
}
