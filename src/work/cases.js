/**
 * work/cases.js - the four case-study drawings (6.2.2 to 6.2.5) and their text entrances.
 * Every drawing owns a fixed seed, so strokes never change between loads.
 * Boil is applied only to the strokes the spec names; labels and lime fills stay crisp.
 */

import { ink, label, fillBlock } from '../doodle/draw.js';
import { doodle } from '../doodle/paths.js';
import { drawOn, reveal, pop, gsap, REDUCED } from '../motion/core.js';

const byId = (id) => document.getElementById(id);
// On phones the 640-wide drawings shrink to about half size, so the 640 and 1200 wide labels scale up to stay readable
const PHONE = window.matchMedia('(max-width: 767px)').matches;
const mono = (svg, x, y, text, size = 18, anchor = 'middle', up = 1) => label(svg, x, y, text, { font: 'mono', size: PHONE ? Math.round(size * 1.5 * up) : size, anchor });
const hand = (svg, x, y, text, size = 26, anchor = 'middle', up = 1) => label(svg, x, y, text, { font: 'hand', size: PHONE ? Math.round(size * 1.3 * up) : size, anchor });
// Kronos labels are only used where the layout is already sized for the viewport
const monoFixed = (svg, x, y, text, size = 18, anchor = 'middle') => label(svg, x, y, text, { font: 'mono', size, anchor });

// Labels and lime fills are not strokes: they fade in just after the pen passes.
function fadeIn(svg, nodes, delay = .4) {
    if (REDUCED || !nodes.length) return;
    gsap.fromTo(nodes, { opacity: 0 }, {
        opacity: 1,
        duration: .4,
        delay,
        stagger: .05,
        ease: 'power3.out',
        scrollTrigger: { trigger: svg, start: 'top 80%', once: true },
    });
}

// Collects every stroke in the order it should be drawn.
function pen(svg) {
    const order = [];
    return {
        order,
        put(strokes) {
            const made = ink(svg, strokes);
            order.push(...made);
            return made;
        },
    };
}

// ---------------------------------------------------------------- 6.2.2 The Health Factory
function thf() {
    const svg = byId('thf-art');
    if (!svg) return;
    const d = doodle(201);
    const { order, put } = pen(svg);
    const tags = [];

    // The ledger, then an arrow to each of three independent checkers
    put([{ d: d.rect(30, 60, 220, 300), w: 6 }, { d: d.scrib(50, 90, 180, 7, 34), w: 4 }]);
    for (let i = 0; i < 3; i++) {
        const y = 70 + i * 110;
        put([{ d: d.arrow(250, 210, 380, 105 + i * 110, 30 - i * 30), w: 4, boil: true }]);
        put([{ d: d.rect(380, y, 150, 70), w: 5 }]);
        tags.push(mono(svg, 396, y + 42, 'CHECK', 18, 'start'));
        put([{ d: d.check(486, y + 22, 30), w: 9, boil: true }]);
    }
    // The halo: all three are re-derived
    put([{ d: d.circle(455, 215, 168, 1.06), w: 4 }]);
    tags.push(hand(svg, 455, 452, 're-derived before it ships'));
    // Out to a tiny dashboard
    put([{ d: d.arrow(545, 215, 625, 215, 0), w: 4, boil: true }, { d: d.rect(628, 185, 24, 60), w: 5 }]);

    // Draw the whole case drawing once as it enters
    drawOn(order, { dur: .6, stagger: .05 });
    fadeIn(svg, tags);
}

