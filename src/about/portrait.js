/**
 * about/portrait.js - the one canvas on the site.
 * /portrait.jpg as glyphs on an ink plate. The photo is a lit face on a near-black
 * ground, so the plate is inverted: bright skin is dense paper glyphs, the ground
 * is the plate itself. Each glyph is a spring particle: they fly in once, the
 * pointer pushes them aside and heats them lime, a tap sends a shockwave, and a
 * lime scan line passes now and then. The loop sleeps whenever everything is at
 * rest or off screen. Reduced motion gets the still plate.
 */

import { REDUCED, drawOn } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink } from '../doodle/draw.js';

const NS = 'http://www.w3.org/2000/svg';
const RAMP = ' .:-=+*#%@';           // dim -> bright
const HOT = 'BHAVYA0123456789%x$';   // what a heated glyph scrambles through
const CELL = 5;                      // CSS px per glyph cell
const PLATE = '#0a0a0a', PAPER = '#f0ede8', LIME = '#c8ff00';
// ponytail: flood-fill threshold, works because this photo's ground is near-black (1-2/255).
// A new photo with a lit or textured ground needs a different threshold or a real matte.
const BG = 4 / 255;
const LIT = 18 / 255;                // below this (suit, shirt) is sensor noise: drawn as a faint silhouette
const R = 56;                        // pointer reach, CSS px
const SCAN_EVERY = 7000;

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
    drawOn(ink(svg, [
        { d: d.rect(4, 4, 472, 535, 8), w: 6 },
        { d: d.spark(488, 14, 26), w: 4 },
        { d: d.spark(-10, 536, 22), w: 4 },
    ]), { trigger: frame, start: 'top 85%', dur: .6, stagger: .1 });

    const img = new Image();
    let loaded = false, fontReady = false;
    let cw = 0, ch = 0, n = 0;
    // Particle state, one slot per visible glyph
    let hx, hy, x, y, vx, vy, val, heat, chr, delay;
    let entered = REDUCED, t0 = 0, raf = 0, visible = false;
    let px = -1e4, py = -1e4, inside = false;
    const rings = [];
    let scanY = -1, lastScan = 0;

    function sample(cols, rows) {
        const off = document.createElement('canvas');
        off.width = cols;
        off.height = rows;
        const octx = off.getContext('2d', { willReadFrequently: true });
        const s = Math.min(cols / img.naturalWidth, rows / img.naturalHeight);
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        octx.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
        const data = octx.getImageData(0, 0, cols, rows).data;
        const m = cols * rows;
        const raw = new Float32Array(m);
        for (let i = 0; i < m; i++) {
            raw[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
        }
        // Ground = dark cells reachable from the top, left and right borders (not the bottom: the suit meets it)
        const bg = new Uint8Array(m);
        const q = [];
        const seed = (i) => { if (!bg[i] && raw[i] < BG) { bg[i] = 1; q.push(i); } };
        for (let c = 0; c < cols; c++) seed(c);
        for (let r = 0; r < rows; r++) { seed(r * cols); seed(r * cols + cols - 1); }
        for (let h = 0; h < q.length; h++) {
            const i = q[h], c = i % cols;
            if (i >= cols) seed(i - cols);
            if (i < m - cols) seed(i + cols);
            if (c > 0) seed(i - 1);
            if (c < cols - 1) seed(i + 1);
        }
        // Equalise the lit tones over the subject so the face spreads across the whole ramp
        const lit = [];
        for (let i = 0; i < m; i++) if (!bg[i] && raw[i] >= LIT) lit.push(raw[i]);
        lit.sort((a, b) => a - b);
        const cdf = (v) => {
            let lo = 0, hi = lit.length;
            while (lo < hi) { const k = (lo + hi) >> 1; if (lit[k] <= v) lo = k + 1; else hi = k; }
            return lo / lit.length;
        };
        const out = new Float32Array(m);
        for (let i = 0; i < m; i++) {
            if (bg[i]) continue;
            const c = i % cols;
            const edge = (i >= cols && bg[i - cols]) || (i < m - cols && bg[i + cols])
                || (c > 0 && bg[i - 1]) || (c < cols - 1 && bg[i + 1]);
            const v = raw[i] < LIT ? 0.1 : 0.15 + 0.85 * Math.pow(cdf(raw[i]), 1.1);
            out[i] = edge ? Math.max(v, 0.45) : v;   // rim light keeps the suit's outline on the plate
        }
        return out;
    }

    function build() {
        const box = canvas.getBoundingClientRect();
        if (!box.width || !box.height) return false;
        cw = box.width;
        ch = box.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const cols = Math.floor(cw / CELL), rows = Math.floor(ch / CELL);
        const lum = sample(cols, rows);
        const idx = [];
        for (let i = 0; i < lum.length; i++) if (lum[i] > 0.04) idx.push(i);
        n = idx.length;
        hx = new Float32Array(n); hy = new Float32Array(n);
        x = new Float32Array(n); y = new Float32Array(n);
        vx = new Float32Array(n); vy = new Float32Array(n);
        val = new Float32Array(n); heat = new Float32Array(n);
        chr = new Uint8Array(n); delay = new Float32Array(n);
        // Fly-in order: from the face outward, so the eyes land first
        const fx = cw / 2, fy = ch * 0.32, far = Math.hypot(cw, ch);
        for (let k = 0; k < n; k++) {
            const i = idx[k];
            hx[k] = (i % cols) * CELL + CELL / 2;
            hy[k] = Math.floor(i / cols) * CELL + CELL / 2;
            val[k] = lum[i];
            chr[k] = (Math.random() * HOT.length) | 0;
            delay[k] = 900 * Math.hypot(hx[k] - fx, hy[k] - fy) / far + 120 * Math.random();
            if (entered && t0 === 0) { x[k] = hx[k]; y[k] = hy[k]; }
            else {
                const a = Math.random() * 6.283, r = 0.35 * far + 0.4 * far * Math.random();
                x[k] = fx + Math.cos(a) * r;
                y[k] = fy + Math.sin(a) * r;
            }
        }
        return true;
    }

    function draw() {
        ctx.fillStyle = PLATE;
        ctx.fillRect(0, 0, cw, ch);
        ctx.font = `400 ${CELL}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Two passes so fillStyle changes twice per frame, not per glyph
        ctx.fillStyle = PAPER;
        for (let k = 0; k < n; k++) {
            if (heat[k] > 0.35) continue;
            ctx.globalAlpha = 0.2 + 0.8 * val[k];
            ctx.fillText(RAMP[Math.round(val[k] * (RAMP.length - 1))], x[k], y[k]);
        }
        ctx.fillStyle = LIME;
        for (let k = 0; k < n; k++) {
            if (heat[k] <= 0.35) continue;
            ctx.globalAlpha = Math.min(1, 0.4 + heat[k]);
            ctx.fillText(HOT[chr[k]], x[k], y[k]);
        }
        ctx.globalAlpha = 1;
    }

    function step(now) {
        raf = 0;
        const t = now - t0;
        if (now - lastScan > SCAN_EVERY && scanY < 0 && visible) { scanY = 0; lastScan = now; }
        if (scanY >= 0) { scanY += 9; if (scanY > ch + 20) scanY = -1; }
        for (let j = rings.length - 1; j >= 0; j--) {
            rings[j].r += 14;
            if (rings[j].r > Math.hypot(cw, ch)) rings.splice(j, 1);
        }
        let busy = rings.length > 0 || scanY >= 0;
        const R2 = R * R;
        for (let k = 0; k < n; k++) {
            if (t < delay[k]) { busy = true; continue; }
            let ax = (hx[k] - x[k]) * 0.075, ay = (hy[k] - y[k]) * 0.075;
            if (inside) {
                const dx = x[k] - px, dy = y[k] - py, d2 = dx * dx + dy * dy;
                if (d2 < R2 && d2 > 0.01) {
                    const dd = Math.sqrt(d2), f = (1 - dd / R) * 2.4;
                    ax += dx / dd * f;
                    ay += dy / dd * f;
                    heat[k] = Math.max(heat[k], 1 - dd / R);
                }
            }
            for (const ring of rings) {
                const dx = hx[k] - ring.x, dy = hy[k] - ring.y, dd = Math.hypot(dx, dy) || 1;
                if (Math.abs(dd - ring.r) < 10) {
                    ax += dx / dd * 3.2 * ring.p;
                    ay += dy / dd * 3.2 * ring.p;
                    heat[k] = Math.max(heat[k], ring.p);
                }
            }
            if (scanY >= 0 && Math.abs(hy[k] - scanY) < 6) heat[k] = Math.max(heat[k], 0.7);
            vx[k] = (vx[k] + ax) * 0.8;
            vy[k] = (vy[k] + ay) * 0.8;
            x[k] += vx[k];
            y[k] += vy[k];
            if (heat[k] > 0) {
                heat[k] = heat[k] < 0.01 ? 0 : heat[k] * 0.93;
                if (Math.random() < 0.25) chr[k] = (Math.random() * HOT.length) | 0;
                busy = true;
            }
            if (vx[k] * vx[k] + vy[k] * vy[k] > 0.0004 || Math.abs(hx[k] - x[k]) > 0.3) busy = true;
        }
        for (const ring of rings) ring.p *= 0.985;
        draw();
        if ((busy || inside) && visible) raf = requestAnimationFrame(step);
    }

    const wake = () => { if (!raf && visible && entered && !REDUCED) raf = requestAnimationFrame(step); };

    function start() {
        if (!loaded || !fontReady || !build()) return;
        draw();
        if (entered) wake();
    }

    if (!REDUCED) {
        // Fly in the first time the plate is on screen; run the loop only while it stays there
        new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible && !entered) { entered = true; t0 = performance.now(); lastScan = t0; }
            if (visible) wake();
        }, { threshold: 0.25 }).observe(frame);

        const at = (e) => {
            const b = canvas.getBoundingClientRect();
            px = e.clientX - b.left;
            py = e.clientY - b.top;
        };
        canvas.addEventListener('pointermove', (e) => { at(e); inside = true; wake(); });
        canvas.addEventListener('pointerleave', () => { inside = false; px = py = -1e4; });
        canvas.addEventListener('pointerdown', (e) => {
            at(e);
            rings.push({ x: px, y: py, r: 0, p: 1 });
            if (rings.length > 4) rings.shift();
            wake();
        });
        // A tap on touch is a shockwave, not a lingering pointer
        canvas.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') { inside = false; px = py = -1e4; } });
    }

    img.onload = () => { loaded = true; start(); };
    img.onerror = () => { canvas.remove(); };
    img.src = '/portrait.jpg';

    // The glyph face is lazy-loaded; draw only once it is in, so the first frame is final
    const faces = document.fonts && document.fonts.load
        ? document.fonts.load(`400 ${CELL}px "JetBrains Mono"`)
        : Promise.resolve();
    faces.catch(() => {}).then(() => { fontReady = true; start(); });

    let lastW = 0;
    new ResizeObserver(() => {
        const w = canvas.clientWidth;
        if (w === lastW) return;
        lastW = w;
        const fresh = t0 === 0 || performance.now() - t0 > 2000;
        if (fresh && entered) t0 = -1e9;     // a resize after the fly-in rebuilds in place, no second fly-in
        start();
        if (fresh && entered) { for (let k = 0; k < n; k++) { x[k] = hx[k]; y[k] = hy[k]; } draw(); }
    }).observe(canvas);
}
