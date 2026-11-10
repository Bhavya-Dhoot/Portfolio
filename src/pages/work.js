/**
 * Work - five case studies, the open-source row and the further builds.
 */

import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/work.css';

import { boot } from '../app.js';
import { pop } from '../motion/core.js';
import { ink } from '../doodle/draw.js';
import { doodle } from '../doodle/paths.js';
import { initCases } from '../work/cases.js';
import { initOss, initMore } from '../work/oss.js';

boot();

// Link arrows: the same generator as the home page, 4px stroke, static and already drawn
const arrows = doodle(109);
document.querySelectorAll('a.link > svg').forEach((svg) => {
    ink(svg, [{ d: arrows.arrow(3, 13, 42, 13, 5, 12), w: 4 }], { drawn: true });
});

// Intro: the headline and hand line are HTML, painted at first frame (they are the LCP); only the anchor chips spring in
document.querySelectorAll('.chip-row .chip-btn').forEach((chip, i) => {
    pop(chip, { start: null, delay: .15 + i * .05 });
});

initCases();
initOss();
initMore();
