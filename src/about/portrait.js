/**
 * about/portrait.js - the one canvas on the site.
 * /portrait.jpg as luminance-mapped glyphs, ink on paper, drawn once and static:
 * no cursor spotlight, no ticker. A hand-drawn frame inks on first, then the
 * glyphs fade in over it.
 */

import { gsap, REDUCED, drawOn } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink } from '../doodle/draw.js';

const NS = 'http://www.w3.org/2000/svg';
const RAMP = ' .:-=+*#%@';           // light -> dense
const CELL = 5;                      // CSS px per glyph cell
const INK = '10, 10, 10';
const FLOOR = 0.14;                  // below this the pixel is background and stays paper

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

    const alphaAt = (v) => 0.2 + Math.pow(v, 1.2) * 0.8;
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
        lum = new Float32Array(cols * rows);
        for (let i = 0; i < cols * rows; i++) {
            const raw = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
            // Dark-lift so the black suit separates from the black background
            lum[i] = Math.min(1, Math.pow(raw, 0.55) * 1.6);
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
                if (v < FLOOR) continue;            // true black stays paper
                ctx.fillStyle = `rgba(${INK}, ${alphaAt(v)})`;
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
