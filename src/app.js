/**
 * app.js - boot() is the first call in every page entry module.
 * Order: reduced-motion branch, scroll, nav (+ wipe), boil, fonts -> refresh.
 */

import { REDUCED, ScrollTrigger, initScroll, onFontsReady, drawOn } from './motion/core.js';
import { initNav } from './ui/nav.js';
import { ink, boilStart } from './doodle/draw.js';
import { doodle } from './doodle/paths.js';

const NS = 'http://www.w3.org/2000/svg';

// Contact band: one hand-drawn paper rule between the headline block and the links
function initBand() {
    const band = document.getElementById('contact');
    const row = band && band.querySelector('.band-row');
    if (!row || band.querySelector('.band-rule')) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ink-svg band-rule');
    svg.setAttribute('viewBox', '0 0 1000 12');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    row.parentNode.insertBefore(svg, row);
    const paths = ink(svg, [{ d: doodle(9).line(0, 6, 1000, 6, 3), w: 3 }]);
    // Draw the band rule once as the band enters
    drawOn(paths, { dur: .55, start: 'top 85%' });
}

export function boot() {
    if (REDUCED) {
        // Reduced motion is a design: ink pre-drawn, markers swiped, stamps at rest
        const root = document.documentElement;
        root.classList.add('reduced');
        document.querySelectorAll('path[pathLength]').forEach((p) => {
            p.style.strokeDasharray = p.dataset.dash ? '0.04 0.03' : '1 1';
            p.style.strokeDashoffset = '0';
            p.style.opacity = '1';
        });
        document.querySelectorAll('.mk').forEach((m) => { m.style.backgroundSize = '100% 48%'; });
        document.querySelectorAll('.stamp').forEach((s) => { s.style.opacity = '1'; s.style.setProperty('--sc', '1'); });
    }

    const lenis = initScroll();
    initNav();
    initBand();
    boilStart();
    // Every trigger was measured against fallback metrics until the fonts land
    onFontsReady(() => ScrollTrigger.refresh());
    return { lenis };
}
