/**
 * payoff.js — Interactive Black-Scholes payoff and Greeks explorer.
 * Draws expiry payoff against present theoretical value across a spot range,
 * and reports the Greeks for the current inputs. Redraws on input only:
 * no animation loop, so it costs nothing while idle.
 */

// ── Black-Scholes ──────────────────────────────────────────────────
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

// ── Scenario presets ───────────────────────────────────────────────
// Each one is a regime where a different Greek dominates, so stepping through
// them is a tour of what the numbers actually mean.
const PRESETS = {
    atm: {
        spot: 100, strike: 100, vol: 20, days: 30, call: true,
        note: 'At the money, one month out. Gamma and vega are at their peak per rupee of premium — the most sensitive point on the surface, and the hardest to hedge.',
    },
    itm: {
        spot: 130, strike: 100, vol: 20, days: 90, call: true,
        note: 'Deep in the money. Delta approaches 1, so the option tracks the underlying almost one for one; gamma and vega collapse. You are paying for leverage, not optionality.',
    },
    otm: {
        spot: 100, strike: 112, vol: 45, days: 21, call: true,
        note: 'Out of the money, three weeks left. Low delta and heavy theta: the premium is cheap, but it bleeds every day the spot fails to move.',
    },
    expiry: {
        spot: 100, strike: 100, vol: 30, days: 3, call: true,
        note: 'Expiry week, pinned at the strike. Gamma spikes as T goes to zero — delta swings between 0 and 1 on small moves, which is exactly where hedging costs blow out.',
    },
    leaps: {
        spot: 100, strike: 100, vol: 25, days: 365, call: true,
        note: 'A year to run. Vega dominates and theta is barely visible; this position is a view on volatility far more than a view on direction.',
    },
    hedge: {
        spot: 100, strike: 90, vol: 25, days: 60, call: false,
        note: 'Protective put, ten percent below spot. Negative delta offsets a long book, and the premium is the explicit price of that downside insurance.',
    },
};

// ── Component ──────────────────────────────────────────────────────
export function initPayoff() {
    const root = document.getElementById('payoff');
    if (!root) return;

    const canvas = root.querySelector('.payoff-canvas');
    const readout = root.querySelector('.payoff-readout');
    if (!canvas || !readout) return;
    const ctx = canvas.getContext('2d');

    const inputs = {
        spot: root.querySelector('[data-in="spot"]'),
        strike: root.querySelector('[data-in="strike"]'),
        vol: root.querySelector('[data-in="vol"]'),
        days: root.querySelector('[data-in="days"]'),
    };
    const typeBtns = Array.from(root.querySelectorAll('[data-type]'));
    let isCall = true;

    const ACCENT = '#c8ff00';
    const PAPER = 'rgba(240, 237, 232, ';
    let cw = 0, ch = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cw = rect.width;
        ch = rect.height;
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    function draw() {
        if (!cw) return;
        const S = +inputs.spot.value;
        const K = +inputs.strike.value;
        const sigma = +inputs.vol.value / 100;
        const T = +inputs.days.value / 365;
        const r = 0.065;                      // RBI repo, near enough for INR rates

        const g = blackScholes(S, K, T, sigma, r, isCall);

        // Spot range to plot
        const lo = K * 0.6, hi = K * 1.4;
        const premium = g.price;
        const payoffAt = (s) => (isCall ? Math.max(0, s - K) : Math.max(0, K - s)) - premium;
        const valueAt = (s) => blackScholes(s, K, T, sigma, r, isCall).price - premium;

        // Vertical scale from both curves
        let maxAbs = 1e-6;
        for (let i = 0; i <= 80; i++) {
            const s = lo + (hi - lo) * (i / 80);
            maxAbs = Math.max(maxAbs, Math.abs(payoffAt(s)), Math.abs(valueAt(s)));
        }
        maxAbs *= 1.15;

        const padL = 8, padR = 8, padT = 12, padB = 22;
        const W = cw - padL - padR, H = ch - padT - padB;
        const x = (s) => padL + ((s - lo) / (hi - lo)) * W;
        const y = (v) => padT + H / 2 - (v / maxAbs) * (H / 2);

        ctx.clearRect(0, 0, cw, ch);

        // Zero line
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, y(0));
        ctx.lineTo(cw - padR, y(0));
        ctx.stroke();

        // Strike marker
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.moveTo(x(K), padT);
        ctx.lineTo(x(K), ch - padB);
        ctx.stroke();
        ctx.setLineDash([]);

        // Present value curve
        ctx.beginPath();
        for (let i = 0; i <= 160; i++) {
            const s = lo + (hi - lo) * (i / 160);
            const px = x(s), py = y(valueAt(s));
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.strokeStyle = PAPER + '0.5)';
        ctx.lineWidth = 1.25;
        ctx.stroke();

        // Expiry payoff
        ctx.beginPath();
        for (let i = 0; i <= 160; i++) {
            const s = lo + (hi - lo) * (i / 160);
            const px = x(s), py = y(payoffAt(s));
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 1.75;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Spot marker
        if (S >= lo && S <= hi) {
            ctx.beginPath();
            ctx.arc(x(S), y(valueAt(S)), 3, 0, Math.PI * 2);
            ctx.fillStyle = ACCENT;
            ctx.fill();
        }

        // Axis ends
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = PAPER + '0.4)';
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        ctx.fillText(lo.toFixed(0), padL, ch - 6);
        ctx.textAlign = 'right';
        ctx.fillText(hi.toFixed(0), cw - padR, ch - 6);
        ctx.textAlign = 'center';
        ctx.fillText(`K ${K}`, x(K), ch - 6);

        readout.innerHTML = [
            ['Premium', g.price.toFixed(2)],
            ['Delta', g.delta.toFixed(3)],
            ['Gamma', g.gamma.toFixed(4)],
            ['Vega', g.vega.toFixed(3)],
            ['Theta', g.theta.toFixed(3)],
        ].map(([k, v]) => `<div class="payoff-metric"><span>${k}</span><b>${v}</b></div>`).join('');
    }

    function syncLabel(el) {
        const out = root.querySelector(`[data-out="${el.dataset.in}"]`);
        if (out) out.textContent = el.value;
    }

    function setType(call) {
        isCall = call;
        typeBtns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.type === 'call') === call)));
    }

    // ── Presets ────────────────────────────────────────────────────
    const presetBtns = Array.from(root.querySelectorAll('[data-preset]'));
    const note = root.querySelector('.payoff-note');

    function applyPreset(key) {
        const p = PRESETS[key];
        if (!p) return;
        inputs.spot.value = p.spot;
        inputs.strike.value = p.strike;
        inputs.vol.value = p.vol;
        inputs.days.value = p.days;
        Object.values(inputs).forEach(syncLabel);
        setType(p.call);
        if (note) note.textContent = p.note;
        presetBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.preset === key));
        draw();
    }

    // Any manual adjustment means the visitor has left the preset behind
    function clearPreset() {
        presetBtns.forEach((b) => b.classList.remove('is-active'));
        if (note) note.textContent = 'Custom inputs. Premium, Greeks and both curves are recomputed on every move.';
    }

    presetBtns.forEach((btn) => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    Object.values(inputs).forEach((el) => {
        el.addEventListener('input', () => {
            syncLabel(el);
            clearPreset();
            draw();
        });
        syncLabel(el);
    });

    typeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            setType(btn.dataset.type === 'call');
            clearPreset();
            draw();
        });
    });

    new ResizeObserver(resize).observe(canvas);
    resize();
    applyPreset('atm');
}
