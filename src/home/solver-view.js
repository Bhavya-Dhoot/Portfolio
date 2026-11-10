/**
 * home/solver-view.js - the solver ladder and the six measured cells.
 * The ladder draws the real Newton iterates for one option, solved cold and warm.
 * The cells are filled from the page's single benchmark run.
 */

import { drawOn, countUp, reveal } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink, label } from '../doodle/draw.js';
import { blackScholes } from '../tools/blackscholes.js';
import { impliedVol, coldGuess } from '../tools/ivsolver.js';
import { benchResult } from './tools.js';

// The option the ladder solves: written here so nothing depends on a deleted file
const S = 100, K = 110, T = 45 / 365, R = 0.065, TRUE_VOL = 0.24;

const W = 560, H = 400;
const COLS = [{ x0: 16, x1: 264 }, { x0: 296, x1: 544 }];
const DOMAIN_MAX = 0.4;
const ROW = 38;

function ladderPaths() {
    const price = blackScholes(S, K, T, TRUE_VOL, R, true).price;
    const cold = impliedVol(price, S, K, T, R, true, coldGuess(price, S, K, T));
    // Warm start: the neighbouring strike's own implied vol, not a number picked to flatter
    const neighbour = impliedVol(blackScholes(S, K - 2, T, 0.2345, R, true).price, S, K - 2, T, R, true, 0.2).iv;
    const warm = impliedVol(price, S, K, T, R, true, neighbour);
    return [cold.path, warm.path];
}

export function initSolver(bench) {
    const sec = document.getElementById('pricer');
    const svg = document.getElementById('ladder-svg');
    if (!sec || !svg) return;

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const d = doodle(106);
    const paths = ladderPaths();
    const xOf = (col, v) => {
        const c = COLS[col];
        const t = Math.min(v, DOMAIN_MAX) / DOMAIN_MAX;
        return c.x0 + 10 + t * (c.x1 - c.x0 - 30);
    };

    const strokes = [];
    // Dashed guide at the converged vol in each column
    const rows = Math.max(paths[0].length, paths[1].length);
    COLS.forEach((c, col) => {
        const x = xOf(col, TRUE_VOL);
        strokes.push({ d: d.line(x, 6, x, 30 + rows * ROW, 2), w: 3, dash: true });
    });
    // Iterates interleaved by row so the stagger reads top to bottom across both columns
    for (let i = 0; i < rows; i++) {
        paths.forEach((path, col) => {
            if (i >= path.length) return;
            const v = path[i];
            const y = 30 + i * ROW;
            const x = xOf(col, v);
            // Each tick carries the thin trail from the previous iterate, so the walk to the answer reads as a path
            const trail = i ? ` ${d.line(xOf(col, path[i - 1]), y - ROW, x, y, 3)}` : '';
            strokes.push({ d: d.line(x - 20, y, x + 20, y, 2) + trail, w: 5 });
            if (v > DOMAIN_MAX) {
                // Newton's first jump overshoots the page; show it leaving rather than hiding it
                strokes.push({ d: d.arrow(x - 4, y - 12, x + 22, y - 12, 0, 10), w: 4 });
            }
            if (i === path.length - 1) strokes.push({ d: d.check(x + 24, y - 18, 22), w: 9 });
        });
    }
    const drawn = ink(svg, strokes);

    // Motion: the ladder draws on once, top to bottom
    drawOn(drawn, { stagger: .1, dur: .45, start: 'top 80%', trigger: svg });
    reveal(sec.querySelectorAll('.solver-h, .solver-text > p, .cells'), { start: 'top 85%', stagger: .08 });

    // ---- cells, filled from the one benchmark run
    const cell = (id) => document.getElementById(id);
    (bench || benchResult()).then((r) => {
        const pct = Math.round((1 - r.warmIters / r.coldIters) * 100);
        countUp(cell('c-cold'), { to: r.coldIters, decimals: 2, start: 'top 85%' });
        countUp(cell('c-warm'), { to: r.warmIters, decimals: 2, start: 'top 85%' });
        countUp(cell('c-pct'), { to: pct, suffix: '%', start: 'top 85%' });
        countUp(cell('c-n'), { to: r.n, start: 'top 85%' });
        cell('c-worst').textContent = `${r.coldWorst} / ${r.warmWorst}`;
        cell('c-err').textContent = r.maxErr.toExponential(1);
    }).catch(() => { /* cells keep their placeholder; nothing is invented */ });
}
