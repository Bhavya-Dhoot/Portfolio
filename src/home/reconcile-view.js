/**
 * home/reconcile-view.js - the two-pass matcher, running on a bundled fixture.
 * Every line, ellipse and chip number comes from reconcile() output, so if the
 * fixture changes the picture changes. This is the one scrubbed element on the page.
 */

import { gsap, REDUCED, drawOn, pop, reveal } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink, label } from '../doodle/draw.js';
import { BANK, LEDGER, reconcile } from '../tools/reconcile.js';

const norm = (ref) => ref.replace(/[^a-z0-9]/gi, '').toUpperCase();
const ROWS = 6;
const Y0 = 70;
const PITCH = 78;
const rowY = (i) => Y0 + i * PITCH;
const mid = (i) => rowY(i) + 28;

/** Six bank rows worth showing: everything that is not an exact match first, then exact ones to fill. */
function pickBank(res) {
    const exactIds = new Set(res.matched.filter((m) => m.pass === 'exact').map((m) => m.bank.id));
    const interesting = BANK.filter((b) => !exactIds.has(b.id));
    const plain = BANK.filter((b) => exactIds.has(b.id));
    const chosen = [...interesting, ...plain].slice(0, ROWS);
    return BANK.filter((b) => chosen.includes(b));
}

/** The ledger row shown beside each picked bank row: its match, else same reference, else any spare. */
function pickLedger(res, bankRows) {
    const used = new Set();
    const out = [];
    bankRows.forEach((b) => {
        const m = res.matched.find((x) => x.bank.id === b.id);
        let l = m ? m.ledger : LEDGER.find((x) => !used.has(x.id) && norm(x.ref) === norm(b.ref));
        if (!l) {
            const exIds = new Set(res.exceptions.filter((e) => e.side === 'ledger').map((e) => e.row.id));
            l = LEDGER.find((x) => !used.has(x.id) && exIds.has(x.id)) || LEDGER.find((x) => !used.has(x.id));
        }
        used.add(l.id);
        out.push(l);
    });
    return out;
}

export function initReconcile() {
    const svg = document.getElementById('rec-svg');
    if (!svg) return;

    const res = reconcile(BANK, LEDGER);
    const { stats } = res;

    // The chip numbers are computed, never typed
    const counts = document.getElementById('rec-counts');
    if (counts) counts.textContent = `${stats.exact} exact, ${stats.fuzzy} within tolerance, ${stats.exceptions} exceptions (sample feeds)`;

    const bankRows = pickBank(res);
    const ledgerRows = pickLedger(res, bankRows);
    const bankEx = new Map(res.exceptions.filter((e) => e.side === 'bank').map((e) => [e.row.id, e]));
    const ledgerEx = new Map(res.exceptions.filter((e) => e.side === 'ledger').map((e) => [e.row.id, e]));

    const d = doodle(104);
    const frame = [];     // boxes and scribbles: drawn once on enter
    const links = [];     // match lines and exception rings: drawn by the scroll
    const notes = [];     // hand notes that wait for the links

    // On a phone the 640-wide drawing shrinks to about half size, so every word scales up to stay readable
    const phone = window.matchMedia('(max-width: 767px)').matches;
    const MONO = phone ? 32 : 20;
    const NOTE = phone ? 28 : 18;
    const WHY = phone ? 36 : 26;
    const PITCH_R = phone ? 32 : 24;

    label(svg, 40, 40, 'BANK', { size: MONO });
    label(svg, 420, 40, 'LEDGER', { size: MONO });

    bankRows.forEach((b, i) => {
        frame.push({ d: d.rect(40, rowY(i), 180, 56), w: 5 });
        frame.push({ d: d.scrib(56, mid(i), 140, 1), w: 4 });
    });
    ledgerRows.forEach((l, j) => {
        frame.push({ d: d.rect(420, rowY(j), 180, 56), w: 5 });
        frame.push({ d: d.scrib(436, mid(j), 140, 1), w: 4 });
    });

    res.matched.forEach((m) => {
        const i = bankRows.findIndex((b) => b.id === m.bank.id);
        const j = ledgerRows.findIndex((l) => l.id === m.ledger.id);
        if (i < 0 || j < 0) return;
        if (m.pass === 'exact') {
            links.push({ d: d.line(220, mid(i), 420, mid(j), 8), w: 4 });
        } else {
            links.push({ d: d.line(220, mid(i), 420, mid(j), 8), w: 4, dash: true });
            notes.push(phone
                ? label(svg, 320, mid(i) - 12, 'within tolerance', { font: 'hand', size: NOTE, anchor: 'middle' })
                : label(svg, 246, mid(i) - 12, 'within tolerance', { font: 'hand', size: NOTE }));
        }
    });

    const reasonsBank = [];
    const reasonsLedger = [];
    bankRows.forEach((b, i) => {
        if (bankEx.has(b.id)) {
            links.push({ d: d.ellipse(130, mid(i), 112, 40), w: 4 });
            reasonsBank.push(`bank ${b.ref}: ${bankEx.get(b.id).reason}`);
        }
    });
    ledgerRows.forEach((l, j) => {
        if (ledgerEx.has(l.id)) {
            links.push({ d: d.ellipse(510, mid(j), 112, 40), w: 4 });
            reasonsLedger.push(`ledger ${l.ref}: ${ledgerEx.get(l.id).reason}`);
        }
    });
    // One "why?" in the gap between the columns for each row that carries an exception
    bankRows.forEach((b, i) => {
        const hit = bankEx.has(b.id) || ledgerEx.has(ledgerRows[i] && ledgerRows[i].id);
        if (hit) notes.push(label(svg, 290, mid(i) + 8, 'why?', { font: 'hand', size: WHY, anchor: 'middle' }));
    });
    // One left-aligned reason list under the drawing, bank reasons first
    const reasons = reasonsBank.concat(reasonsLedger);
    reasons.forEach((t, k) => notes.push(label(svg, 40, 548 + k * PITCH_R, t, { font: 'hand', size: NOTE })));
    // Grow the drawing to hold however many reasons the fixture produces
    const H = Math.max(620, 548 + reasons.length * PITCH_R + 16);
    svg.setAttribute('viewBox', `0 0 640 ${H}`);
    svg.style.aspectRatio = `640 / ${H}`;

    const framePaths = ink(svg, frame);
    const linkPaths = ink(svg, links);

    // Boxes and scribbles draw on once, as the section enters
    drawOn(framePaths, { stagger: .04, dur: .5, start: 'top 80%', trigger: svg });
    // THE scrubbed element on this page: the reader draws the matches by scrolling and can stop anywhere
    drawOn(linkPaths, { scrub: .6, start: 'top 70%', end: 'bottom 70%', trigger: svg });

    // Hand notes wait until the reader is well into the drawing
    if (!REDUCED && notes.length) {
        gsap.set(notes, { opacity: 0 });
        gsap.to(notes, { opacity: 1, duration: .3, stagger: .1, scrollTrigger: { trigger: svg, start: 'top 40%', once: true } });
    }

    // Text column rises in; the chip springs in once the section is half in view
    const sec = document.getElementById('reconcile');
    reveal(sec.querySelectorAll('.rec-text > :not(.rec-chip)'), { start: 'top 80%', stagger: .08 });
    pop(document.getElementById('rec-chip'), { start: 'top 65%' });
}
