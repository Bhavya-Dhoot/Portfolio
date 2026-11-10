/**
 * about/timeline.js - the hand-drawn spine and the six numbered nodes beside the
 * experience entries. Measured after fonts, from offsets (immune to the reveal
 * transforms), and rebuilt only when the column width changes.
 */

import { gsap, drawOn, onFontsReady } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink, label } from '../doodle/draw.js';
import { fadeIn } from './fx.js';

export function initTimeline() {
    const wrap = document.getElementById('timeline');
    const svg = wrap && wrap.querySelector('.timeline-ink');
    if (!svg) return;
    const entries = Array.from(wrap.querySelectorAll('.entry'));
    let ctx = null;
    let lastW = 0;
    let lastH = 0;
    let timer = 0;

    function build() {
        if (ctx) ctx.revert();
        svg.textContent = '';
        const W = svg.clientWidth;
        const H = wrap.offsetHeight;
        lastW = wrap.clientWidth;
        lastH = wrap.offsetHeight;
        if (!W || !H || !entries.length) return;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const x = W / 2;
        const r = Math.min(18, W / 2 - 5);
        // Node sits on the first line of each organisation name
        const ys = entries.map((li) => {
            const h = li.querySelector('h3');
            const lh = parseFloat(getComputedStyle(h).lineHeight) || h.offsetHeight;
            return li.offsetTop + h.offsetTop + lh / 2;
        });

        const d = doodle(302);
        // One spine, drawn as segments between the nodes so no line crosses a node
        const segs = ys.map((y, i) => d.line(x, y + r, x, i < ys.length - 1 ? ys[i + 1] - r : H, 6));
        const spine = ink(svg, [{ d: segs.join(' '), w: 5 }]);
        const nodes = ink(svg, ys.map((y) => ({ d: d.circle(x, y, r, 1.08), w: 5 })));
        const digits = ys.map((y, i) => label(svg, x, y + 5, String(i + 1).padStart(2, '0'), { size: 13, anchor: 'middle' }));

        ctx = gsap.context(() => {
            // The spine is the one scrubbed element on /about: the reader draws it by scrolling
            drawOn(spine, { scrub: .6, trigger: wrap, start: 'top 75%', end: 'bottom 70%', stagger: 0 });
            entries.forEach((li, i) => {
                // Each node inks once as its entry enters
                drawOn([nodes[i]], { trigger: li, start: 'top 85%', dur: .3, stagger: 0 });
                fadeIn([digits[i]], { trigger: li, start: 'top 85%', dur: .3 });
            });
        });
    }

    onFontsReady(() => {
        build();
        const ro = new ResizeObserver(() => {
            if (wrap.clientWidth === lastW && wrap.offsetHeight === lastH) return;
            clearTimeout(timer);
            timer = setTimeout(build, 150);
        });
        ro.observe(wrap);
    });
}
