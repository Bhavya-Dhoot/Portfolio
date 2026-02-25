/**
 * GSAP ScrollTrigger animations — all scroll-driven reveals
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations(lenis) {
    // Sync GSAP ScrollTrigger with Lenis
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

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

    // ── Experience line expansion ──────────────────────────────────
    gsap.utils.toArray('.exp-item').forEach(item => {
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
}

/**
 * Hero entrance animation — called once on page load
 */
export function initHeroAnimation() {
    const tl = gsap.timeline({ delay: 0.2 });

    // Eyebrow line
    tl.to('.hero-eyebrow', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'expo.out',
    });

    // Name lines — slide up from masked container
    tl.to('.hero-line-inner', {
        y: '0%',
        opacity: 1,
        duration: 1.1,
        stagger: 0.12,
        ease: 'expo.out',
    }, '-=0.5');

    // Tagline
    tl.to('#hero-tagline', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'expo.out',
    }, '-=0.5');

    // Data labels
    tl.to('.data-label', {
        opacity: 1,
        x: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'expo.out',
    }, '-=0.4');

    // Scroll cue
    tl.to('#hero-scroll-cue', {
        opacity: 1,
        duration: 0.6,
        ease: 'expo.out',
    }, '-=0.2');

    return tl;
}
