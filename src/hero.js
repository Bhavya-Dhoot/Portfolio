/**
 * hero.js — the hero entrance, kept out of the shared chunk.
 *
 * Lives here rather than in animations.js because it is the only thing that
 * needs SplitType, and animations.js ships to every page. Home imports this;
 * /work and /about never download the glyph splitter.
 */

import { gsap } from 'gsap';
import SplitType from 'split-type';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Hero entrance animation — called once on page load
 */
export function initHeroAnimation() {
    const tagline = document.querySelector('.hero-role');
    const taglineText = tagline ? tagline.textContent.replace(/\s+/g, ' ').trim() : '';

    if (REDUCED) {
        gsap.set('.hero-eyebrow, #hero-tagline, .data-label, #hero-ctas', {
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


    return tl;
}
