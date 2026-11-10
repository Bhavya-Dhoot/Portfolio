/**
 * home/tools.js - the ten-tool grid, and the ONE benchmark run of the page.
 * benchmarkChain({ repeats: 40 }) runs once after first paint; the proof board (row 3)
 * and the six solver cells both read that single result through benchResult().
 */

import { drawOn, swipe, reveal } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink } from '../doodle/draw.js';
import { benchmarkChain } from '../tools/ivsolver.js';

let benchPromise = null;

/** Memoised: the first call schedules the run, every later call gets the same promise. */
export function benchResult() {
    if (!benchPromise) {
        benchPromise = new Promise((resolve, reject) => {
            const run = () => {
                try { resolve(benchmarkChain({ repeats: 40 })); } catch (err) { reject(err); }
            };
            // After first paint: idle time if the browser has it, otherwise the next task
            if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2500 });
            else setTimeout(run, 0);
        });
    }
    return benchPromise;
}

export function initTools() {
    benchResult();

    const sec = document.getElementById('tools');
    if (!sec) return;

    // Ten drawn boxes, one seed each so every box keeps its own wobble
    const all = [];
    sec.querySelectorAll('.tool-svg').forEach((svg, i) => {
        all.push(...ink(svg, [{ d: doodle(103 + i).rect(6, 6, 228, 84), w: 5 }]));
    });

    // Headline lands first, then the single lime swipe on its second line
    reveal(sec.querySelectorAll('.sec-head > *'), { start: 'top 85%' });
    swipe(sec.querySelector('.tools-h'), { start: 'top 85%', delay: .6 });

    // Boxes draw on together as the grid enters; labels and notes follow
    const grid = sec.querySelector('.tool-grid');
    drawOn(all, { stagger: .04, dur: .4, start: 'top 80%', trigger: grid });
    reveal(sec.querySelectorAll('.tool-body'), { stagger: .03, delay: .2, start: 'top 80%' });
    const notes = sec.querySelectorAll('.tool-note');
    if (notes.length) reveal(notes, { stagger: .1, delay: .5, start: 'top 80%' });
}
