/**
 * home/proof.js - the proof board. Five numbers, strongest first, each counted up once on enter.
 * Row 3 is not static: its value is computed from the page's single benchmark run.
 */

import { gsap, ScrollTrigger, REDUCED, drawOn, stamp, countUp, reveal } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink, label } from '../doodle/draw.js';
import { benchResult } from './tools.js';

const START = 'top 78%';

function setBox(svg, w, h) {
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
}

/** Per-row ornaments, all hand strokes with their own seeds. Returns the paths to draw on. */
function ornament(kind, svg, seed) {
    const d = doodle(seed);
    if (kind === 'ledger') {
        // A small ledger page to the right of the line
        setBox(svg, 140, 100);
        return ink(svg, [
            { d: d.rect(10, 8, 120, 80), w: 4 },
            { d: d.scrib(22, 28, 96, 3, 18), w: 4 },
        ]);
    }
    if (kind === 'queries') {
        // 136 struck through, an arrow, and a circled 9
        setBox(svg, 300, 110);
        const paths = ink(svg, [
            { d: d.line(0, 66, 100, 46, 3), w: 5 },
            { d: d.arrow(106, 60, 192, 60, 18), w: 4 },
            { d: d.circle(246, 58, 40, 1.1), w: 4 },
        ]);
        paths.labels = [
            // ponytail: mono, not hand - Patrick Hand's 1 read as a 4 under the strike
            label(svg, 6, 72, '136', { font: 'mono', size: 38 }),
            label(svg, 234, 72, '9', { font: 'mono', size: 40 }),
        ];
        return paths;
    }
    if (kind === 'check') {
        setBox(svg, 56, 48);
        return ink(svg, [{ d: d.check(6, 6, 34), w: 9 }]);
    }
    return [];
}

export function initProof(bench) {
    const sec = document.getElementById('proof');
    if (!sec) return;

    // Section header: plain reveal
    reveal(sec.querySelectorAll('.sec-head > *'), { start: 'top 85%' });

    sec.querySelectorAll('.proof-row').forEach((row, i) => {
        const kind = row.dataset.row;
        const big = row.querySelector('.big');
        const copy = row.querySelectorAll('.proof-line, .fact-l');
        const orn = row.querySelector('svg.orn');
        const ring = row.querySelector('svg.proof-ring');
        const badge = row.querySelector('.stamp');

        // Text rises in as the row enters
        reveal(copy, { start: START, stagger: .08 });

        if (kind === 'live') {
            // Value arrives from the one benchmark run; count it up the first time both it and the row are ready
            let entered = false;
            let value = null;
            let played = false;
            const play = () => {
                if (played || !entered || value === null) return;
                played = true;
                // Count the measured percentage up, then stamp it as measured here
                countUp(big, { to: value, suffix: '%', start: null });
                if (badge) stamp(badge, { start: null, delay: .6 });
            };
            if (badge && !REDUCED) gsap.set(badge, { opacity: 0, '--sc': 2.4 });
            ScrollTrigger.create({ trigger: row, start: START, once: true, onEnter: () => { entered = true; play(); } });
            (bench || benchResult()).then((r) => {
                value = Math.round((1 - r.warmIters / r.coldIters) * 100);
                play();
            }).catch(() => { /* the placeholder stays: no number is better than a made-up one */ });
            return;
        }

        // Static figures: count up from zero, the text in HTML is the final value
        countUp(big, { to: Number(big.dataset.to), suffix: big.dataset.suffix || '', start: START });

        if (ring) {
            // Row 1: an ellipse circling the number, drawn just after the count starts
            setBox(ring, 200, 110);
            const p = ink(ring, [{ d: doodle(111).ellipse(100, 55, 92, 46), w: 4 }]);
            drawOn(p, { dur: .45, delay: .45, start: START, trigger: row });
        }
        if (orn) {
            const p = ornament(orn.dataset.orn, orn, 112 + i);
            drawOn(p, { dur: .45, stagger: .08, delay: .45, start: START, trigger: row });
            if (p.labels && !REDUCED) {
                // The hand-written numbers arrive with their strokes
                gsap.fromTo(p.labels, { opacity: 0 }, {
                    opacity: 1, duration: .3, delay: .7, stagger: .25,
                    scrollTrigger: { trigger: row, start: START, once: true },
                });
            }
        }
        if (badge) stamp(badge, { start: START, delay: .3 });
    });
}
