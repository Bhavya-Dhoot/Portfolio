/**
 * Act: the pricing stack.
 *
 * Four plates (market data, Black-Scholes core, Greeks, margin) explode apart,
 * a pulse falls through them lighting each in turn, then they collapse and hand
 * off to the working pricer in the next phase. Mirrors how the options terminal
 * is actually layered.
 */

import { gsap } from 'gsap';
import { registerActRenderer } from '../acts.js';

const OPEN = [-132, -44, 44, 132];      // exploded offsets, px
const COMPACT = [-14, -5, 5, 14];       // collapsed offsets

registerActRenderer('pricing', (act, tl, { phaseAt, reduced }) => {
    const plates = gsap.utils.toArray(act.querySelectorAll('.stackviz__plate'));
    const pulse = act.querySelector('.stackviz__pulse');
    const beam = act.querySelector('.stackviz__beam');
    const spine = act.querySelector('.stackviz__spine');
    if (!plates.length) return null;

    const light = (i) => plates.forEach((p, n) => p.classList.toggle('is-lit', n <= i));

    if (reduced || !tl) {
        gsap.set(plates, { y: (i) => COMPACT[i] });
        light(plates.length - 1);
        return null;
    }

    // Plates start face-on and flat; the perspective tilt is part of the reveal
    gsap.set(plates, { y: (i) => COMPACT[i], opacity: 0, rotateX: 0, scale: 0.9 });
    gsap.set(pulse, { opacity: 0, y: OPEN[0] - 26 });
    gsap.set([beam, spine], { opacity: 0 });

    const t = phaseAt(0);

    // The diagram draws itself in: spine first, then the plates tilt into
    // perspective and push apart.
    tl.to(spine, { opacity: 1, duration: 0.3, ease: 'none' }, t);
    tl.to(plates, {
        opacity: 1,
        scale: 1,
        rotateX: 58,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power3.out',
    }, t + 0.1);

    plates.forEach((p, i) => {
        tl.to(p, { y: OPEN[i], duration: 0.5, ease: 'power2.out' }, t + 0.45 + i * 0.06);
    });

    // The beam grows down the spine while the pulse rides its leading edge, so
    // the falling light leaves a trail instead of a bare dot.
    tl.set([pulse, beam], { opacity: 1 }, t + 1.0);
    tl.fromTo(beam,
        { scaleY: 0 },
        { scaleY: 0.92, duration: plates.length * 0.3, ease: 'none' }, t + 1.0);

    plates.forEach((p, i) => {
        tl.to(pulse, { y: OPEN[i], duration: 0.3, ease: 'none' }, t + 1.0 + i * 0.3);
        // Each layer takes the hit: a short recoil as the light reaches it
        tl.to(p, {
            keyframes: [
                { scale: 1.035, duration: 0.12, ease: 'power2.out' },
                { scale: 1, duration: 0.22, ease: 'power2.inOut' },
            ],
        }, t + 1.0 + i * 0.3);
    });

    // Which layers are lit is derived from timeline time, not from per-tween
    // onUpdate callbacks: under scrub only the actively-advancing tween fires,
    // so callback-driven lighting silently desyncs when the user scrolls fast.
    const litAt = (i) => t + 1.0 + i * 0.3;
    tl.eventCallback('onUpdate', () => {
        const now = tl.time();
        let idx = -1;
        for (let i = 0; i < plates.length; i++) if (now >= litAt(i)) idx = i;
        light(idx);
    });

    const settle = t + 1.0 + plates.length * 0.3;
    tl.to([pulse, beam], { opacity: 0, duration: 0.25, ease: 'none' }, settle);

    // Collapse back into a single stack: the tool is assembled
    plates.forEach((p, i) => {
        tl.to(p, { y: COMPACT[i], duration: 0.45, ease: 'power2.inOut' }, settle + 0.15 + i * 0.04);
    });
    tl.to(spine, { opacity: 0, duration: 0.3, ease: 'none' }, settle + 0.3);

    return () => {
        tl.eventCallback('onUpdate', null);
        gsap.set(plates, { clearProps: 'transform,opacity' });
        gsap.set([pulse, beam, spine], { clearProps: 'transform,opacity' });
        plates.forEach((p) => p.classList.remove('is-lit'));
    };
});
