/**
 * solver.js — Newton-Raphson implied-volatility solver, cold start vs warm start.
 *
 * The point of the act this drives: on an option chain, adjacent strikes have
 * adjacent implied vols. Seeding the solver with the previous strike's answer
 * instead of a fixed guess collapses the iteration count, and the iteration
 * count is the whole cost. The numbers the page shows are measured in the
 * visitor's own browser — nothing here is a recorded figure.
 */

import { blackScholes } from './payoff.js';

const TOL = 1e-8;
const MAX_ITERS = 60;
const SIGMA_MIN = 1e-6;
const SIGMA_MAX = 5;

/**
 * Solve BS(sigma) = price for sigma.
 * @returns {{iv:number, iters:number, path:number[]}} path is the iterate
 *          sequence, used by the act to show convergence step by step.
 */
export function impliedVol(price, S, K, T, r, isCall, guess = 0.5) {
    // Bare Newton diverges on deep in-the-money strikes: vega collapses toward
    // zero there, so a single step throws sigma into the thousands. Price is
    // monotone increasing in sigma, so every evaluation brackets the root —
    // keep the bracket and bisect whenever Newton tries to leave it.
    let lo = SIGMA_MIN, hi = SIGMA_MAX;
    let sigma = Math.min(Math.max(guess, lo), hi);
    const path = [sigma];

    for (let i = 1; i <= MAX_ITERS; i++) {
        const g = blackScholes(S, K, T, sigma, r, isCall);
        const diff = g.price - price;
        if (Math.abs(diff) < TOL) return { iv: sigma, iters: i - 1, path };

        if (diff > 0) hi = sigma; else lo = sigma;

        // blackScholes reports vega per volatility point; Newton needs it per
        // unit of sigma, hence the factor of 100.
        const vega = g.vega * 100;
        let next = vega > 1e-12 ? sigma - diff / vega : NaN;
        if (!(next > lo && next < hi)) next = 0.5 * (lo + hi);

        sigma = next;
        path.push(sigma);
    }
    return { iv: sigma, iters: path.length - 1, path };
}

/** Brenner-Subrahmanyam: the standard closed-form cold-start guess. */
export function coldGuess(price, S, K, T) {
    return Math.sqrt(2 * Math.PI / T) * (price / S) || 0.5;
}

/**
 * Solve a whole strike chain both ways and time it.
 * Cold start reseeds from the closed-form guess on every strike; warm start
 * carries the previous strike's solution forward.
 * @returns {{n:number, coldIters:number, warmIters:number, coldMs:number,
 *            warmMs:number, maxErr:number}}
 */
export function benchmarkChain({ S = 100, T = 45 / 365, r = 0.065, repeats = 40 } = {}) {
    // A realistic smile: vol rises away from the money, so adjacent strikes are
    // close but not identical — warm start has to actually converge, not coast.
    const strikes = [];
    for (let K = 70; K <= 130; K += 2) {
        const m = Math.log(K / S);
        strikes.push({ K, sigma: 0.18 + 0.9 * m * m + 0.12 * m });
    }
    const quotes = strikes.map(({ K, sigma }) => ({
        K,
        sigma,
        price: blackScholes(S, K, T, sigma, r, true).price,
    }));

    let coldIters = 0, warmIters = 0, maxErr = 0;
    let coldWorst = 0, warmWorst = 0;

    // Warm the JIT on both paths before timing either. Without this the cold
    // loop pays the compile cost and the reported speedup is inflated by
    // several tens of percent — a measurement artefact, not a real gain.
    for (let w = 0; w < 20; w++) {
        let prev = 0.2;
        for (const q of quotes) {
            impliedVol(q.price, S, q.K, T, r, true, coldGuess(q.price, S, q.K, T));
            prev = impliedVol(q.price, S, q.K, T, r, true, prev).iv;
        }
    }

    const t0 = performance.now();
    for (let rep = 0; rep < repeats; rep++) {
        for (const q of quotes) {
            const out = impliedVol(q.price, S, q.K, T, r, true, coldGuess(q.price, S, q.K, T));
            coldIters += out.iters;
            coldWorst = Math.max(coldWorst, out.iters);
            maxErr = Math.max(maxErr, Math.abs(out.iv - q.sigma));
        }
    }
    const coldMs = performance.now() - t0;

    const t1 = performance.now();
    for (let rep = 0; rep < repeats; rep++) {
        let prev = 0.2;
        for (const q of quotes) {
            const out = impliedVol(q.price, S, q.K, T, r, true, prev);
            warmIters += out.iters;
            warmWorst = Math.max(warmWorst, out.iters);
            prev = out.iv;
            maxErr = Math.max(maxErr, Math.abs(out.iv - q.sigma));
        }
    }
    const warmMs = performance.now() - t1;

    const total = quotes.length * repeats;
    return {
        n: total,
        coldIters: coldIters / total,
        warmIters: warmIters / total,
        coldMs,
        warmMs,
        coldWorst,
        warmWorst,
        maxErr,
    };
}

/**
 * Round-trip check: price at a known sigma, solve back, expect the same sigma.
 * Runs before the widget is wired to the DOM — a solver that silently returns
 * a wrong vol is worse than no widget.
 */
export function assertSolver() {
    const cases = [
        [100, 100, 30 / 365, 0.2],
        [100, 120, 90 / 365, 0.35],
        [100, 85, 180 / 365, 0.15],
        [250, 240, 7 / 365, 0.55],
        // The wings, where vega collapses and bare Newton diverged
        [100, 70, 45 / 365, 0.25],
        [100, 130, 45 / 365, 0.27],
    ];
    for (const [S, K, T, sigma] of cases) {
        for (const isCall of [true, false]) {
            const price = blackScholes(S, K, T, sigma, 0.065, isCall).price;
            const { iv } = impliedVol(price, S, K, T, 0.065, isCall, 0.5);
            // 1e-5, not tighter: on the wings vega is so small that the 1e-8
            // price tolerance is only worth ~1e-6 of vol. That is conditioning,
            // not solver error, and no tolerance choice buys past it.
            if (Math.abs(iv - sigma) > 1e-5) {
                throw new Error(`IV round-trip failed: ${sigma} -> ${iv} (S=${S} K=${K})`);
            }
        }
    }
    return true;
}
