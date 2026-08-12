/**
 * core.js — Everything every page needs: smooth scroll, cursor, nav, scroll
 * progress, section reveals and the reduced-motion fallbacks.
 *
 * Page entry points in src/pages/ call initCore() first, then add whatever is
 * specific to that page.
 */

import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCursor } from './cursor.js';
import { initNav } from './components/nav.js';
import { initAnimations } from './animations.js';

export const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initCore() {
    // ── Smooth scroll ───────────────────────────────────────────
    // Not initialized under reduced motion: those users get native scroll.
    const lenis = prefersReduced ? null : new Lenis({
        duration: 1.25,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 2,
    });

    initCursor();
    initNav();
    initAnimations(lenis);

    // ── Scroll progress bar ─────────────────────────────────────
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) {
        ScrollTrigger.create({
            start: 0,
            end: 'max',
            onUpdate: (self) => {
                progressBar.style.width = `${self.progress * 100}%`;
            },
        });
    }

    // ── Section label reveal ────────────────────────────────────
    const labelObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) e.target.classList.add('in-view');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.section-label').forEach((el) => labelObserver.observe(el));

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) e.target.classList.add('in-view-section');
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('section').forEach((s) => sectionObserver.observe(s));

    const expObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) e.target.classList.add('in-view');
        });
    }, { threshold: 0.2 });
    document.querySelectorAll('.exp-item').forEach((el) => expObserver.observe(el));

    // ── In-page anchors ─────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('href').slice(1);
            const target = document.getElementById(id);
            if (!target) return;
            e.preventDefault();
            if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
            else target.scrollIntoView({ behavior: 'auto', block: 'start' });
        });
    });

    // ── Reduced motion: resolve every reveal to its end state ───
    if (prefersReduced) {
        document.documentElement.style.setProperty('--ease-expo', 'linear');
        document.querySelectorAll(
            '.reveal-heading, .reveal-text, .reveal-stat, .reveal-exp, .reveal-project, .reveal-skill-group, .reveal-kpi, .reveal-thesis, .section-label, .hero-eyebrow, .hero-line-inner, #hero-tagline, .data-label, #hero-ctas, .exp-highlights li, .cs-block'
        ).forEach((el) => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }

    // ── Pause Lenis when the tab is hidden ──────────────────────
    if (lenis) {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) lenis.stop();
            else lenis.start();
        });
    }

    return lenis;
}

/**
 * Run a callback once fonts are ready, with a safety net. Anything that
 * measures glyphs (the hero character split) must wait for this.
 */
export function onFontsReady(fn) {
    let done = false;
    const run = () => {
        if (done) return;
        done = true;
        fn();
    };
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(run);
        setTimeout(run, 1500);
    } else {
        run();
    }
}
