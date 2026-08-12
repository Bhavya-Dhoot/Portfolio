/**
 * pipeline.js — Two-pass reconciliation over a bundled fixture.
 *
 * This is the shape of the unattended daily reconciliation built during the
 * Health Factory engagement, reduced to the part that is safe to show: the
 * matching logic. Nothing here is client data. The fixture below is invented
 * for this page and the page says so.
 *
 * Pass 1 matches on an exact reference and amount. Pass 2 takes what is left
 * and tries a normalised reference within a small amount and date tolerance —
 * which is where the real work is, because feeds disagree about spacing,
 * casing, rounding and value dates. Whatever survives both passes is an
 * exception with a stated reason, not a silent drop.
 */

const DAY = 86400000;

/** Bank feed — sample, not client data. */
export const BANK = [
    { id: 'B01', date: '2026-07-01', ref: 'INV-4471', amount: 128400.00 },
    { id: 'B02', date: '2026-07-01', ref: 'INV-4472', amount: 96150.50 },
    { id: 'B03', date: '2026-07-02', ref: 'inv 4473', amount: 42000.00 },
    { id: 'B04', date: '2026-07-02', ref: 'INV-4474', amount: 315720.00 },
    { id: 'B05', date: '2026-07-03', ref: 'INV-4475', amount: 8890.25 },
    { id: 'B06', date: '2026-07-03', ref: 'INV-4476', amount: 271300.00 },
    { id: 'B07', date: '2026-07-04', ref: 'INV-4477', amount: 54600.00 },
    { id: 'B08', date: '2026-07-04', ref: 'INV 4478', amount: 19875.00 },
    { id: 'B09', date: '2026-07-05', ref: 'INV-4479', amount: 133000.00 },
    { id: 'B10', date: '2026-07-05', ref: 'INV-4480', amount: 62450.75 },
    { id: 'B11', date: '2026-07-06', ref: 'INV-4481', amount: 47500.00 },
    { id: 'B12', date: '2026-07-06', ref: 'INV-4482', amount: 210000.00 },
];

/** Ledger feed — sample, not client data. */
export const LEDGER = [
    { id: 'L01', date: '2026-07-01', ref: 'INV-4471', amount: 128400.00 },
    { id: 'L02', date: '2026-07-01', ref: 'INV-4472', amount: 96150.50 },
    // Reference formatted differently and posted a day late: pass 2 catches it
    { id: 'L03', date: '2026-07-03', ref: 'INV-4473', amount: 42000.00 },
    { id: 'L04', date: '2026-07-02', ref: 'INV-4474', amount: 315720.00 },
    { id: 'L05', date: '2026-07-03', ref: 'INV-4475', amount: 8890.25 },
    { id: 'L06', date: '2026-07-03', ref: 'INV-4476', amount: 271300.00 },
    { id: 'L07', date: '2026-07-04', ref: 'INV-4477', amount: 54600.00 },
    { id: 'L08', date: '2026-07-05', ref: 'INV-4478', amount: 19875.00 },
    { id: 'L09', date: '2026-07-05', ref: 'INV-4479', amount: 133000.00 },
    // Genuine break: 4,000 short against the bank
    { id: 'L10', date: '2026-07-05', ref: 'INV-4480', amount: 58450.75 },
    { id: 'L11', date: '2026-07-06', ref: 'INV-4481', amount: 47500.00 },
    // B12 has no counterpart at all; L12 is for an invoice the bank never saw
    { id: 'L12', date: '2026-07-06', ref: 'INV-4499', amount: 77000.00 },
];

const normalise = (ref) => ref.replace(/[^a-z0-9]/gi, '').toUpperCase();

/**
 * @returns {{matched:Array, exceptions:Array, stats:{exact:number, fuzzy:number,
 *            exceptions:number, rate:number}}}
 */
export function reconcile(bank = BANK, ledger = LEDGER, { amountTol = 1, dayTol = 2 } = {}) {
    const open = new Set(ledger.map((l) => l.id));
    const byId = new Map(ledger.map((l) => [l.id, l]));
    const matched = [];

    // Pass 1 — exact reference and exact amount
    for (const b of bank) {
        const hit = ledger.find((l) => open.has(l.id) && l.ref === b.ref && l.amount === b.amount);
        if (hit) {
            open.delete(hit.id);
            matched.push({ bank: b, ledger: hit, pass: 'exact' });
        }
    }

    // Pass 2 — normalised reference, within amount and date tolerance
    const stillOpen = bank.filter((b) => !matched.some((m) => m.bank.id === b.id));
    for (const b of stillOpen) {
        const hit = ledger.find((l) => {
            if (!open.has(l.id)) return false;
            if (normalise(l.ref) !== normalise(b.ref)) return false;
            if (Math.abs(l.amount - b.amount) > amountTol) return false;
            return Math.abs(Date.parse(l.date) - Date.parse(b.date)) <= dayTol * DAY;
        });
        if (hit) {
            open.delete(hit.id);
            matched.push({ bank: b, ledger: hit, pass: 'tolerance' });
        }
    }

    // Anything left is an exception, with the reason it failed
    const exceptions = [];
    for (const b of bank) {
        if (matched.some((m) => m.bank.id === b.id)) continue;
        const sameRef = ledger.find((l) => normalise(l.ref) === normalise(b.ref));
        exceptions.push({
            side: 'bank',
            row: b,
            reason: sameRef
                ? `amount differs by ${Math.abs(sameRef.amount - b.amount).toLocaleString()}`
                : 'no counterpart in ledger',
        });
    }
    for (const id of open) {
        const l = byId.get(id);
        const sameRef = bank.find((b) => normalise(b.ref) === normalise(l.ref));
        exceptions.push({
            side: 'ledger',
            row: l,
            reason: sameRef ? 'amount differs' : 'no counterpart in bank feed',
        });
    }

    const exact = matched.filter((m) => m.pass === 'exact').length;
    const fuzzy = matched.filter((m) => m.pass === 'tolerance').length;
    return {
        matched,
        exceptions,
        stats: {
            exact,
            fuzzy,
            exceptions: exceptions.length,
            rate: matched.length / bank.length,
        },
    };
}

/**
 * The fixture is built to exercise every branch, so the counts are known in
 * advance. If the matching logic drifts, this fails rather than the page
 * quietly reporting a different number.
 */
export function assertPipeline() {
    const { stats, exceptions } = reconcile();
    // B03 and B08 both carry a differently formatted reference, so both fall
    // through to pass 2; B08 is also posted a day late.
    if (stats.exact !== 8) throw new Error(`expected 8 exact, got ${stats.exact}`);
    if (stats.fuzzy !== 2) throw new Error(`expected 2 tolerance matches, got ${stats.fuzzy}`);
    if (stats.exceptions !== 4) throw new Error(`expected 4 exceptions, got ${stats.exceptions}`);
    // Every exception must carry a reason; a blank one is a silent drop
    if (exceptions.some((e) => !e.reason)) throw new Error('exception without a reason');
    return true;
}