// ---------------------------------------------------------------- 6.2.3 Options pricer
function pricer() {
    const svg = byId('pricer-art');
    if (!svg) return;
    const d = doodle(202);
    const tags = [];
    const smile = [0, 28, 44, 52, 44, 28, 0];
    const top = (i) => 180 + smile[i];
    const cx = (i) => 40 + i * 82 + 32;

    // Seven strikes along a shallow smile: the first solved cold, the rest warm
    const boxes = [];
    for (let i = 0; i < 7; i++) boxes.push(...ink(svg, [{ d: d.rect(40 + i * 82, top(i), 64, 48), w: 5 }]));
    boxes.push(...ink(svg, [{ d: d.circle(cx(0), top(0) + 24, 52, 1.1), w: 4 }]));
    tags.push(hand(svg, cx(0), top(0) + 104, 'cold'));

    // Each solve hands its answer to the next strike
    const arrows = [];
    for (let i = 0; i < 6; i++) {
        arrows.push(...ink(svg, [{ d: d.arrow(cx(i), top(i) - 6, cx(i + 1), top(i + 1) - 6, -22, 12), w: 4, boil: true }]));
    }
    tags.push(hand(svg, (cx(5) + cx(6)) / 2, top(5) - 40, 'warm'));
    // Highlighter under the middle three arrows
    tags.push(fillBlock(svg, cx(2), top(2) - 22, cx(5) - cx(2), 30));

    // Boxes first, then the arrows a beat later
    drawOn(boxes, { dur: .55, stagger: .05 });
    drawOn(arrows, { dur: .5, stagger: .06, delay: .3 });
    fadeIn(svg, tags, .6);
}

// ---------------------------------------------------------------- 6.2.4 Kronos NSE
function kronosWide() {
    const svg = byId('kronos-art');
    if (!svg) return;
    const d = doodle(203);
    const { order, put } = pen(svg);
    const tags = [];
    const names = ['VIX', 'PCR', 'FLOW', 'BASIS', 'MACRO'];

    // Five inputs, converging arrows into one score
    names.forEach((n, i) => {
        const y = 30 + i * 62;
        put([{ d: d.rect(40, y, 150, 44), w: 5 }]);
        tags.push(monoFixed(svg, 115, y + 28, n));
        put([{ d: d.arrow(190, y + 22, 466, 180 + (i - 2) * 10, (2 - i) * 12, 16), w: 4, boil: true }]);
    });
    put([{ d: d.circle(520, 180, 52, 1.1), w: 5 }]);
    tags.push(monoFixed(svg, 520, 190, 'z', 28));

    // The gate, then the regime
    put([{ d: d.arrow(575, 180, 700, 180, 0), w: 4 }]);
    put([{ d: d.line(720, 110, 720, 250, 2), w: 6 }, { d: d.line(760, 110, 760, 250, 2), w: 6 }, { d: d.check(728, 165, 28), w: 9 }]);
    tags.push(monoFixed(svg, 740, 282, 'GATE'));
    put([{ d: d.arrow(790, 180, 900, 180, 0), w: 4 }, { d: d.rect(910, 150, 230, 60), w: 5 }]);
    tags.push(monoFixed(svg, 1025, 188, 'REGIME', 22));

    // Draw left to right once
    drawOn(order, { dur: .5, stagger: .06 });
    fadeIn(svg, tags);
}

// The same flow as a vertical layout for phones; CSS shows one of the two
function kronosTall() {
    const svg = byId('kronos-art-tall');
    if (!svg) return;
    const d = doodle(213);
    const { order, put } = pen(svg);
    const tags = [];
    const names = ['VIX', 'PCR', 'FLOW', 'BASIS', 'MACRO'];

    names.forEach((n, i) => {
        const x = 6 + i * 69;
        put([{ d: d.rect(x, 16, 63, 40), w: 5 }]);
        tags.push(monoFixed(svg, x + 31.5, 41, n, 13));
        put([{ d: d.arrow(x + 31, 62, 180 + (i - 2) * 14, 150, (i - 2) * 8, 12), w: 4, boil: true }]);
    });
    put([{ d: d.circle(180, 190, 40, 1.1), w: 5 }]);
    tags.push(monoFixed(svg, 180, 198, 'z', 26));

    put([{ d: d.arrow(180, 236, 180, 296, 0, 14), w: 4 }]);
    put([{ d: d.line(110, 310, 250, 310, 2), w: 6 }, { d: d.line(110, 356, 250, 356, 2), w: 6 }, { d: d.check(166, 318, 30), w: 9 }]);
    tags.push(monoFixed(svg, 266, 339, 'GATE', 13, 'start'));
    put([{ d: d.arrow(180, 372, 180, 452, 0, 14), w: 4 }, { d: d.rect(65, 466, 230, 60), w: 5 }]);
    tags.push(monoFixed(svg, 180, 503, 'REGIME', 20));

    // Draw top to bottom once
    drawOn(order, { dur: .5, stagger: .06 });
    fadeIn(svg, tags);
}

