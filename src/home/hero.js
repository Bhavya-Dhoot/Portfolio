/**
 * home/hero.js - the signature move: a pencil draws the pipeline while you read the name.
 * Text is already painted (the h1 is the LCP element); only the sketch and the lime swipe move.
 * Seed 101, so the strokes are identical on every load.
 */

import { gsap, REDUCED, drawOn, swipe, onFontsReady, timeline } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink, label, fillBlock } from '../doodle/draw.js';

const NS = 'http://www.w3.org/2000/svg';
const SEEN = 'bd_hero_seen';

function seenBefore() {
    try { return sessionStorage.getItem(SEEN) === '1'; } catch (e) { return false; }
}
function markSeen() {
    try { sessionStorage.setItem(SEEN, '1'); } catch (e) { /* storage blocked: replay is harmless */ }
}

/** Three strokes for the body and tip of a pencil; origin (0,0) is the writing tip. */
function makePencil(svg, d) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'pencil');
    [d.line(0, 0, 46, -46, 1), d.line(8, 0, 54, -46, 1), d.line(-6, 6, 0, 0, 1), d.line(0, 0, 6, -6, 1)].forEach((s) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', s);
        p.setAttribute('stroke-width', '4');
        p.setAttribute('vector-effect', 'non-scaling-stroke');
        g.appendChild(p);
    });
    gsap.set(g, { opacity: 0 });
    svg.appendChild(g);
    return g;
}

