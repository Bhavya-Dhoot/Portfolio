/**
 * acts.js — Pinned scroll acts and the sticky stack.
 *
 * An act is a stage that pins to the viewport while its phases advance on
 * scrub. Phases share a single grid cell, so they layer rather than sit side by
 * side, and the outgoing phase starts leaving before the incoming one arrives.
 *
 * Optional per-act pieces:
 *   .act__stichwort  a headline that punches in and dissolves before the
 *                    phases stage. Repeating this beat across acts is what
 *                    makes separate acts feel like one machine.
 *   .act__ticks      progress ticks, one per phase, filled in here.
 *   data-act-scale   multiplier on the scroll budget, default 1.
 *
 * Acts can also register a scrub-driven renderer via registerActRenderer(),
 * which receives a numeric state object the timeline tweens. That is how a
 * canvas widget is driven by scroll without giving up interactivity after.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DESKTOP = '(min-width: 768px)';

// name -> setup(actEl, tl, ctx) called inside the act's matchMedia scope
const renderers = new Map();

/**
 * @param {string} name matches an act's data-act attribute
 * @param {(act: HTMLElement, tl: gsap.core.Timeline, api: {phaseAt:(i:number)=>number, phases:HTMLElement[]}) => (void|Function)} setup
 *        may return a cleanup function
 */
export function registerActRenderer(name, setup) {
    renderers.set(name, setup);
}

/**
 * Headline punches in, holds, then dissolves. Occupies the first ~1.5 units of
 * the act timeline; phases begin after it.
 */
function stichwortBeat(tl, el) {
    if (!el) return 0;
    tl.fromTo(el,
        { opacity: 0, y: 54, scale: 1.09 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }, 0);
    tl.to(el,
        { opacity: 0, y: -44, scale: 0.97, filter: 'blur(6px)', duration: 0.6, ease: 'power2.in' }, 1.1);
    return 1.7;                       // phases start here
}

export function buildActs() {
    const acts = gsap.utils.toArray('.act');
    if (!acts.length) return;

    acts.forEach((act) => {
        const pin = act.querySelector('.act__pin');
        const phases = gsap.utils.toArray(act.querySelectorAll('.act__phase'));
        const stichwort = act.querySelector('.act__stichwort');
        const name = act.dataset.act;
        const scale = parseFloat(act.dataset.actScale || '1');
        const renderer = renderers.get(name);
        if (!pin || (!phases.length && !renderer)) return;

        // Progress ticks, one per phase
        const ticks = act.querySelector('.act__ticks');
        if (ticks && !ticks.children.length && phases.length > 1) {
            phases.forEach(() => {
                const t = document.createElement('span');
                t.className = 'act__tick';
                ticks.appendChild(t);
            });
        }
        const tickEls = ticks ? Array.from(ticks.children) : [];
        const markActive = (i) => tickEls.forEach((t, n) => t.classList.toggle('is-active', n === i));

        if (REDUCED) {
            // Everything visible, no pin, no scrub. Widgets stay interactive.
            gsap.set(phases, { opacity: 1, y: 0 });
            gsap.set(stichwort, { opacity: 1, y: 0, scale: 1, filter: 'none' });
            markActive(0);
            act.classList.add('is-settled');
            if (renderer) renderer(act, null, { phases, phaseAt: () => 0, reduced: true });
            return;
        }

        gsap.matchMedia().add(DESKTOP, () => {
            if (phases.length) {
                gsap.set(phases, { opacity: 0, y: 40 });
                gsap.set(phases[0], { opacity: 1, y: 0 });
            }
            markActive(0);

            // Timeline units: the stichwort takes ~1.7, then one unit per phase step
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: act,
                    start: 'top top',
                    end: () => {
                        const steps = Math.max(1, phases.length - 1);
                        return `+=${(steps + 1.7) * window.innerHeight * 0.9 * scale}`;
                    },
                    pin: pin,
                    scrub: 1,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        if (phases.length > 1) {
                            const i = Math.round(self.progress * (phases.length - 1));
                            markActive(i);
                        }
                        // Once past the stichwort the act is "settled": widgets
                        // inside become interactive.
                        act.classList.toggle('is-settled', self.progress > 0.25);
                    },
                },
            });

            const t0 = stichwortBeat(tl, stichwort);
            const phaseAt = (i) => t0 + i;

            phases.forEach((phase, i) => {
                if (i === 0) return;
                tl.to(phases[i - 1], { opacity: 0, y: -40, duration: 0.4, ease: 'none' }, phaseAt(i - 1))
                  .fromTo(phase, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'none' }, phaseAt(i - 1) + 0.15);
            });

            const cleanupRenderer = renderer
                ? renderer(act, tl, { phases, phaseAt, reduced: false })
                : null;

            return () => {
                if (typeof cleanupRenderer === 'function') cleanupRenderer();
                gsap.set(phases, { clearProps: 'opacity,transform' });
                gsap.set(stichwort, { clearProps: 'opacity,transform,filter' });
            };
        });
    });
}

/**
 * Sticky stack — each panel holds the viewport and recedes as the next
 * arrives, so a sequence of arguments is read in order rather than side by side.
 */
export function buildStack(selector = '#thesis-grid .thesis-card') {
    const panels = gsap.utils.toArray(selector);
    if (panels.length < 2 || REDUCED) return;

    gsap.matchMedia().add(DESKTOP, () => {
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
 * Run a canvas renderer only while its act is on screen, so at most one
 * renderer draws at a time. Returns a stop function.
 */
export function gateRenderer(el, draw) {
    let running = false;
    const tick = () => draw();
    const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !running) {
            running = true;
            gsap.ticker.add(tick);
        } else if (!entry.isIntersecting && running) {
            running = false;
            gsap.ticker.remove(tick);
        }
    }, { rootMargin: '10% 0px' });
    io.observe(el);

    return () => {
        if (running) gsap.ticker.remove(tick);
        io.disconnect();
    };
}

export { ScrollTrigger, REDUCED };
