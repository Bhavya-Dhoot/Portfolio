/**
 * main.js — Entry point
 * Orchestrates: Lenis, GSAP, cursor, nav, SVG grid, skills canvas, projects
 */

import Lenis from 'lenis';
import { initCursor } from './cursor.js';
import { initNav } from './components/nav.js';
import { initAnimations, initHeroAnimation } from './animations.js';
import { initGrid, initAboutSVG } from './svg/grid.js';
import { initSkills } from './components/skills.js';
import { initProjects } from './components/projects.js';
import { initContact3D } from './components/contact-3d.js';

// ── 1. Smooth Scroll (Lenis) ────────────────────────────────────
const lenis = new Lenis({
    duration: 1.25,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 2,
});

// ── 2. Custom Cursor ────────────────────────────────────────────
initCursor();

// ── 3. Navigation ───────────────────────────────────────────────
initNav();

// ── 4. SVG Grid (hero background) ──────────────────────────────
initGrid();

// ── 5. About SVG Visual ─────────────────────────────────────────
initAboutSVG();

// ── 6. GSAP Scroll Animations ───────────────────────────────────
initAnimations(lenis);

// ── 7. Hero Entrance ────────────────────────────────────────────
initHeroAnimation();

// ── 8. Skills Canvas ────────────────────────────────────────────
initSkills();

// ── 9. Project Canvases ─────────────────────────────────────────
initProjects();

// ── 10. Contact 3D Scene ─────────────────────────────────────────
initContact3D();

// ── 11. Section label observer ──────────────────────────────────
const labelObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('in-view');
        });
    },
    { threshold: 0.1 }
);
document.querySelectorAll('.section-label').forEach(el => labelObserver.observe(el));

// ── 12. Scroll progress bar ─────────────────────────────────────
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = total > 0 ? `${(scrolled / total) * 100}%` : '0%';
    }, { passive: true });
}

// ── 13. Availability badge reveal ───────────────────────────────
const badge = document.getElementById('availability-badge');
if (badge) setTimeout(() => badge.classList.add('visible'), 1800);

// ── 14. Hero CTAs entrance ──────────────────────────────────────
const ctaWrap = document.getElementById('hero-ctas');
if (ctaWrap) {
    setTimeout(() => {
        ctaWrap.style.transition = 'opacity 0.7s 1.3s var(--ease-expo), transform 0.7s 1.3s var(--ease-expo)';
        ctaWrap.style.opacity = '1';
        ctaWrap.style.transform = 'none';
    }, 50);
}

// ── 15. Section in-view class (for CSS decorations) ─────────────
const sectionObserver = new IntersectionObserver(
    (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in-view-section');
    }),
    { threshold: 0.15 }
);
document.querySelectorAll('section').forEach(s => sectionObserver.observe(s));

// ── 16. Exp items: slide-in left bar ────────────────────────────
const expObserver = new IntersectionObserver(
    (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in-view');
    }),
    { threshold: 0.2 }
);
document.querySelectorAll('.exp-item').forEach(el => expObserver.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
            e.preventDefault();
            lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
        }
    });
});

// ── 12. Reduced motion fallback ─────────────────────────────────
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced) {
    document.documentElement.style.setProperty('--ease-expo', 'linear');
    // Reveal everything immediately
    document.querySelectorAll(
        '.reveal-heading, .reveal-text, .reveal-stat, .reveal-exp, .reveal-project, .reveal-skill-group, .section-label, .hero-eyebrow, .hero-line-inner, #hero-tagline, .data-label, #hero-scroll-cue'
    ).forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
    });
}

// ── 13. Page visibility — pause Lenis when hidden ───────────────
document.addEventListener('visibilitychange', () => {
    if (document.hidden) lenis.stop();
    else lenis.start();
});
