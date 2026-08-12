/**
 * GSAP ScrollTrigger animations — all scroll-driven reveals
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { buildActs, buildStack } from './acts.js';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initAnimations(lenis) {
    // Sync GSAP ScrollTrigger with Lenis (absent under reduced motion)
    if (lenis) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        ScrollTrigger.addEventListener('refresh', () => lenis.resize());
    }

    // ── Section labels ─────────────────────────────────────────────
    gsap.utils.toArray('.section-label').forEach(el => {
        gsap.fromTo(el,
            { opacity: 0, y: 14 },
            {
                opacity: 1, y: 0,
                duration: 0.9,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── Section headings (line-by-line reveal) ─────────────────────
    gsap.utils.toArray('.reveal-heading').forEach(el => {
        gsap.fromTo(el,
            { opacity: 0, y: 45 },
            {
                opacity: 1, y: 0,
                duration: 1.1,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── Body text paragraphs ───────────────────────────────────────
    gsap.utils.toArray('.reveal-text').forEach((el, i) => {
        gsap.fromTo(el,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0,
                duration: 0.9,
                delay: i * 0.12,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── Stats ──────────────────────────────────────────────────────
    gsap.utils.toArray('.reveal-stat').forEach((el, i) => {
        gsap.fromTo(el,
            { opacity: 0, y: 25, scale: 0.96 },
            {
                opacity: 1, y: 0, scale: 1,
                duration: 0.8,
                delay: i * 0.1,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── Experience items ───────────────────────────────────────────
    gsap.utils.toArray('.reveal-exp').forEach((el, i) => {
        gsap.fromTo(el,
            { opacity: 0, x: -30 },
            {
                opacity: 1, x: 0,
                duration: 0.9,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── Project cards ──────────────────────────────────────────────
    gsap.utils.toArray('.reveal-project').forEach((el, i) => {
        gsap.fromTo(el,
            { opacity: 0, y: 35 },
            {
                opacity: 1, y: 0,
                duration: 1,
                delay: i * 0.08,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── Skills groups ──────────────────────────────────────────────
    gsap.utils.toArray('.reveal-skill-group').forEach((el, i) => {
        gsap.fromTo(el,
            { opacity: 0, y: 25 },
            {
                opacity: 1, y: 0,
                duration: 0.8,
                delay: i * 0.1,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── Scroll acts and sticky stack ───────────────────────────────
    buildActs();
    buildStack();

    // ── Experience line expansion ──────────────────────────────────
    // Act phases are driven by the act timeline, so they are skipped here.
    gsap.utils.toArray('.exp-item').filter(el => !el.closest('.act__stage')).forEach(item => {
        const highlights = item.querySelectorAll('.exp-highlights li');
        if (!highlights.length) return;
        gsap.fromTo(highlights,
            { opacity: 0, x: -15 },
            {
                opacity: 1, x: 0,
                duration: 0.6,
                stagger: 0.07,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: item,
                    start: 'top 80%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── KPI Cards ──────────────────────────────────────────────────
    gsap.utils.toArray('.reveal-kpi').forEach((el, i) => {
        gsap.fromTo(el,
            { opacity: 0, y: 30, scale: 0.96 },
            {
                opacity: 1, y: 0, scale: 1,
                duration: 0.9,
                delay: i * 0.08,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── Thesis Cards ───────────────────────────────────────────────
    gsap.utils.toArray('.reveal-thesis').filter(el => !el.closest('#thesis-grid')).forEach((el, i) => {
        gsap.fromTo(el,
            { opacity: 0, y: 25 },
            {
                opacity: 1, y: 0,
                duration: 0.9,
                delay: i * 0.12,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // ── Case Study Blocks ──────────────────────────────────────────
    gsap.utils.toArray('.case-study-frame').filter(el => !el.closest('.act__stage')).forEach(frame => {
        const blocks = frame.querySelectorAll('.cs-block');
        if (!blocks.length) return;
        gsap.fromTo(blocks,
            { opacity: 0, y: 18 },
            {
                opacity: 1, y: 0,
                duration: 0.7,
                stagger: 0.1,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: frame,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });
}

