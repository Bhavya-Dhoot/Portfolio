/**
 * signal.js - market data to signal.
 *
 * Five inputs converge on a variance engine and resolve into one regime call.
 *
 * Honesty: the five readings below are a bundled sample, fixed in this file.
 * Nothing here is a live feed and the page says so. What is real is the
 * arithmetic - the z-scores, the weighted composite and the regime call are
 * computed from those inputs on the visitor's machine, not written down.
 */

// label, sample reading, display unit, long-run mean and sd, weight
export const LAYERS = [
    { key: 'vix', label: 'India VIX', value: 14.2, unit: '', mean: 15.8, sd: 3.1, w: 0.30 },
    { key: 'pcr', label: 'Options sentiment', value: 0.94, unit: ' PCR', mean: 1.05, sd: 0.18, w: 0.22 },
    { key: 'flow', label: 'FII / DII net flow', value: -1240, unit: ' cr', mean: 0, sd: 2100, w: 0.20 },
    { key: 'gift', label: 'GIFT Nifty basis', value: 38, unit: ' bps', mean: 12, sd: 26, w: 0.16 },
    { key: 'macro', label: 'Macro carry', value: 0.62, unit: '', mean: 0, sd: 1, w: 0.12 },
];

/** Standardise each reading, then combine on the declared weights. */
export function fuse(layers = LAYERS) {
    const scored = layers.map((l) => ({ ...l, z: (l.value - l.mean) / l.sd }));
    const composite = scored.reduce((a, l) => a + l.w * l.z, 0);
    const regime = composite > 0.5 ? 'Risk-off'
        : composite < -0.5 ? 'Risk-on'
            : 'Neutral';
    return { scored, composite, regime };
}

/** Weights must sum to 1, or the composite is not on the z-scale it claims. */
export function assertSignal() {
    const total = LAYERS.reduce((a, l) => a + l.w, 0);
    if (Math.abs(total - 1) > 1e-9) throw new Error(`weights sum to ${total}, not 1`);
    const { scored, composite } = fuse();
    const manual = scored.reduce((a, l) => a + l.w * (l.value - l.mean) / l.sd, 0);
    if (Math.abs(manual - composite) > 1e-12) throw new Error('composite mismatch');
    return true;
}
