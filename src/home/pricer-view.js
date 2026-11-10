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

    // ---- chart furniture: one hand-drawn P&L axis; the zero line is the spot axis and is data, so it is exact
    const defs = el('defs', {}, svg);
    const hatch = el('pattern', { id: 'desk-hatch', width: '10', height: '10', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('line', { x1: '0', y1: '0', x2: '0', y2: '10', stroke: '#0a0a0a', 'stroke-width': '2', opacity: '.35' }, hatch);
    const d = doodle(105);
    const axes = ink(svg, [
        { d: d.line(PLOT.x0 - 14, PLOT.yTop - 24, PLOT.x0 - 14, PLOT.yBot + 6, 4), w: 4 },
    ]);
    label(svg, PLOT.x0 - 6, 34, 'P&L', { font: 'hand', size: HAND });
    label(svg, PLOT.x1 + 12, BASE + 2, 'spot', { font: 'hand', size: HAND, anchor: 'end' });
    const tickLo = label(svg, PLOT.x0, BASE, '', { size: TICK });
    const tickHi = label(svg, PLOT.x1 - 70, BASE, '', { size: TICK, anchor: 'end' });
    const tickZero = label(svg, PLOT.x0 - 22, 0, '0', { size: TICK, anchor: 'end' });

    const gain = el('path', { class: 'gain' }, svg);
    const loss = el('path', { class: 'loss' }, svg);
    const zero = el('path', { class: 'zero', 'vector-effect': 'non-scaling-stroke', 'stroke-width': '3' }, svg);
    const cross = el('path', { class: 'cross', 'vector-effect': 'non-scaling-stroke', 'stroke-width': '2' }, svg);
    const curve = el('path', { class: 'curve', 'vector-effect': 'non-scaling-stroke', 'stroke-width': '4' }, svg);
    const beMark = el('path', { class: 'be', 'vector-effect': 'non-scaling-stroke', 'stroke-width': '2' }, svg);
    const beText = label(svg, 0, 0, '', { size: TICK, anchor: 'middle' });
    const dot = el('circle', { class: 'spot-dot', r: '8' }, svg);
    // Live readout sits in the top-right corner, clear of the dot and the breakeven tag
    const read = label(svg, PLOT.x1 + 12, 34, '', { size: PHONE ? 30 : 18, anchor: 'end' });
    read.setAttribute('font-weight', '700');
    const hint = label(svg, 0, 0, 'drag me', { font: 'hand', size: HAND, anchor: 'middle' });
    let range = null;                     // frozen while dragging so the axis does not slide under the finger

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

        const [lo, hi] = range || [Math.min(state.spot, state.strike) * 0.7, Math.max(state.spot, state.strike) * 1.3];
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

        const y0 = Y(0);
        const pts = xs.map((s, i) => `${X(s).toFixed(1)} ${Y(ys[i]).toFixed(1)}`);
        curve.setAttribute('d', 'M' + pts.join(' L'));
        // Profit is highlighted, loss is hatched: the curve clamped to the zero line on each side
        const band = (f) => `M${X(xs[0]).toFixed(1)} ${y0.toFixed(1)} `
            + xs.map((s, i) => `L${X(s).toFixed(1)} ${f(Y(ys[i]), y0).toFixed(1)}`).join(' ')
            + ` L${X(xs[xs.length - 1]).toFixed(1)} ${y0.toFixed(1)} Z`;
        gain.setAttribute('d', band(Math.min));
        loss.setAttribute('d', band(Math.max));
        zero.setAttribute('d', `M${PLOT.x0 - 14} ${y0.toFixed(1)} L${PLOT.x1 + 12} ${y0.toFixed(1)}`);

        // Breakeven: the first sign change, interpolated
        let be = null;
        for (let i = 1; i < xs.length && be === null; i++) {
            if ((ys[i - 1] < 0) !== (ys[i] < 0)) be = xs[i - 1] + (xs[i] - xs[i - 1]) * (-ys[i - 1] / (ys[i] - ys[i - 1]));
        }
        beMark.setAttribute('d', be === null ? '' : `M${X(be).toFixed(1)} ${(y0 - 14).toFixed(1)} L${X(be).toFixed(1)} ${(y0 + 14).toFixed(1)}`);
        // Tag sits above the zero line, on whichever side of the mark has room
        const right = be !== null && X(be) > (PLOT.x0 + PLOT.x1) / 2;
        beText.textContent = be === null ? '' : `${PHONE ? 'BE' : 'breakeven'} ${be.toFixed(2)}`;
        beText.setAttribute('text-anchor', right ? 'end' : 'start');
        beText.setAttribute('x', be === null ? 0 : (X(be) + (right ? -12 : 12)).toFixed(1));
        beText.setAttribute('y', (y0 < PLOT.yTop + 30 ? y0 + 30 : y0 - 14).toFixed(1));

        const sx = X(state.spot), here = pnl(state.spot, g.price, T, sigma), sy = Y(here);
        dot.setAttribute('cx', sx.toFixed(1));
        dot.setAttribute('cy', sy.toFixed(1));
        cross.setAttribute('d', `M${sx.toFixed(1)} ${PLOT.yTop - 20} L${sx.toFixed(1)} ${PLOT.yBot + 6}`);
        read.textContent = `spot ${state.spot.toFixed(1)}  P&L ${here >= 0 ? '+' : ''}${here.toFixed(2)}`;
        // Hint beside the dot, on the side away from the breakeven tag
        const hl = !right;
        hint.setAttribute('text-anchor', hl ? 'start' : 'end');
        hint.setAttribute('x', (sx + (hl ? 22 : -22)).toFixed(1));
        hint.setAttribute('y', (sy > y0 ? sy + HAND + 4 : sy - 16).toFixed(1));   // off the curve, away from the zero line

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

    // ---- drag the spot along the curve, straight on the chart
    let dragging = false;
    const toSpot = (e) => {
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
        const [lo, hi] = range;
        const s = lo + (Math.min(PLOT.x1, Math.max(PLOT.x0, p.x)) - PLOT.x0) / (PLOT.x1 - PLOT.x0) * (hi - lo);
        state.spot = Math.round(s * 10) / 10;
        inputs.spot.value = state.spot;
        pressed(presetBtns, () => false);
        schedule();
    };
    svg.addEventListener('pointerdown', (e) => {
        dragging = true;
        range = [Math.min(state.spot, state.strike) * 0.7, Math.max(state.spot, state.strike) * 1.3];
        svg.setPointerCapture(e.pointerId);
        svg.classList.add('is-drag');
        hint.style.opacity = '0';
        toSpot(e);
    });
    svg.addEventListener('pointermove', (e) => { if (dragging) toSpot(e); });
    const drop = () => {
        if (!dragging) return;
        dragging = false;
        range = null;
        svg.classList.remove('is-drag');
        schedule();
    };
    svg.addEventListener('pointerup', drop);
    svg.addEventListener('pointercancel', drop);

    writeInputs();
    syncToggles();
    pressed(presetBtns, (b) => b.dataset.preset === 'atm');
    render();

    // Motion: header and controls rise in, axes draw on once; the curve is data and has no entrance
    reveal(sec.querySelectorAll('.sec-head > *'), { start: 'top 85%' });
    reveal(sec.querySelectorAll('.desk-controls .ctl-row'), { start: 'top 85%', stagger: .08 });
    drawOn(axes, { stagger: .15, dur: .5, start: 'top 80%', trigger: svg });
}