// ---------------------------------------------------------------- 6.2.5 NSE trading desk
function desk() {
    const svg = byId('desk-art');
    if (!svg) return;
    const d = doodle(204);
    const tags = [];
    const upper = [];
    const lower = [];
    const add = (list, strokes) => list.push(...ink(svg, strokes));

    // Top half: two engines, matched to the decimal
    add(upper, [{ d: d.rect(40, 40, 200, 110), w: 6 }, { d: d.rect(400, 40, 200, 110), w: 6 }]);
    tags.push(mono(svg, 140, 102, 'PYTHON', 22), mono(svg, 500, 102, 'RUST', 22));
    add(upper, [{ d: d.line(262, 50, 378, 50, 3), w: 5 }, { d: d.line(262, 68, 378, 68, 3), w: 5 }]);
    add(upper, [{ d: d.circle(320, 108, 36, 1.1), w: 4 }, { d: d.check(300, 88, 40), w: 9 }]);
    tags.push(hand(svg, 320, 190, 'to the decimal'));

    // Bottom half: an order, two approvals, nine gates, a kill switch
    add(lower, [{ d: d.rect(40, 300, 120, 60), w: 5 }]);
    tags.push(mono(svg, 100, 336, 'ORDER'));
    add(lower, [{ d: d.arrow(160, 330, 214, 330, 0, 14), w: 4 }]);
    add(lower, [{ d: d.line(224, 300, 224, 360, 2), w: 6 }, { d: d.line(244, 300, 244, 360, 2), w: 6 }]);
    tags.push(hand(svg, 234, 282, 'approval 1', 22));
    add(lower, [{ d: d.arrow(254, 330, 294, 330, 0, 12), w: 4 }]);
    add(lower, [{ d: d.line(304, 300, 304, 360, 2), w: 6 }, { d: d.line(324, 300, 324, 360, 2), w: 6 }]);
    tags.push(hand(svg, 314, 392, 'approval 2', 22));
    add(lower, [{ d: d.arrow(334, 330, 366, 330, 0, 12), w: 4 }]);
    const ticks = [];
    for (let k = 0; k < 9; k++) ticks.push({ d: d.line(376 + k * 12, 314, 376 + k * 12, 346, 1), w: 4 });
    add(lower, ticks);
    tags.push(hand(svg, 424, PHONE ? 428 : 392, 'nine gates', 22));
    add(lower, [{ d: d.arrow(486, 330, 514, 330, 0, 12), w: 4 }]);
    add(lower, [{ d: d.rect(520, 290, 80, 80), w: 5 }, { d: d.line(540, 352, 582, 306, 3), w: 6 }]);
    tags.push(hand(svg, 560, 404, 'kill'));

    // Top half first, then the bottom half
    drawOn(upper, { dur: .55, stagger: .05 });
    drawOn(lower, { dur: .5, stagger: .05, delay: .5 });
    fadeIn(svg, tags, .6);
}

// ---------------------------------------------------------------- text entrances
function entrances() {
    document.querySelectorAll('.case').forEach((sec) => {
        const text = sec.querySelector('.case-text');
        if (!text) return;
        Array.from(text.children).forEach((el) => {
            if (el.classList.contains('facts')) {
                // Bullets land one after another as the list enters
                reveal(el.children, { stagger: .06 });
            } else if (el.querySelector(':scope > .chip')) {
                // The chip springs in when it is reached
                pop(el.firstElementChild, { start: 'top 88%' });
            } else {
                // Each block rises once as it enters
                reveal(el, { stagger: 0 });
            }
        });
    });
}

export function initCases() {
    entrances();
    thf();
    pricer();
    kronosWide();
    kronosTall();
    desk();
}
