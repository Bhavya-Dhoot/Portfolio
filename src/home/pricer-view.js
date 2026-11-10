/**
 * home/pricer-view.js - the options desk: controls, an exact payoff curve, live Greeks.
 * The axes are hand strokes; the curve, zero line and spot dot are data and are never wobbled.
 */

import { drawOn, reveal } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink, label } from '../doodle/draw.js';
import { blackScholes, PRESETS } from '../tools/blackscholes.js';

const NS = 'http://www.w3.org/2000/svg';
const RATE = 0.065;                       // RBI repo, near enough for INR rates
// On a phone the 800-wide chart shrinks to about half size, so its words scale up and the plot gives them room
const PHONE = window.matchMedia('(max-width: 767px)').matches;
const PLOT = { x0: 70, x1: 770, yTop: 56, yBot: PHONE ? 350 : 372 };
const TICK = PHONE ? 34 : 14;
const BASE = PHONE ? 402 : 412;      // baseline for the x ticks
const HAND = PHONE ? 36 : 26;
const SAMPLES = 140;

function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
}

export function initPricer() {
    const sec = document.getElementById('pricer');
    const svg = document.getElementById('desk-chart');
    if (!sec || !svg) return;

    const inputs = {
        spot: document.getElementById('in-spot'),
        strike: document.getElementById('in-strike'),
        vol: document.getElementById('in-vol'),
        days: document.getElementById('in-days'),
    };
    const out = {
        price: document.getElementById('o-price'),
        delta: document.getElementById('o-delta'),
        gamma: document.getElementById('o-gamma'),
        vega: document.getElementById('o-vega'),
        theta: document.getElementById('o-theta'),
    };
    const presetBtns = Array.from(sec.querySelectorAll('[data-preset]'));
    const typeBtns = Array.from(sec.querySelectorAll('[data-type]'));
    const viewBtns = Array.from(sec.querySelectorAll('[data-view]'));

    const state = { ...PRESETS.atm, view: 'expiry' };

    // ---- chart furniture: hand-drawn axes, then exact data elements on top
    const d = doodle(105);
    const axes = ink(svg, [
        { d: d.line(PLOT.x0 - 14, PLOT.yTop - 24, PLOT.x0 - 14, PLOT.yBot + 20, 4), w: 4 },
        { d: d.line(PLOT.x0 - 14, PLOT.yBot + 20, PLOT.x1 + 12, PLOT.yBot + 20, 4), w: 4 },
    ]);
    label(svg, PLOT.x0 - 6, 34, 'P&L', { font: 'hand', size: HAND });
    label(svg, PLOT.x1 + 10, BASE + 2, 'spot', { font: 'hand', size: HAND, anchor: 'end' });
    const tickLo = label(svg, PLOT.x0 - 14, BASE, '', { size: TICK });
    const tickHi = label(svg, PLOT.x1 - 70, BASE, '', { size: TICK, anchor: 'end' });
    const tickZero = label(svg, PLOT.x0 - 22, 0, '0', { size: TICK, anchor: 'end' });

    const zero = el('path', { class: 'zero', 'vector-effect': 'non-scaling-stroke', 'stroke-width': '3' }, svg);
    const curve = el('path', { class: 'curve', 'vector-effect': 'non-scaling-stroke', 'stroke-width': '4' }, svg);
    const dot = el('circle', { class: 'spot-dot', r: '8' }, svg);

    // ---- maths
    const pnl = (s, premium, T, sigma) => {
        if (state.view === 'expiry') {
            const intrinsic = state.call ? Math.max(0, s - state.strike) : Math.max(0, state.strike - s);
            return intrinsic - premium;
        }
        return blackScholes(s, state.strike, T, sigma, RATE, state.call).price - premium;
    };

    function render() {
        const T = state.days / 365;
        const sigma = state.vol / 100;
        const g = blackScholes(state.spot, state.strike, T, sigma, RATE, state.call);

        out.price.textContent = g.price.toFixed(2);
        out.delta.textContent = g.delta.toFixed(3);
        out.gamma.textContent = g.gamma.toFixed(4);
        out.vega.textContent = g.vega.toFixed(3);
        out.theta.textContent = g.theta.toFixed(3);

        const lo = Math.min(state.spot, state.strike) * 0.7;
        const hi = Math.max(state.spot, state.strike) * 1.3;
        const xs = [];
        for (let i = 0; i <= SAMPLES; i++) xs.push(lo + (hi - lo) * i / SAMPLES);
        xs.push(state.strike);
        xs.sort((a, b) => a - b);
        const ys = xs.map((s) => pnl(s, g.price, T, sigma));

        const vmin = Math.min(0, ...ys);
        const vmax = Math.max(0, ...ys);
        const span = (vmax - vmin) || 1;
        const X = (s) => PLOT.x0 + (s - lo) / (hi - lo) * (PLOT.x1 - PLOT.x0);
        const Y = (v) => PLOT.yBot - (v - vmin) / span * (PLOT.yBot - PLOT.yTop);

        curve.setAttribute('d', xs.map((s, i) => `${i ? 'L' : 'M'}${X(s).toFixed(1)} ${Y(ys[i]).toFixed(1)}`).join(' '));
        zero.setAttribute('d', `M${PLOT.x0 - 14} ${Y(0).toFixed(1)} L${PLOT.x1 + 12} ${Y(0).toFixed(1)}`);
        dot.setAttribute('cx', X(state.spot).toFixed(1));
        dot.setAttribute('cy', Y(pnl(state.spot, g.price, T, sigma)).toFixed(1));

        tickLo.textContent = lo.toFixed(0);
        tickHi.textContent = hi.toFixed(0);
        tickZero.setAttribute('y', (Y(0) + TICK / 3).toFixed(1));
    }

    // One redraw per frame however fast the inputs fire
    let queued = false;
    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; render(); });
    }

    // ---- controls
    const pressed = (btns, test) => btns.forEach((b) => b.setAttribute('aria-pressed', String(test(b))));

    function writeInputs() {
        inputs.spot.value = state.spot;
        inputs.strike.value = state.strike;
        inputs.vol.value = state.vol;
        inputs.days.value = state.days;
    }
    function syncToggles() {
        pressed(typeBtns, (b) => (b.dataset.type === 'call') === state.call);
        pressed(viewBtns, (b) => b.dataset.view === state.view);
    }

    presetBtns.forEach((b) => b.addEventListener('click', () => {
        const p = PRESETS[b.dataset.preset];
        if (!p) return;
        Object.assign(state, p);
        writeInputs();
        syncToggles();
        pressed(presetBtns, (x) => x === b);
        schedule();
    }));
    typeBtns.forEach((b) => b.addEventListener('click', () => {
        state.call = b.dataset.type === 'call';
        syncToggles();
        pressed(presetBtns, () => false);
        schedule();
    }));
    viewBtns.forEach((b) => b.addEventListener('click', () => {
        state.view = b.dataset.view;
        syncToggles();
        schedule();
    }));
    Object.entries(inputs).forEach(([key, input]) => input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        const min = key === 'days' ? 0 : 0.01;
        if (!isFinite(v) || v < min) return;      // ignore half-typed values, keep the last good state
        state[key] = v;
        pressed(presetBtns, () => false);
        schedule();
    }));

    writeInputs();
    syncToggles();
    pressed(presetBtns, (b) => b.dataset.preset === 'atm');
    render();

    // Motion: header and controls rise in, axes draw on once; the curve is data and has no entrance
    reveal(sec.querySelectorAll('.sec-head > *'), { start: 'top 85%' });
    reveal(sec.querySelectorAll('.desk-controls .ctl-row'), { start: 'top 85%', stagger: .08 });
    drawOn(axes, { stagger: .15, dur: .5, start: 'top 80%', trigger: svg });
}
