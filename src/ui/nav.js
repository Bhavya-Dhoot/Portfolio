/**
 * ui/nav.js - active link from the pathname, the .scrolled state, the inked
 * wordmark box, and the page wipe. Nav links are real <a href> and work with
 * JS off; nothing here intercepts them except the wipe.
 */

import { ScrollTrigger, drawOn } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink } from '../doodle/draw.js';
import { initWipe } from '../motion/wipe.js';

const NS = 'http://www.w3.org/2000/svg';

export function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) { initWipe(); return; }

    // Active link: the pathname picks the page; its swipe sits at scaleX 1 from load (CSS)
    const path = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    const key = path === '/' || path === '/index' ? 'home' : path.slice(1);
    nav.querySelectorAll('.nav-link').forEach((l) => {
        const on = l.dataset.page === key;
        l.classList.toggle('active', on);
        if (on) l.setAttribute('aria-current', 'page');
        else l.removeAttribute('aria-current');
    });

    // Wordmark: one hand-drawn box around "BD", inked once on load
    const logo = document.getElementById('nav-logo');
    if (logo && !logo.querySelector('svg')) {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'ink-svg nav-logo-ink');
        svg.setAttribute('viewBox', '0 0 52 36');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        logo.appendChild(svg);
        const paths = ink(svg, [{ d: doodle(1).rect(0, 0, 52, 36), w: 4 }]);
        // Draw the wordmark box once, on load (no scroll trigger)
        drawOn(paths, { start: null, dur: .55, stagger: .06 });
    }

    // .scrolled past 24px, cleared under 8px (hysteresis so elastic scroll cannot flicker it).
    // Driven by ScrollTrigger, never a window scroll listener.
    const setScrolled = (y) => {
        const was = nav.classList.contains('scrolled');
        if (!was && y > 24) nav.classList.add('scrolled');
        else if (was && y < 8) nav.classList.remove('scrolled');
    };
    ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => setScrolled(self.scroll()),
        onRefresh: (self) => setScrolled(self.scroll()),
    });
    setScrolled(window.scrollY || 0);

    initWipe();
}
