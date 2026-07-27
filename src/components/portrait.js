/**
 * portrait.js — ASCII portrait for the About section
 * Luminance-mapped glyphs on canvas from /portrait.jpg, with a thin accent
 * halo tracing the silhouette edge. Static at rest; a cursor spotlight tints
 * glyphs toward the accent, echoing the hero grid's cursor language.
 */

const RAMP = ' .:-=+*#%@';           // dark -> bright
const CELL = 5;                      // CSS px per glyph cell
const SPOT_R = 130;                  // cursor spotlight radius, CSS px
const ACCENT = '200, 255, 0';
const PAPER = '240, 237, 232';
const FLOOR = 0.055;                 // below this the subject is background

export function initPortrait() {
    const wrap = document.getElementById('about-portrait');
    if (!wrap) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    wrap.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cw = 0, ch = 0;              // CSS size
    let dpr = 1;
    let cols = 0, rows = 0;
    let lum = null;                  // Float32Array luminance grid, 0..1
    let glow = null;                 // pre-rendered edge halo
    let field = null;                // pre-rendered glyph field at rest
    let mouse = { x: -1e4, y: -1e4 };
    let rafPending = false;

    const img = new Image();
    img.src = '/portrait.jpg';
    img.onload = resize;
    img.onerror = () => {
        console.warn('[portrait] /portrait.jpg failed to load');
        canvas.remove();
    };

    // Offscreen canvas at device resolution, drawn in CSS px units
    function layer() {
        const el = document.createElement('canvas');
        el.width = Math.max(1, Math.round(cw * dpr));
        el.height = Math.max(1, Math.round(ch * dpr));
        const c = el.getContext('2d');
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { el, c };
    }

    function resize() {
        const rect = wrap.getBoundingClientRect();
        if (!rect.width || !rect.height || !img.naturalWidth) return;
        cw = rect.width;
        ch = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.floor(cw / CELL);
        rows = Math.floor(ch / CELL);
        sample();
        buildGlow();
        buildField();
        draw();
    }

    function setGlyphFont(c) {
        c.font = `500 ${CELL}px "JetBrains Mono", monospace`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
    }

    const alphaAt = (v) => 0.12 + Math.pow(v, 1.3) * 0.88;
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
            // Dark-lift so the black suit separates from a black background
            lum[i] = Math.min(1, Math.pow(raw, 0.82) * 1.3);
        }
    }

    // Silhouette mask with interior holes filled. Dark folds in the jacket dip
    // below FLOOR and would otherwise each grow their own rim, so the
    // background is flood-filled inward from the borders: any empty cell it
    // cannot reach is an interior hole and gets closed. Concavities the border
    // can reach (the notch beside the neck) are preserved.
    function silhouette() {
        const n = cols * rows;
        const mask = new Uint8Array(n);
        for (let i = 0; i < n; i++) mask[i] = lum[i] >= FLOOR ? 1 : 0;

        const outside = new Uint8Array(n);
        const stack = [];
        const visit = (c, r) => {
            const i = r * cols + c;
            if (mask[i] || outside[i]) return;
            outside[i] = 1;
            stack.push(i);
        };
        // Seed from the top and sides only: the photo is cropped at the bottom,
        // so the body runs off that edge and seeding there would let the fill
        // eat into the dark lower sleeves and fray the contour.
        for (let c = 0; c < cols; c++) visit(c, 0);
        for (let r = 0; r < rows; r++) { visit(0, r); visit(cols - 1, r); }
        while (stack.length) {
            const i = stack.pop();
            const c = i % cols;
            const r = (i - c) / cols;
            if (c > 0) visit(c - 1, r);
            if (c < cols - 1) visit(c + 1, r);
            if (r > 0) visit(c, r - 1);
            if (r < rows - 1) visit(c, r + 1);
        }
        for (let i = 0; i < n; i++) if (!mask[i] && !outside[i]) mask[i] = 1;
        return mask;
    }

    // Rim light: a wide blur of the solid body minus the body itself, so the
    // halo hugs the outer contour of the jacket and nothing inside it.
    function buildGlow() {
        const mask = silhouette();
        const sil = layer();
        sil.c.fillStyle = `rgba(${ACCENT}, 1)`;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!mask[r * cols + c]) continue;
                sil.c.fillRect(c * CELL, r * CELL, CELL, CELL);
            }
        }

        // Soften the cell stair-steps into a smooth body before differencing
        const solid = layer();
        if (typeof solid.c.filter === 'string') solid.c.filter = 'blur(4px)';
        for (let i = 0; i < 4; i++) solid.c.drawImage(sil.el, 0, 0, cw, ch);

        const g = layer();
        if (typeof g.c.filter === 'string') g.c.filter = 'blur(7px)';
        g.c.drawImage(solid.el, 0, 0, cw, ch);
        g.c.filter = 'none';
        g.c.globalCompositeOperation = 'destination-out';
        g.c.drawImage(solid.el, 0, 0, cw, ch);
        glow = g.el;
    }

    // Glyph field at rest, rendered once — pointer moves only repaint the
    // spotlight disc on top, not all ~20k cells.
    function buildField() {
        const f = layer();
        setGlyphFont(f.c);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const v = lum[r * cols + c];
                if (v < FLOOR) continue;            // true black stays empty
                f.c.fillStyle = `rgba(${PAPER}, ${alphaAt(v)})`;
                f.c.fillText(glyphAt(v), c * CELL + CELL / 2, r * CELL + CELL / 2);
            }
        }
        field = f.el;
    }

    function draw() {
        if (!field) return;
        ctx.clearRect(0, 0, cw, ch);

        if (glow) {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(glow, 0, 0, cw, ch);
            ctx.globalAlpha = 1;
        }
        ctx.drawImage(field, 0, 0, cw, ch);

        if (mouse.x < -SPOT_R) return;

        // Spotlight: repaint only the cells inside the cursor disc
        setGlyphFont(ctx);
        const c0 = Math.max(0, Math.floor((mouse.x - SPOT_R) / CELL));
        const c1 = Math.min(cols - 1, Math.ceil((mouse.x + SPOT_R) / CELL));
        const r0 = Math.max(0, Math.floor((mouse.y - SPOT_R) / CELL));
        const r1 = Math.min(rows - 1, Math.ceil((mouse.y + SPOT_R) / CELL));

        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                const v = lum[r * cols + c];
                if (v < FLOOR) continue;
                const x = c * CELL + CELL / 2;
                const y = r * CELL + CELL / 2;
                const dx = x - mouse.x, dy = y - mouse.y;
                const t = 1 - Math.sqrt(dx * dx + dy * dy) / SPOT_R;
                if (t <= 0) continue;
                ctx.fillStyle = `rgba(${ACCENT}, ${Math.min(1, alphaAt(v) + t * 0.35)})`;
                ctx.fillText(glyphAt(v), x, y);
            }
        }
    }

    function scheduleDraw() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            draw();
        });
    }

    if (!reduced) {
        wrap.addEventListener('pointermove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
            scheduleDraw();
        }, { passive: true });

        wrap.addEventListener('pointerleave', () => {
            mouse.x = -1e4;
            mouse.y = -1e4;
            scheduleDraw();
        });
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    return () => ro.disconnect();
}
