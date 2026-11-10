/**
 * about/thesis.js - the three thesis notes' drawings: a circled drawn numeral on
 * each, and the herd diagram on the second (the only boil group on /about).
 * Seeds are fixed, so strokes never change between loads.
 */

import { drawOn } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink, label } from '../doodle/draw.js';
import { fadeIn } from './fx.js';

// Stem x positions for the drawn numerals I, II, III
const STEMS = [[48], [38, 58], [28, 48, 68]];

function numerals() {
    document.querySelectorAll('.th-num').forEach((svg, i) => {
        svg.setAttribute('viewBox', '0 0 96 96');
        const d = doodle(311 + i);
        const half = i === 0 ? 12 : 7;
        const strokes = [{ d: d.circle(48, 48, 40, 1.08), w: 5 }];
        STEMS[i].forEach((x) => {
            strokes.push({ d: d.line(x, 30, x, 66, 2), w: 5 });
            strokes.push({ d: d.line(x - half, 30, x + half, 30, 2), w: 5 });
            strokes.push({ d: d.line(x - half, 66, x + half, 66, 2), w: 5 });
        });
        const paths = ink(svg, strokes);
        // Circle and numeral ink on once as the note enters
        drawOn(paths, { start: 'top 85%', dur: .4, stagger: .05 });
    });
}

function herd() {
    const svg = document.getElementById('th-herd');
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 520 412');
    const d = doodle(303);
    const boxes = [];
    const arrows = [];
    const names = [];
    // The drawing scales down on a phone, so its words are drawn larger to stay readable
    const phone = matchMedia('(max-width: 767px)').matches;
    const mono = phone ? 24 : 16;
    const hand = phone ? 30 : 22;
    for (let i = 0; i < 5; i++) {
        const y = 14 + i * 72;
        boxes.push({ d: d.rect(10, y, 120, 46, 6), w: 5 });
        // Five parallel arrows, all pointing the same way
        arrows.push({ d: d.arrow(142, y + 23, 328, y + 23, 6, 18), w: 4, boil: true });
    }
    boxes.push({ d: d.rect(352, 14, 150, 334, 6), w: 6 });
    const boxPaths = ink(svg, boxes);
    const arrowPaths = ink(svg, arrows);
    for (let i = 0; i < 5; i++) names.push(label(svg, 70, 14 + i * 72 + 30, 'LLM', { size: mono, anchor: 'middle' }));
    names.push(label(svg, 427, 187, 'MARKET', { size: mono, anchor: 'middle' }));
    names.push(label(svg, 260, 392, 'same model, same trade', { font: 'hand', size: hand, anchor: 'middle' }));
    // Boxes first, then the arrows, then the labels
    drawOn(boxPaths, { trigger: svg, start: 'top 80%', dur: .5, stagger: .05 });
    drawOn(arrowPaths, { trigger: svg, start: 'top 80%', dur: .45, stagger: .06, delay: .35 });
    fadeIn(names, { trigger: svg, start: 'top 80%', delay: .3 });
}

export function initThesis() {
    numerals();
    herd();
}
