/**
 * Act: the implied-vol solver.
 *
 * Phase 1 stages the same option solved twice — once from a fixed cold guess,
 * once seeded with the neighbouring strike's answer — and steps through the
 * real Newton iterates as you scroll. Phase 2 runs the full chain benchmark in
 * the visitor's browser and reports what it measured.
 */

import { gsap } from 'gsap';
import { registerActRenderer } from '../acts.js';
import { blackScholes } from '../components/payoff.js';
import { impliedVol, coldGuess, benchmarkChain, assertSolver } from '../components/solver.js';

// A single representative quote: 45 days, one strike above the money.
const S = 100, K = 110, T = 45 / 365, R = 0.065, TRUE_VOL = 0.24;

function iterateRows(guess) {
    const price = blackScholes(S, K, T, TRUE_VOL, R, true).price;
    const { path } = impliedVol(price, S, K, T, R, true, guess);
    return path.map((sigma, i) => {
        const err = Math.abs(blackScholes(S, K, T, sigma, R, true).price - price);
        return { i, sigma, err };
    });
}

function renderSteps(ol, rows) {
    ol.innerHTML = rows.map(({ i, sigma, err }) => `
        <li class="solveviz__step">
            <span class="solveviz__n">${String(i).padStart(2, '0')}</span>
            <span class="solveviz__sig">&sigma; ${sigma.toFixed(4)}</span>
            <span class="solveviz__err">err ${err < 1e-9 ? '0' : err.toExponential(1)}</span>
        </li>`).join('');
    return Array.from(ol.children);
}

function fillBench(root) {
    const b = benchmarkChain({ repeats: 40 });
    const set = (key, value) => {
        const el = root.querySelector(`[data-bench="${key}"]`);
        if (el) el.textContent = value;
    };
    set('n', b.n.toLocaleString());
    set('cold', b.coldIters.toFixed(2));
    set('warm', b.warmIters.toFixed(2));
    set('cut', `${Math.round(100 * (1 - b.warmIters / b.coldIters))}%`);
    set('worst', `${b.coldWorst} / ${b.warmWorst}`);
    set('err', b.maxErr.toExponential(1));
}

registerActRenderer('solver', (act, tl, { phaseAt, reduced }) => {
    const cols = gsap.utils.toArray(act.querySelectorAll('.solveviz__col'));
    if (!cols.length) return null;

    // A solver that returns a wrong vol is worse than no widget, so the
    // round-trip check runs before anything reaches the DOM.
    try {
        assertSolver();
    } catch (err) {
        act.querySelectorAll('.solveviz__steps').forEach((ol) => {
            ol.innerHTML = '<li class="solveviz__step">solver self-check failed</li>';
        });
        console.error(err);
        return null;
    }

    const price = blackScholes(S, K, T, TRUE_VOL, R, true).price;
    const runs = {
        cold: iterateRows(coldGuess(price, S, K, T)),
        // The neighbouring strike's implied vol, not a number picked to flatter
        warm: impliedVol(
            blackScholes(S, K - 2, T, 0.2345, R, true).price,
            S, K - 2, T, R, true, 0.2,
        ).iv,
    };
    runs.warm = iterateRows(runs.warm);

    const steps = cols.map((col) => {
        const ol = col.querySelector('.solveviz__steps');
        const rows = runs[col.dataset.run] || [];
        const count = col.querySelector('[data-count]');
        if (count) count.textContent = `${rows.length - 1} steps`;
        return renderSteps(ol, rows);
    });

    // The whole benchmark is a few milliseconds, so it runs on the first idle
    // slot rather than waiting on visibility. Gating it on an observer only
    // adds a way for the figures to never arrive at all.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    idle(() => fillBench(act));

    if (reduced || !tl) {
        steps.flat().forEach((li) => gsap.set(li, { opacity: 1, x: 0 }));
        return null;
    }

    const all = steps.flat();
    const viz = act.querySelector('.solveviz');
    // The columns' rules and captions have to be hidden too, not just the step
    // rows, or they sit under the stichwort while it is still on screen.
    gsap.set(viz, { opacity: 0 });
    gsap.set(all, { opacity: 0, x: -12 });

    // Both columns start together, so the warm column visibly finishes first
    // and then waits — that pause is the whole argument.
    const t = phaseAt(0);
    const PER = 0.16;
    tl.to(viz, { opacity: 1, duration: 0.3, ease: 'none' }, t);
    steps.forEach((col) => {
        col.forEach((li, i) => {
            tl.to(li, { opacity: 1, x: 0, duration: 0.12, ease: 'power2.out' }, t + 0.2 + i * PER);
        });
    });

    return () => {
        gsap.set([viz, ...all], { clearProps: 'opacity,transform' });
    };
});
