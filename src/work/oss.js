/**
 * work/oss.js - the four drawn terminal boxes (6.2.6) and the further-builds index (6.2.7).
 */

import { ink } from '../doodle/draw.js';
import { doodle } from '../doodle/paths.js';
import { drawOn, reveal, stamp, writeOn, onFontsReady } from '../motion/core.js';

const NS = 'http://www.w3.org/2000/svg';

export function initOss() {
    const section = document.getElementById('oss');
    if (!section) return;
    const boxes = Array.from(section.querySelectorAll('.oss-box'));

    // Heading rises once
    reveal(section.querySelector('h2'), { stagger: 0 });

    boxes.forEach((box, i) => {
        // Box text rises once, a beat after its box starts to draw
        reveal(box.querySelectorAll('h3, .oss-desc, .oss-stats, .oss-links'), { stagger: .05, delay: i * .08 });
        // Install line is written on like a typed command
        writeOn(box.querySelector('.oss-install'), { start: 'top 88%' });
        // Stamps land with a thud
        stamp(box.querySelector('.stamp'), { start: 'top 88%', delay: .3 });
    });

    // Drawn boxes: built to each box's measured size once fonts have settled
    onFontsReady(() => {
        boxes.forEach((box, i) => {
            const w = Math.max(40, Math.round(box.offsetWidth));
            const h = Math.max(40, Math.round(box.offsetHeight));
            const head = box.querySelector('h3');
            const bar = head.offsetTop + head.offsetHeight + 9;
            const svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('class', 'ink-svg oss-ink');
            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
            svg.setAttribute('preserveAspectRatio', 'none');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            box.prepend(svg);
            const d = doodle(210 + i);
            const paths = ink(svg, [
                { d: d.rect(4, 4, w - 8, h - 8, 7), w: 6 },
                { d: d.line(4, bar, w - 4, bar, 3), w: 4 },
            ]);
            // Each box draws on once, staggered left to right
            drawOn(paths, { dur: .55, stagger: .1, delay: i * .08, start: 'top 85%', trigger: box });
        });
    });
}

export function initMore() {
    const section = document.getElementById('more');
    if (!section) return;
    const rows = Array.from(section.querySelectorAll('.more-row'));

    reveal(section.querySelector('h2'), { stagger: 0 });
    // Rows land in groups of four
    for (let g = 0; g < rows.length; g += 4) reveal(rows.slice(g, g + 4), { stagger: .04 });

    // A short hand scribble on every third row; lengths differ on purpose
    section.querySelectorAll('svg.more-orn').forEach((svg, i) => {
        const d = doodle(230 + i);
        const paths = ink(svg, [{ d: d.scrib(2, 7, 196, 1), w: 4 }]);
        // Scribble draws on once as its row enters
        drawOn(paths, { dur: .45, start: 'top 90%' });
    });
}
