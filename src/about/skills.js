/**
 * about/skills.js - the drawn grid behind the skills table: an outline and three
 * row rules, measured from the laid-out table after fonts, rebuilt on width change.
 */

import { gsap, drawOn, onFontsReady } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink } from '../doodle/draw.js';

export function initSkills() {
    const wrap = document.getElementById('skills-wrap');
    const svg = wrap && wrap.querySelector('.skills-ink');
    const table = document.getElementById('skills-table');
    if (!svg || !table) return;
    const rows = Array.from(table.tBodies[0].rows);
    let ctx = null;
    let first = true;
    let lastW = 0;
    let lastH = 0;
    let timer = 0;

    function build() {
        if (ctx) ctx.revert();
        svg.textContent = '';
        const W = table.offsetWidth;
        const H = table.offsetHeight;
        lastW = W;
        lastH = H;
        if (!W || !H) return;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const d = doodle(304);
        const strokes = [{ d: d.rect(0, 0, W, H, 6), w: 6 }];
        rows.slice(1).forEach((tr) => strokes.push({ d: d.line(0, tr.offsetTop, W, tr.offsetTop, 3), w: 4 }));
        // A rebuild after a resize draws finished, so nothing replays
        const paths = ink(svg, strokes, { drawn: !first });
        if (first) {
            first = false;
            ctx = gsap.context(() => {
                // Draw the table grid once as it enters
                drawOn(paths, { trigger: wrap, start: 'top 80%', dur: .6, stagger: .08 });
            });
        }
    }

    onFontsReady(() => {
        build();
        const ro = new ResizeObserver(() => {
            if (table.offsetWidth === lastW && table.offsetHeight === lastH) return;
            clearTimeout(timer);
            timer = setTimeout(build, 150);
        });
        ro.observe(table);
    });
}