export function initHero() {
    const svg = document.querySelector('.hero-svg');
    if (!svg) return;

    const d = doodle(101);
    const X = 300 + 40;   // checks column x, written as a sum so no stray number literal sits in the source
    const NOTE_Y = 300 + 40;   // the hand note sits a little lower than the halo so it never touches it

    // [name, d, width]: drawing order is the order the pencil visits them
    const plan = [
        ['feeds', d.rect(40, 120, 180, 110), 6],
        ['feeds-scrib', d.scrib(60, 175, 130, 2, 18), 4],
        ['arrow-a', d.arrow(230, 175, 300, 175, 10), 5],
        ['checks', d.rect(310, 100, 200, 150), 6],
        ['chk-1', d.check(X, 150, 26), 9],
        ['scr-1', d.scrib(380, 160, 100, 1), 4],
        ['chk-2', d.check(X, 190, 26), 9],
        ['scr-2', d.scrib(380, 200, 100, 1), 4],
        ['chk-3', d.check(X, 230, 26), 9],
        ['scr-3', d.scrib(380, 240, 100, 1), 4],
        ['halo', d.circle(410, 175, 125, 1.08), 4],
        ['arrow-b', d.arrow(520, 175, 590, 175, -10), 5],
        ['ledger', d.rect(600, 120, 100, 110), 6],
        ['ledger-ok', d.check(626, 168, 46), 9],
        ['spark-a', d.spark(700, 105, 22), 4],
        ['spark-b', d.spark(40, 255, 18), 4],
    ];
    const paths = ink(svg, plan.map(([, s, w]) => ({ d: s, w, boil: true })));
    const at = (name) => paths[plan.findIndex((p) => p[0] === name)];

    // Labels and the lime block sit outside the boil group: text and highlighter stay crisp.
    // On a phone the viewBox shrinks to about half size, so the words scale up to stay readable.
    const phone = window.matchMedia('(max-width: 767px)').matches;
    const M = phone ? 30 : 18;      // mono label size
    const H = phone ? 40 : 28;      // hand label size
    const labs = {
        feeds: label(svg, 60, 150, 'FEEDS', { size: M }),
        checks: label(svg, 330, 130, 'CHECKS', { size: M }),
        ledger: phone
            ? label(svg, 650, 268, 'LEDGER', { size: M, anchor: 'middle' })
            : label(svg, 614, 150, 'LEDGER', { size: M }),
        note: phone
            ? label(svg, 360, NOTE_Y + 20, 'runs while nobody is watching', { font: 'hand', size: H, anchor: 'middle' })
            : label(svg, 310, NOTE_Y, 'runs while nobody is watching', { font: 'hand', size: H }),
    };
    const lime = fillBlock(svg, 612, 160, 76, 40);

    if (REDUCED) return;   // ink is created drawn; labels and lime are at rest; no pencil

    const h1Mark = document.querySelector('.hero-name .mk');
    const btn = document.querySelector('.hero-btn');

    if (phone) {
        // Phones: no load timeline and no pencil; the sketch draws once as it enters, below the CTA
        drawOn(paths, { stagger: .05, dur: .5, start: 'top 85%' });
        swipe(document.querySelector('.hero-name'), { start: null, delay: .3 });
        return;
    }

    // Everything the timeline reveals starts hidden
    gsap.set([labs.feeds, labs.checks, labs.ledger, labs.note], { opacity: 0 });
    gsap.set(lime, { scaleX: 0, transformOrigin: '0% 50%' });
    const pencil = makePencil(svg, d);

    const quick = seenBefore();
    const DRAW = quick ? .45 : 1.4;     // seconds spent drawing; the full film is about 1.6 s
    const PARK = quick ? .15 : .2;

    const start = () => {
        markSeen();
        const lens = paths.map((p) => p.getTotalLength());
        const sum = lens.reduce((a, b) => a + b, 0) || 1;
        const tl = timeline({ paused: false });
        const proxy = { p: 0 };
        const times = {};
        let t = 0;

        const p0 = paths[0].getPointAtLength(0);
        gsap.set(pencil, { opacity: 1, x: p0.x, y: p0.y });
        paths.forEach((path, i) => {
            const dur = DRAW * lens[i] / sum;
            times[plan[i][0]] = t;
            // Draw one stroke at constant speed; the pencil rides the same length
            tl.to(path, { strokeDashoffset: 0, duration: dur, ease: 'none' }, t);
            tl.fromTo(proxy, { p: 0 }, {
                p: 1,
                duration: dur,
                ease: 'none',
                onUpdate: () => {
                    const pt = path.getPointAtLength(lens[i] * proxy.p);
                    gsap.set(pencil, { x: pt.x, y: pt.y });
                },
            }, t);
            t += dur;
        });

        // Labels and the lime block arrive as the pencil reaches their shapes
        tl.to(labs.feeds, { opacity: 1, duration: .15 }, times.feeds);
        tl.to(labs.checks, { opacity: 1, duration: .15 }, times.checks);
        tl.to(labs.ledger, { opacity: 1, duration: .15 }, times.ledger);
        tl.to(labs.note, { opacity: 1, duration: .2 }, times.halo);
        tl.to(lime, { scaleX: 1, duration: .2, ease: 'power3.out' }, times['ledger-ok']);

        // Pencil parks at the lower right, faded, once the drawing is done
        tl.to(pencil, { x: 700, y: 300, opacity: .6, duration: PARK, ease: 'power2.out' }, DRAW);

        // The lime swipe under "Dhoot" lands as the pencil parks (.mk is a background highlighter now)
        if (h1Mark) {
            tl.fromTo(h1Mark, { backgroundSize: '0% 48%' }, { backgroundSize: '100% 48%', duration: .35, ease: 'power3.out' }, DRAW);
        }
        // The Email me button stays painted at full size; it gets one overshoot and settles (never shrinks after paint)
        if (btn) {
            tl.to(btn, { scale: 1.06, duration: .12, ease: 'power2.out', transformOrigin: 'left center' }, DRAW)
              .to(btn, { scale: 1, duration: .33, ease: 'doodleSpring' }, DRAW + .12);
        }

        // First input jumps to the end; text never moved, so there is no visible snap on it
        const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
        const off = () => events.forEach((e) => window.removeEventListener(e, skip));
        function skip() { off(); tl.progress(1); }
        events.forEach((e) => window.addEventListener(e, skip, { passive: true }));
        tl.eventCallback('onComplete', off);
    };

    // Measure after fonts and one frame; a late font never blocks the sketch for more than a beat
    const fonts = new Promise((res) => { onFontsReady(res); setTimeout(res, 1200); });
    fonts.then(() => requestAnimationFrame(start));
}
