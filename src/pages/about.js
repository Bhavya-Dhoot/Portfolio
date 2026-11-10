/**
 * About - core copy and portrait, experience timeline, thesis, FAQ, skills.
 * Everything readable is in the HTML; this module only draws and reveals.
 */

import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/about.css';

import { boot } from '../app.js';
import { reveal, writeOn } from '../motion/core.js';
import { swipeMarks } from '../about/fx.js';
import { initPortrait } from '../about/portrait.js';
import { initTimeline } from '../about/timeline.js';
import { initThesis } from '../about/thesis.js';
import { initSkills } from '../about/skills.js';

boot();

initPortrait();
initTimeline();
initThesis();
initSkills();

// The core copy is painted at first paint; its two lime swipes play on load
swipeMarks('.core', { start: null, delay: .7 });

// Hand caption writes on beneath the portrait
writeOn('.portrait figcaption', { start: 'top 92%' });

// Headings, entries, notes, answers and table rows rise once as they enter
document.querySelectorAll('.sec-h, .entry, .th-body, .th-close, .qa, #skills-table tr').forEach((el) => {
    reveal(el, { start: 'top 88%' });
});

// Lime swipe on the leading phrase of the first bullet in entries 01 and 02
document.querySelectorAll('.entry').forEach((li, i) => {
    if (i > 1) return;
    swipeMarks(li.querySelector('.facts > li'), { start: 'top 85%', delay: .4 });
});

// The closing line of the third note
swipeMarks('.th-close', { start: 'top 85%', delay: .5 });
