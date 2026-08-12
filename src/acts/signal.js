/**
 * Act: market data to signal.
 *
 * Five inputs converge on a variance engine and resolve into one regime call.
 * The canvas is driven by a plain numeric state object that the scroll
 * timeline tweens, so the diagram is built by scrolling but stays a normal
 * render loop afterwards.
 *
 * Honesty: the five readings below are a bundled sample, fixed in this file.
 * Nothing here is a live feed and the page says so. What is real is the
 * arithmetic — the z-scores, the weighted composite and the regime call are
 * computed from those inputs on the visitor's machine, not written down.
 */

import { gsap } from 'gsap';
import { registerActRenderer, gateRenderer } from '../acts.js';

// label, sample reading, display unit, long-run mean and sd, weight
const LAYERS = [
    { key: 'vix', label: 'India VIX', value: 14.2, unit: '', mean: 15.8, sd: 3.1, w: 0.30 },
    { key: 'pcr', label: 'Options sentiment', value: 0.94, unit: ' PCR', mean: 1.05, sd: 0.18, w: 0.22 },
    { key: 'flow', label: 'FII / DII net flow', value: -1240, unit: ' cr', mean: 0, sd: 2100, w: 0.20 },
    { key: 'gift', label: 'GIFT Nifty basis', value: 38, unit: ' bps', mean: 12, sd: 26, w: 0.16 },
    { key: 'macro', label: 'Macro carry', value: 0.62, unit: '', mean: 0, sd: 1, w: 0.12 },
];

/** Standardise each reading, then combine on the declared weights. */
export function fuse(layers = LAYERS) {
    const scored = layers.map((l) => ({ ...l, z: (l.value - l.mean) / l.sd }));
    const composite = scored.reduce((a, l) => a + l.w * l.z, 0);
    const regime = composite > 0.5 ? 'Risk-off'
        : composite < -0.5 ? 'Risk-on'
            : 'Neutral';
    return { scored, composite, regime };
}

/** Weights must sum to 1, or the composite is not on the z-scale it claims. */
export function assertSignal() {
    const total = LAYERS.reduce((a, l) => a + l.w, 0);
    if (Math.abs(total - 1) > 1e-9) throw new Error(`weights sum to ${total}, not 1`);
    const { scored, composite } = fuse();
    const manual = scored.reduce((a, l) => a + l.w * (l.value - l.mean) / l.sd, 0);
    if (Math.abs(manual - composite) > 1e-12) throw new Error('composite mismatch');
    return true;
}

const ACCENT = '200, 255, 0';
const PAPER = '240, 237, 232';

