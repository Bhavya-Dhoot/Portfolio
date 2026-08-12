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

    // One span per glyph reads as a stream of single letters in some screen
    // readers, so the sentence is moved onto the element as its label and the
    // glyphs themselves are hidden from assistive tech.
    el.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim());
    el.setAttribute('role', 'text');

    el.textContent = '';
    const chars = [];

    for (const token of text.split(/(\s+)/)) {
        if (!token) continue;
        if (/^\s+$/.test(token)) {
            const sp = document.createElement('span');
            sp.className = 'brief__sp';
            sp.setAttribute('aria-hidden', 'true');
            sp.textContent = token;
            el.appendChild(sp);
            continue;
        }
        const word = document.createElement('span');
        word.className = 'brief__word';
        word.setAttribute('aria-hidden', 'true');
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

// One per brief/system pair, in markup order. Shown while that pair is on
// screen, so the act reads as "every corner of the business", not one project.
const DOMAINS = ['Finance', 'Sales', 'Supply chain', 'Planning', 'Support'];

registerActRenderer('brief', (act, tl, { phaseAt, reduced }) => {
    const reel = act.querySelector('.brief__reel');
    const pairs = gsap.utils.toArray(act.querySelectorAll('.brief__pair'));
    const lines = gsap.utils.toArray(act.querySelectorAll('.brief__line, .brief__code'));
    const domainEl = act.querySelector('[data-brief-domain]');
    if (!reel || !pairs.length) return null;

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

    // Glyphs grouped by the pair they belong to, so a brief and the system it
    // became are animated as one unit.
    const lineIndex = new Map(
        pairs.map((pairEl) => [
            pairEl,
            gsap.utils.toArray(pairEl.querySelectorAll('.brief__line, .brief__code')).map(splitChars),
        ]),
    );
    const all = [...lineIndex.values()].flat(2);

    if (reduced || !tl) {
        // No scroll to drive the reel. Showing only the first pair would throw
        // away the point of the act — that the work spans the whole business —
        // so every pair is laid out as a static list instead.
        reel.classList.add('is-static');
        gsap.set(all, { opacity: 1, x: 0, y: 0, rotate: 0 });
        if (domainEl) domainEl.textContent = 'Finance to support';
        return () => reel.classList.remove('is-static');
    }

    // Deterministic scatter: seeded off the index so the layout is identical on
    // every replay and on resize, which a random() would not be.
    const scatter = (i) => {
        const a = (i * 2.399963) % (Math.PI * 2);      // golden-angle spread
        const r = 60 + ((i * 37) % 90);
        return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.6, rotate: ((i % 7) - 3) * 12 };
    };

    // Hidden until the stichwort has cleared, or the two sit on top of each other
    const wrap = act.querySelector('.brief');
    gsap.set(wrap, { opacity: 0 });
    gsap.set(all, { opacity: 0 });

    const t = phaseAt(0);

    // The brief and the system it became arrive together and hold together, so
    // the ask and the answer are readable as one statement. Each pair assembles
    // quickly, then simply stays put for most of its scroll budget before
    // leaving. Nothing is captured beyond the act's existing pin — the dwell is
    // scroll distance over which the text does not move, so the reader can
    // always keep scrolling straight past it.
    const LAND = 0.2;
    const LEAVE = 0.12;
    const STEP = 0.72;                 // ~0.38 units of it fully settled

    const pairAt = (i) => t + 0.35 + i * STEP;

    tl.to(wrap, { opacity: 1, duration: 0.25, ease: 'none' }, t);

    pairs.forEach((pairEl, p) => {
        const at = pairAt(p);
        // Both lines of the pair, quote first then its system line a beat later
        const groups = lineIndex.get(pairEl);

        groups.forEach((glyphs, row) => {
            const lead = row * 0.06;

            glyphs.forEach((ch, i) => {
                const s = scatter(i + p * 3 + row);
                tl.fromTo(ch,
                    { opacity: 0, x: -s.x, y: -s.y, rotate: -s.rotate },
                    // power4.out decelerates hard into place, so the glyphs are
                    // effectively settled well before the tween formally ends —
                    // the line arrives and calms rather than snapping.
                    { opacity: 1, x: 0, y: 0, rotate: 0, duration: LAND, ease: 'power4.out' },
                    at + lead + (i % 13) * 0.008);
            });

            // The last pair stays put: it hands over to the working pipeline.
            if (p === pairs.length - 1) return;
            glyphs.forEach((ch, i) => {
                const s = scatter(i + p * 3 + row);
                tl.to(ch, {
                    opacity: 0, x: s.x, y: s.y, rotate: s.rotate,
                    duration: LEAVE, ease: 'power2.in',
                }, at + STEP - LEAVE + (i % 11) * 0.006);
            });
        });
    });

    // The domain label is derived from timeline time rather than set by tween
    // callbacks: under scrub only the advancing tween fires, so a callback-driven
    // label desyncs the moment someone scrolls quickly.
    if (domainEl) {
        tl.eventCallback('onUpdate', () => {
            const now = tl.time();
            let idx = 0;
            for (let i = 0; i < pairs.length; i++) if (now >= pairAt(i)) idx = i;
            const next = DOMAINS[Math.min(idx, DOMAINS.length - 1)];
            if (domainEl.textContent !== next) domainEl.textContent = next;
        });
    }

    return () => {
        tl.eventCallback('onUpdate', null);
        gsap.set([wrap, ...all], { clearProps: 'opacity,transform' });
    };
});
