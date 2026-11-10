/**
 * about/portrait.js - the one canvas on the site.
 * /portrait.jpg as glyphs, ink on paper, drawn once and static: no cursor
 * spotlight, no ticker. The photo is a dark subject on a near-black ground, so
 * the background is flood-filled out to paper and the subject is inked by
 * darkness (dark suit and hair dense, lit face light). A hand-drawn frame inks
 * on first, then the glyphs fade in over it.
 */

import { gsap, REDUCED, drawOn } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink } from '../doodle/draw.js';

const NS = 'http://www.w3.org/2000/svg';
const RAMP = ' .:-=+*#%@';           // light -> dense
const CELL = 5;                      // CSS px per glyph cell
const INK = '10, 10, 10';
// ponytail: flood-fill threshold. Ceiling: works because this photo's background is near-black
// (1-2/255); a new photo with a lit or textured ground needs a different threshold or a real matte.
const BG = 4 / 255;
const LIT = 18 / 255;                // below this (suit, shirt) is noise-level dark: stays dense, not equalised

export function initPortrait() {
    const canvas = document.getElementById('portrait');
    if (!canvas) return;
    const frame = canvas.parentElement;
    const ctx = canvas.getContext('2d');

    // Hand-drawn frame with two sparks, seeded so it never changes between loads
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ink-svg portrait-ink');
    svg.setAttribute('viewBox', '0 0 480 543');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    frame.appendChild(svg);
    const d = doodle(301);
    const paths = ink(svg, [
        { d: d.rect(4, 4, 472, 535, 8), w: 6 },
        { d: d.spark(488, 14, 26), w: 4 },
        { d: d.spark(-10, 536, 22), w: 4 },
    ]);
    // Draw the frame once as the portrait enters
    drawOn(paths, { trigger: frame, start: 'top 85%', dur: .6, stagger: .1 });

    if (!REDUCED) {
        gsap.set(canvas, { opacity: 0 });
        // Glyphs fade in once the frame is under way
        gsap.to(canvas, {
            opacity: 1,
            duration: .4,
            delay: .6,
            ease: 'power3.out',
            scrollTrigger: { trigger: frame, start: 'top 85%', once: true },
        });
    }

    let lum = null;
    let cols = 0, rows = 0, cw = 0, ch = 0;
    const img = new Image();
    let fontReady = false;
    let loaded = false;

    const glyphAt = (v) => RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))];

    // Contain-fit: the whole frame lands in the grid, nothing cropped
    function sample() {
        const off = document.createElement('canvas');
        off.width = cols;
        off.height = rows;
        const octx = off.getContext('2d', { willReadFrequently: true });
        const scale = Math.min(cols / img.naturalWidth, rows / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        octx.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
        const data = octx.getImageData(0, 0, cols, rows).data;
        const n = cols * rows;
        const raw = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            raw[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
        }
        // Background = dark cells reachable from the top, left and right borders (not the bottom: the suit meets it)
        const bg = new Uint8Array(n);
        const queue = [];
        const seed = (i) => { if (!bg[i] && raw[i] < BG) { bg[i] = 1; queue.push(i); } };
        for (let c = 0; c < cols; c++) seed(c);
        for (let r = 0; r < rows; r++) { seed(r * cols); seed(r * cols + cols - 1); }
        for (let h = 0; h < queue.length; h++) {
            const i = queue[h];
            const c = i % cols;
            if (i >= cols) seed(i - cols);
            if (i < n - cols) seed(i + cols);
            if (c > 0) seed(i - 1);
            if (c < cols - 1) seed(i + 1);
        }
        // Histogram-equalise over subject cells only: a CDF of raw luminance spreads the face tones apart
        const sorted = [];
        for (let i = 0; i < n; i++) if (!bg[i] && raw[i] >= LIT) sorted.push(raw[i]);
        sorted.sort((x, y) => x - y);
        const cdf = (v) => {
            let lo = 0, hi = sorted.length;
            while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] <= v) lo = m + 1; else hi = m; }
            return lo / sorted.length;
        };
        // Feature term: 3x3 Sobel magnitude on raw luminance (glasses rims, eyes, nostrils, mouth, jaw)
        const sob = new Float32Array(n);
        const mags = [];
        for (let r = 1; r < rows - 1; r++) {
            for (let c = 1; c < cols - 1; c++) {
                const i = r * cols + c;
                if (bg[i] || raw[i] < LIT) continue;
                const a = raw[i - cols - 1], b = raw[i - cols], d = raw[i - cols + 1];
                const e = raw[i - 1], f = raw[i + 1];
                const g = raw[i + cols - 1], h = raw[i + cols], k = raw[i + cols + 1];
                if (bg[i - cols - 1] || bg[i - cols] || bg[i - cols + 1] || bg[i - 1] || bg[i + 1]
                    || bg[i + cols - 1] || bg[i + cols] || bg[i + cols + 1]) continue;
                const gx = (d + 2 * f + k) - (a + 2 * e + g);
                const gy = (g + 2 * h + k) - (a + 2 * b + d);
                sob[i] = Math.hypot(gx, gy);
                mags.push(sob[i]);
            }
        }
        mags.sort((x, y) => x - y);
        const p95 = mags.length ? mags[Math.floor(mags.length * 0.95)] || 1e-6 : 1e-6;
        lum = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            if (bg[i]) continue;
            // Suit and shirt sit at sensor-noise level: keep them dense, equalise only the lit tones
            let d = raw[i] < LIT ? 0.72 : Math.pow(1 - cdf(raw[i]), 0.9);
            d = Math.max(d, 0.85 * Math.min(1, sob[i] / p95));
            const c = i % cols;
            const edge = (i >= cols && bg[i - cols]) || (i < n - cols && bg[i + cols])
                || (c > 0 && bg[i - 1]) || (c < cols - 1 && bg[i + 1]);
            if (edge) d = Math.max(d, 0.55);        // keep the silhouette crisp on paper
            lum[i] = Math.max(0, Math.min(1, d));
        }
    }

    // Drawn once per size; no loop, no pointer handling
    function render() {
        if (!loaded || !fontReady) return;
        const box = canvas.getBoundingClientRect();
        if (!box.width || !box.height) return;
        cw = box.width;
        ch = box.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.floor(cw / CELL);
        rows = Math.floor(ch / CELL);
        sample();
        ctx.clearRect(0, 0, cw, ch);
        ctx.font = `400 ${CELL}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const v = lum[r * cols + c];
                if (v < 0.04) continue;             // background and highlights stay paper
                ctx.fillStyle = `rgba(${INK}, ${0.35 + 0.65 * v})`;
                ctx.fillText(glyphAt(v), c * CELL + CELL / 2, r * CELL + CELL / 2);
            }
        }
    }

    img.onload = () => { loaded = true; render(); };
    img.onerror = () => { canvas.remove(); };
    img.src = '/portrait.jpg';

    // The glyph face is lazy-loaded; draw only once it is in, so the first render is final
    const faces = document.fonts && document.fonts.load
        ? document.fonts.load(`400 ${CELL}px "JetBrains Mono"`)
        : Promise.resolve();
    faces.catch(() => {}).then(() => { fontReady = true; render(); });

    let lastW = 0;
    const ro = new ResizeObserver(() => {
        const w = canvas.clientWidth;
        if (w === lastW) return;
        lastW = w;
        render();
    });
    ro.observe(canvas);
}
