/**
 * main.js — Entry point
 * Orchestrates: Lenis, GSAP, cursor, nav, SVG grid, portrait, skills, projects, dashboard
 */

import Lenis from 'lenis';
import { initCursor }     from './cursor.js';
import { initNav }        from './components/nav.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initAnimations, initHeroAnimation } from './animations.js';
import { initGrid }       from './svg/grid.js';
import { initPortrait }   from './components/portrait.js';
import { initSkills }     from './components/skills.js';
import { initProjects }   from './components/projects.js';

import { initDashboard }  from './components/dashboard.js';
import { initPayoff }     from './components/payoff.js';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── 1. Smooth Scroll (Lenis) ────────────────────────────────────
// Not initialized under reduced motion: these users get native scroll.
const lenis = prefersReduced ? null : new Lenis({
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

// ── 5. About ASCII Portrait ─────────────────────────────────────
initPortrait();

// ── 6. GSAP Scroll Animations ───────────────────────────────────
initAnimations(lenis);

// ── 7. Hero Entrance ────────────────────────────────────────────
// Gated on fonts: the per-character reveal splits text, so it needs final
// glyph metrics or the characters land at the wrong offsets.
let booted = false;
function boot() {
    if (booted) return;
    booted = true;
    initHeroAnimation();
}
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot);
    setTimeout(boot, 1500);          // safety net if fonts never resolve
} else {
    boot();
}

// ── 8. Skills Canvas ────────────────────────────────────────────
initSkills();

// ── 9. Project Canvases ─────────────────────────────────────────
initProjects();


// ── 11. KPI Dashboard ───────────────────────────────────────────
initDashboard();

// ── 12. Options payoff explorer ─────────────────────────────────
initPayoff();


// ── 13. Section label observer ──────────────────────────────────
const labelObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('in-view');
        });
    },
    { threshold: 0.1 }
);
document.querySelectorAll('.section-label').forEach(el => labelObserver.observe(el));

// ── 14. Scroll progress bar (driven by ScrollTrigger, one scroll authority) ──
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

// ── 15. Availability badge reveal ───────────────────────────────
const badge = document.getElementById('availability-badge');
if (badge) setTimeout(() => badge.classList.add('visible'), 1800);

// ── 17. Section in-view class ───────────────────────────────────
const sectionObserver = new IntersectionObserver(
    (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in-view-section');
    }),
    { threshold: 0.15 }
);
document.querySelectorAll('section').forEach(s => sectionObserver.observe(s));

// ── 18. Exp items: slide-in left bar ────────────────────────────
const expObserver = new IntersectionObserver(
    (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in-view');
    }),
    { threshold: 0.2 }
);
document.querySelectorAll('.exp-item').forEach(el => expObserver.observe(el));

// ── 19. Scroll-to-section links ─────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
            e.preventDefault();
            if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
            else target.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    });
});

// ── 20. Reduced motion fallback ─────────────────────────────────
if (prefersReduced) {
    document.documentElement.style.setProperty('--ease-expo', 'linear');
    document.querySelectorAll(
        '.reveal-heading, .reveal-text, .reveal-stat, .reveal-exp, .reveal-project, .reveal-skill-group, .reveal-kpi, .reveal-thesis, .section-label, .hero-eyebrow, .hero-line-inner, #hero-tagline, .data-label, .exp-highlights li, .cs-block'
    ).forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
    });
}

// ── 21. Page visibility — pause Lenis when hidden ───────────────
if (lenis) {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) lenis.stop();
        else lenis.start();
    });
}
