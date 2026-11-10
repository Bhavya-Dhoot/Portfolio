/**
 * paths.js - seeded doodle path generators.
 * hand-drawn by brief: brag-styles doodle
 *
 * Lifted from the brag-styles doodle engine (ref/engine.html L58-126). The only
 * change is the seed: every drawing owns its own generator, so a re-render is
 * deterministic and strokes never jump between loads or navigations.
 * Every function returns an SVG path `d` string.
 */

/** LCG 16807 (Park-Miller). Returns () => number in [0, 1). */
export function makeRng(seed = 20260929) {
    let s = Math.floor(seed) % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function doodle(seed) {
    const rnd = makeRng(seed);
    const J = (a) => (rnd() - .5) * 2 * a;
    const f1 = (v) => v.toFixed(1);
    const P = (x, y) => `${f1(x)} ${f1(y)}`;

    // jittered quadratic
    function line(x1, y1, x2, y2, bend = 5) {
        const mx = (x1 + x2) / 2 + J(bend), my = (y1 + y2) / 2 + J(bend);
        return `M${P(x1 + J(2), y1 + J(2))} Q${P(mx, my)} ${P(x2 + J(2), y2 + J(2))}`;
    }

    // four overshooting lines
    function rect(x, y, w, h, over = 9) {
        const o = over;
        return [
            line(x - o * rnd(), y, x + w + o * rnd(), y),
            line(x + w, y - o * rnd(), x + w, y + h + o * rnd()),
            line(x + w + o * rnd(), y + h, x - o * rnd(), y + h),
            line(x, y + h + o * rnd(), x, y - o * rnd()),
        ].join(' ');
    }

    // 56-segment wobbly loop; turn > 1 overlaps the start like a real pen
    function circle(cx, cy, r, turn = 1.1, a0 = -2.2) {
        const n = 56;
        let d = '';
        for (let i = 0; i <= n; i++) {
            const a = a0 + (i / n) * Math.PI * 2 * turn, rr = r * (1 + J(.025) + (i / n) * .05);
            d += (i ? ' L' : 'M') + P(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        return d;
    }

    // circle remapped onto two radii
    function ellipse(cx, cy, rx, ry) {
        return circle(0, 0, 1000, 1.1).replace(/(-?\d+\.\d) (-?\d+\.\d)/g,
            (m, x, y) => `${f1(cx + x / 1000 * rx)} ${f1(cy + y / 1000 * ry)}`);
    }

    // simple arc as a polyline
    function arc(cx, cy, r, a1, a2) {
        let d = '';
        const n = 24;
        for (let i = 0; i <= n; i++) {
            const a = a1 + (a2 - a1) * i / n;
            d += (i ? ' L' : 'M') + P(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        return d;
    }

    function arrow(x1, y1, x2, y2, bend = 40, head = 24) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
        const cx = mx - dy / L * bend, cy = my + dx / L * bend;
        const a = Math.atan2(y2 - cy, x2 - cx);
        return `M${P(x1, y1)} Q${P(cx, cy)} ${P(x2, y2)} M${P(x2 - Math.cos(a - .5) * head, y2 - Math.sin(a - .5) * head)} L${P(x2, y2)} L${P(x2 - Math.cos(a + .5) * head, y2 - Math.sin(a + .5) * head)}`;
    }

    const check = (x, y, s) => `M${P(x, y + s * .5)} L${P(x + s * .35, y + s * .88)} L${P(x + s, y)}`;
    const cross = (x, y, s) => `${line(x, y, x + s, y + s, 3)} ${line(x + s, y, x, y + s, 3)}`;

    // n handwriting lines; the last one is short
    function scrib(x, y, w, n, gap = 26) {
        let d = '';
        for (let i = 0; i < n; i++) {
            const ww = i === n - 1 ? w * (.4 + rnd() * .3) : w * (.85 + rnd() * .15), yy = y + i * gap;
            d += ` M${P(x, yy)}`;
            let cx = x;
            while (cx < x + ww) {
                const st = 18 + rnd() * 14;
                d += ` Q${P(cx + st / 2, yy + J(6))} ${P(Math.min(cx + st, x + ww), yy + J(1.5))}`;
                cx += st;
            }
        }
        return d.trim();
    }

    function spark(x, y, s) {
        return [0, 1, 2, 3].map((k) => {
            const a = k * Math.PI / 2 + .3;
            return line(x + Math.cos(a) * s * .35, y + Math.sin(a) * s * .35, x + Math.cos(a) * s, y + Math.sin(a) * s, 1);
        }).join(' ');
    }

    // wipe scribble
    function zig(x, y, w, h, rows) {
        let d = `M${P(x, y)}`;
        for (let i = 1; i <= rows; i++) d += ` L${P(i % 2 ? x + w : x, y + (h * i) / rows + J(20))}`;
        return d;
    }

    return { line, rect, circle, ellipse, arc, arrow, check, cross, scrib, spark, zig, rnd };
}