registerActRenderer('signal', (act, tl, { phaseAt, reduced }) => {
    const canvas = act.querySelector('.signalviz__canvas');
    if (!canvas) return null;
    assertSignal();

    const ctx = canvas.getContext('2d');
    const { scored, composite, regime } = fuse();

    // Fill the phase-2 readout with the arithmetic actually performed
    const rows = act.querySelector('.signal-rows');
    if (rows) {
        rows.innerHTML = scored.map((l) => `
            <div class="signal-row">
                <span class="signal-row__label font-mono">${l.label}</span>
                <span class="signal-row__val font-mono">${l.value.toLocaleString()}${l.unit}</span>
                <span class="signal-row__z font-mono">z ${l.z >= 0 ? '+' : ''}${l.z.toFixed(2)}</span>
                <span class="signal-row__w font-mono">&times; ${l.w.toFixed(2)}</span>
            </div>`).join('');
    }
    const setText = (sel, text) => {
        const el = act.querySelector(sel);
        if (el) el.textContent = text;
    };
    setText('[data-signal="composite"]', `${composite >= 0 ? '+' : ''}${composite.toFixed(3)}`);
    setText('[data-signal="regime"]', regime);

    // ── State the timeline drives ──────────────────────────────
    const state = { ingest: 0, link: 0, fuse: 0 };

    let w = 0, h = 0;
    function resize() {
        // offsetWidth, not getBoundingClientRect: the act's reveal transform is
        // still applied when this first runs and would scale the buffer.
        const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
        if (!cw || !ch) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = cw; h = ch;
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
        if (!w) resize();
        if (!w) return;
        ctx.clearRect(0, 0, w, h);

        const nx = w * 0.14;                 // source column
        const fx = w * 0.62;                 // fusion node
        const ox = w * 0.88;                 // output
        const cy = h / 2;
        const span = h * 0.72;
        const ys = scored.map((_, i) => cy - span / 2 + (span * i) / (scored.length - 1));

        ctx.lineWidth = 1;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textBaseline = 'middle';

        scored.forEach((l, i) => {
            const appear = gsap.utils.clamp(0, 1, state.ingest * scored.length - i);
            if (appear <= 0) return;
            const y = ys[i];

            // Arc from source to fusion, drawn in proportion to `link`
            const t = gsap.utils.clamp(0, 1, state.link * scored.length - i * 0.6);
            if (t > 0) {
                ctx.strokeStyle = `rgba(${PAPER}, ${0.1 + 0.25 * t})`;
                ctx.beginPath();
                ctx.moveTo(nx + 6, y);
                const steps = 40;
                for (let s = 1; s <= steps * t; s++) {
                    const p = s / steps;
                    const mx = nx + (fx - nx) * p;
                    const my = y + (cy - y) * (p * p * (3 - 2 * p));   // smoothstep
                    ctx.lineTo(mx, my);
                }
                ctx.stroke();
            }

            // Source node and label
            ctx.fillStyle = `rgba(${ACCENT}, ${0.25 + 0.75 * appear})`;
            ctx.beginPath();
            ctx.arc(nx, y, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.textAlign = 'right';
            ctx.fillStyle = `rgba(${PAPER}, ${0.55 * appear})`;
            ctx.fillText(l.label, nx - 12, y);
            ctx.textAlign = 'left';
            ctx.fillStyle = `rgba(${ACCENT}, ${0.7 * appear})`;
            ctx.fillText(`${l.z >= 0 ? '+' : ''}${l.z.toFixed(2)}`, nx + 12, y - 12);
        });

        // Fusion node: a ring that closes as the inputs land
        if (state.link > 0) {
            const k = gsap.utils.clamp(0, 1, state.link);
            ctx.strokeStyle = `rgba(${ACCENT}, ${0.35 + 0.5 * k})`;
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(fx, cy, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
            ctx.stroke();
            ctx.lineWidth = 1;

            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(${PAPER}, ${0.45 * k})`;
            ctx.fillText('FUSE', fx, cy + 32);
        }

        // Output: composite value and regime
        if (state.fuse > 0) {
            const k = gsap.utils.clamp(0, 1, state.fuse);
            ctx.strokeStyle = `rgba(${ACCENT}, ${0.5 * k})`;
            ctx.beginPath();
            ctx.moveTo(fx + 18, cy);
            ctx.lineTo(fx + 18 + (ox - fx - 18) * k, cy);
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.font = '16px "JetBrains Mono", monospace';
            ctx.fillStyle = `rgba(${ACCENT}, ${k})`;
            ctx.fillText(`${composite >= 0 ? '+' : ''}${(composite * k).toFixed(3)}`, ox, cy - 6);
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = `rgba(${PAPER}, ${0.6 * k})`;
            ctx.fillText(regime.toUpperCase(), ox, cy + 16);
        }
    }

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);

    if (reduced || !tl) {
        state.ingest = 1; state.link = 1; state.fuse = 1;
        resize();
        draw();
        return () => ro.disconnect();
    }

    // Size and paint once up front. gateRenderer only starts the loop when the
    // act is on screen, so without this the canvas can sit at its default
    // 300x150 buffer, blank, until the observer decides to fire.
    resize();
    draw();

    const stop = gateRenderer(canvas, draw);

    const t = phaseAt(0);
    tl.to(state, { ingest: 1, duration: 0.8, ease: 'none' }, t);
    tl.to(state, { link: 1, duration: 0.9, ease: 'none' }, t + 0.7);
    tl.to(state, { fuse: 1, duration: 0.6, ease: 'power2.out' }, t + 1.6);

    return () => {
        stop();
        ro.disconnect();
    };
});
