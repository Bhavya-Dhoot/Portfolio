/**
 * about/fx.js - two small helpers the About modules share.
 * fadeIn: labels that belong to a drawing come in with it, never before it.
 * swipeMarks: the lime marker swipe, with a fallback for phrases that wrap.
 */

import { gsap, REDUCED, swipe } from '../motion/core.js';

/** Fade drawing labels in once, as their drawing enters. */
export function fadeIn(targets, { trigger, start = 'top 85%', delay = 0, dur = .3 } = {}) {
    const list = Array.from(targets || []).filter(Boolean);
    if (!list.length || REDUCED) return null;
    return gsap.fromTo(list, { opacity: 0 }, {
        opacity: 1,
        duration: dur,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger, start, once: true },
    });
}

/**
 * Marker swipe for every .mk in scope. A phrase that wraps onto two lines cannot take the
 * absolutely placed <i> (one block across both lines), so CSS turns those .mk inline with a
 * background highlight (class mk-flow) and the swipe grows that background instead.
 */
export function swipeMarks(scope, { start = 'top 85%', delay = .25 } = {}) {
    const root = typeof scope === 'string' ? document.querySelector(scope) : scope;
    if (!root) return;
    Array.from(root.querySelectorAll('.mk')).forEach((mk, n) => {
        const d = delay + n * .2;
        if (getComputedStyle(mk).display === 'inline') {
            if (REDUCED) return;
            // Grow the highlighter across every wrapped line at once
            gsap.fromTo(mk, { backgroundSize: '0% 48%' }, {
                backgroundSize: '100% 48%',
                duration: .35,
                ease: 'power3.out',
                delay: d,
                scrollTrigger: start === null ? undefined : { trigger: mk, start, once: true },
            });
        } else {
            const i = mk.querySelector(':scope > i');
            // Grow the lime block under the phrase
            if (i) swipe(i, { start, delay: d });
        }
    });
}
