/**
 * blackscholes.js - Black-Scholes price and Greeks, plus the scenario presets
 * the home-page options desk steps through.
 */

// Standard normal CDF, Abramowitz and Stegun 26.2.17 (|error| < 7.5e-8)
function N(x) {
    const b = [0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429];
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const pdf = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
    let poly = 0;
    for (let i = b.length - 1; i >= 0; i--) poly = (poly + b[i]) * t;
    const upper = pdf * poly;           // P(X > |x|)
    return x >= 0 ? 1 - upper : upper;
}

function pdf(x) {
    return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

/**
 * @returns {{price:number, delta:number, gamma:number, vega:number, theta:number}}
 * vega is per 1 volatility point, theta per calendar day.
 */
export function blackScholes(S, K, T, sigma, r, isCall) {
    if (T <= 0 || sigma <= 0) {
        const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
        return { price: intrinsic, delta: isCall ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, vega: 0, theta: 0 };
    }
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;
    const disc = Math.exp(-r * T);

    const price = isCall
        ? S * N(d1) - K * disc * N(d2)
        : K * disc * N(-d2) - S * N(-d1);

    const delta = isCall ? N(d1) : N(d1) - 1;
    const gamma = pdf(d1) / (S * sigma * sqrtT);
    const vega = S * pdf(d1) * sqrtT / 100;
    const thetaYear = isCall
        ? -S * pdf(d1) * sigma / (2 * sqrtT) - r * K * disc * N(d2)
        : -S * pdf(d1) * sigma / (2 * sqrtT) + r * K * disc * N(-d2);

    return { price, delta, gamma, vega, theta: thetaYear / 365 };
}

// Scenario presets. Each one is a regime where a different Greek dominates, so
// stepping through them is a tour of what the numbers actually mean.
export const PRESETS = {
    atm: { spot: 100, strike: 100, vol: 20, days: 30, call: true },
    itm: { spot: 130, strike: 100, vol: 20, days: 90, call: true },
    otm: { spot: 100, strike: 112, vol: 45, days: 21, call: true },
    expiry: { spot: 100, strike: 100, vol: 30, days: 3, call: true },
    leaps: { spot: 100, strike: 100, vol: 25, days: 365, call: true },
    hedge: { spot: 100, strike: 90, vol: 25, days: 60, call: false },
};
