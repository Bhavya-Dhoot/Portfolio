/**
 * home/selected.js - four shipped things as an index list on one hand-drawn vertical line.
 */

import { drawOn, swipe, reveal } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink } from '../doodle/draw.js';

export function initSelected() {
    const sec = document.getElementById('selected');
    if (!sec) return;

    const d = doodle(108);
    const rows = Array.from(sec.querySelectorAll('.sel-row'));

    // The shared line: stretched with the list, strokes stay constant width
    const spine = sec.querySelector('.sel-spine');
    spine.setAttribute('viewBox', '0 0 28 1000');
    spine.setAttribute('preserveAspectRatio', 'none');
    const line = ink(spine, [{ d: d.line(14, 0, 14, 1000, 6), w: 4 }]);

    // One small circle per row, sitting on the line
    const nodes = rows.map((row, i) => {
        const svg = row.querySelector('.sel-node');
        svg.setAttribute('viewBox', '0 0 28 28');
        return ink(svg, [{ d: d.circle(14, 14, 9, 1.1), w: 4 }])[0];
    });

    // Motion: the line draws once, rows rise in, only the first stat is swiped
    reveal(sec.querySelectorAll('.sec-head > *'), { start: 'top 85%' });
    drawOn(line, { dur: .6, start: 'top 75%', trigger: sec.querySelector('.sel') });
    drawOn(nodes, { stagger: .12, dur: .4, delay: .2, start: 'top 75%', trigger: sec.querySelector('.sel') });
    reveal(rows, { stagger: .08, start: 'top 80%' });
    swipe(rows[0], { start: 'top 80%', delay: .5 });
}
