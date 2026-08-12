/**
 * Act: brief to running system.
 *
 * A sentence a client actually says comes apart, reforms as the rule that
 * implements it, and the rule then runs over a bundled fixture. The middle
 * beat is the reference's flying-letters set-piece; the end of it is real
 * matching logic with real counts.
 */

import { gsap } from 'gsap';
import { registerActRenderer } from '../acts.js';
import { reconcile, assertPipeline, BANK } from '../components/pipeline.js';

/**
 * Wrap each character in a span so the two lines can be animated per glyph.
 * Characters are nested inside word wrappers: a flat run of inline-blocks lets
 * the browser break between any two glyphs, which reads as "did no / t land".
 */
function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    const chars = [];

    for (const token of text.split(/(\s+)/)) {
        if (!token) continue;
        if (/^\s+$/.test(token)) {
            const sp = document.createElement('span');
            sp.className = 'brief__sp';
            sp.textContent = token;
            el.appendChild(sp);
            continue;
        }
        const word = document.createElement('span');
        word.className = 'brief__word';
        for (const ch of token) {
            const span = document.createElement('span');
            span.className = 'brief__ch';
            span.textContent = ch;
            word.appendChild(span);
            chars.push(span);
        }
        el.appendChild(word);
    }
    return chars;
}

registerActRenderer('brief', (act, tl, { phaseAt, reduced }) => {
    const briefEl = act.querySelector('.brief__line');
    const codeEl = act.querySelector('.brief__code');
    if (!briefEl || !codeEl) return null;

    assertPipeline();
    const { matched, exceptions, stats } = reconcile();

    // Fill the results phase from the run, not from written-down numbers
    const set = (key, value) => {
        const el = act.querySelector(`[data-pipe="${key}"]`);
        if (el) el.textContent = value;
    };
    set('rows', BANK.length);
    set('exact', stats.exact);
    set('fuzzy', stats.fuzzy);
    set('exceptions', stats.exceptions);
    set('rate', `${(stats.rate * 100).toFixed(1)}%`);

    const list = act.querySelector('.pipe-exceptions');
    if (list) {
        list.innerHTML = exceptions.map((e) => `
            <li class="pipe-exception">
                <span class="pipe-exception__id font-mono">${e.row.id}</span>
                <span class="pipe-exception__ref font-mono">${e.row.ref}</span>
                <span class="pipe-exception__why font-mono">${e.reason}</span>
            </li>`).join('');
    }
    const sample = act.querySelector('.pipe-sample');
    if (sample) {
        sample.innerHTML = matched.slice(0, 4).map((m) => `
            <li class="pipe-match">
                <span class="font-mono">${m.bank.id} &rarr; ${m.ledger.id}</span>
                <span class="font-mono">${m.bank.ref}</span>
                <span class="font-mono pipe-match__pass" data-pass="${m.pass}">${m.pass}</span>
            </li>`).join('');
    }

    const briefChars = splitChars(briefEl);
    const codeChars = splitChars(codeEl);

    if (reduced || !tl) {
        gsap.set([...briefChars, ...codeChars], { opacity: 1, x: 0, y: 0, rotate: 0 });
        return null;
    }

    // Deterministic scatter: seeded off the index so the layout is identical on
    // every replay and on resize, which a random() would not be.
    const scatter = (i, n) => {
        const a = (i * 2.399963) % (Math.PI * 2);      // golden-angle spread
        const r = 60 + ((i * 37) % 90);
        return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.6, rotate: ((i % 7) - 3) * 12, n };
    };

    // Hidden until the stichwort has cleared, or the two sit on top of each other
    const wrap = act.querySelector('.brief');
    gsap.set(wrap, { opacity: 0 });
    gsap.set(codeChars, { opacity: 0 });

    const t = phaseAt(0);
    tl.to(wrap, { opacity: 1, duration: 0.25, ease: 'none' }, t);

    // The sentence comes apart, glyph by glyph
    briefChars.forEach((ch, i) => {
        const s = scatter(i);
        tl.to(ch, {
            opacity: 0, x: s.x, y: s.y, rotate: s.rotate,
            duration: 0.5, ease: 'power2.in',
        }, t + 0.4 + (i % 11) * 0.02);
    });

    // and lands as the rule that implements it
    codeChars.forEach((ch, i) => {
        const s = scatter(i + 3);
        tl.fromTo(ch,
            { opacity: 0, x: -s.x, y: -s.y, rotate: -s.rotate },
            { opacity: 1, x: 0, y: 0, rotate: 0, duration: 0.55, ease: 'power3.out' },
            t + 0.85 + (i % 13) * 0.02);
    });

    return () => {
        gsap.set([wrap, ...briefChars, ...codeChars], { clearProps: 'opacity,transform' });
    };
});
