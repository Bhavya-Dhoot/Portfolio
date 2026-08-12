/**
 * GSAP ScrollTrigger animations — all scroll-driven reveals
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

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

/**
 * Scroll acts — a pinned stage whose phases advance as you scrub through it.
 * Pinning is confined to >=768px: mobile browsers handle 100svh pins badly, so
 * there the stage falls back to a plain stacked list (see the CSS).
 */
function buildActs() {
    const acts = gsap.utils.toArray('.act');
    if (!acts.length) return;

    acts.forEach((act) => {
        const pin = act.querySelector('.act__pin');
        const phases = gsap.utils.toArray(act.querySelectorAll('.act__phase'));
        if (!pin || phases.length < 2) return;

        // Progress ticks, one per phase
        const ticks = act.querySelector('.act__ticks');
        if (ticks && !ticks.children.length) {
            phases.forEach(() => {
                const t = document.createElement('span');
                t.className = 'act__tick';
                ticks.appendChild(t);
            });
        }
        const tickEls = ticks ? Array.from(ticks.children) : [];
        const markActive = (i) => tickEls.forEach((t, n) => t.classList.toggle('is-active', n === i));

        if (REDUCED) {
            gsap.set(phases, { opacity: 1, y: 0 });
            markActive(0);
            return;
        }

        gsap.matchMedia().add('(min-width: 768px)', () => {
            gsap.set(phases, { opacity: 0, y: 40 });
            gsap.set(phases[0], { opacity: 1, y: 0 });
            markActive(0);

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: act,
                    start: 'top top',
                    end: () => `+=${(phases.length - 1) * window.innerHeight * 0.85}`,
                    pin: pin,
                    scrub: 1,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        const i = Math.round(self.progress * (phases.length - 1));
                        markActive(i);
                    },
                },
            });

            phases.forEach((phase, i) => {
                if (i === 0) return;
                tl.to(phases[i - 1], { opacity: 0, y: -40, duration: 0.4, ease: 'none' }, i - 1)
                  .fromTo(phase, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'none' }, i - 1 + 0.15);
            });

            // matchMedia cleanup reverts the tween-set inline styles
            return () => {
                gsap.set(phases, { clearProps: 'opacity,transform' });
            };
        });
    });
}

/**
 * Sticky stack — each panel holds the viewport and recedes as the next
 * arrives, so the three arguments are read in order rather than side by side.
 */
function buildStack() {
    const panels = gsap.utils.toArray('#thesis-grid .thesis-card');
    if (panels.length < 2 || REDUCED) return;

    gsap.matchMedia().add('(min-width: 768px)', () => {
        panels.forEach((panel, i) => {
            if (i === panels.length - 1) return;
            gsap.to(panel, {
                opacity: 0.25,
                y: -50,
                ease: 'none',
                scrollTrigger: {
                    trigger: panels[i + 1],
                    start: 'top bottom',
                    end: 'top top',
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            });
        });

        return () => {
            gsap.set(panels, { clearProps: 'opacity,transform' });
        };
    });
}

/**
 * Hero entrance animation — called once on page load
 */
export function initHeroAnimation() {
    const tagline = document.querySelector('.hero-role');
    const taglineText = tagline ? tagline.textContent.replace(/\s+/g, ' ').trim() : '';

    if (REDUCED) {
        gsap.set('.hero-eyebrow, #hero-tagline, .data-label, #hero-scroll-cue, #hero-ctas', {
            opacity: 1, x: 0, y: 0,
        });
        gsap.set('.hero-line-inner', { y: '0%', opacity: 1 });
        return null;
    }

    // Per-character reveal needs final glyph metrics, so this runs after fonts load
    const split = new SplitType('.hero-line-inner', { types: 'chars', tagName: 'span' });
    gsap.set('.hero-line-inner', { y: '0%', opacity: 1 });
    gsap.set(split.chars, { yPercent: 120, opacity: 0, rotateX: -85 });

    const tl = gsap.timeline({ delay: 0.15 });

    // Eyebrow line
    tl.to('.hero-eyebrow', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'expo.out',
    });

    // Name: characters fly up and rotate into place
    tl.to(split.chars, {
        yPercent: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.95,
        stagger: 0.02,
        ease: 'power3.out',
    }, '-=0.55');

    // Tagline types in. The authored markup is never destroyed: a sibling span
    // carries the typed text and the real spans are only hidden once typing has
    // actually begun, so if the ticker never runs the copy still renders.
    tl.set('#hero-tagline', { opacity: 1, y: 0 });
    if (tagline && taglineText) {
        const typed = document.createElement('span');
        typed.className = 'hero-typed';
        typed.setAttribute('aria-hidden', 'true');
        tagline.appendChild(typed);

        const state = { n: 0 };
        tl.to(state, {
            n: taglineText.length,
            duration: taglineText.length * 0.055,
            ease: 'none',
            onStart: () => tagline.classList.add('is-typing'),
            onUpdate: () => {
                typed.textContent = taglineText.slice(0, Math.round(state.n));
            },
            onComplete: () => {
                tagline.classList.remove('is-typing');
                typed.remove();
            },
        }, '-=0.25');
    }

    // CTAs, then the peripheral data labels
    tl.to('#hero-ctas', {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'expo.out',
    }, '-=0.35');

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
