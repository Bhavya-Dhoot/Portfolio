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
    if (!plates.length) return null;

    const light = (i) => plates.forEach((p, n) => p.classList.toggle('is-lit', n <= i));

    if (reduced || !tl) {
        gsap.set(plates, { y: (i) => COMPACT[i] });
        light(plates.length - 1);
        return null;
    }

    gsap.set(plates, { y: (i) => COMPACT[i], opacity: 0 });
    gsap.set(pulse, { opacity: 0, y: OPEN[0] - 26 });

    const t = phaseAt(0);

    // Plates fade in, then explode apart
    tl.to(plates, { opacity: 1, duration: 0.25, stagger: 0.05, ease: 'none' }, t);
    plates.forEach((p, i) => {
        tl.to(p, { y: OPEN[i], duration: 0.45, ease: 'power2.out' }, t + 0.3 + i * 0.06);
    });

    // Pulse falls through, lighting each layer as it passes
    tl.set(pulse, { opacity: 1 }, t + 0.85);
    plates.forEach((p, i) => {
        tl.to(pulse, {
            y: OPEN[i],
            duration: 0.28,
            ease: 'none',
            onUpdate: () => light(i),
        }, t + 0.9 + i * 0.28);
    });
    tl.to(pulse, { opacity: 0, duration: 0.2, ease: 'none' }, t + 0.9 + plates.length * 0.28);

    // Collapse back into a single stack: the tool is assembled
    plates.forEach((p, i) => {
        tl.to(p, { y: COMPACT[i], duration: 0.4, ease: 'power2.inOut' }, t + 2.15 + i * 0.04);
    });

    return () => {
        gsap.set(plates, { clearProps: 'transform,opacity' });
        plates.forEach((p) => p.classList.remove('is-lit'));
    };
});
