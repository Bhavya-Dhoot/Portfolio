/**
 * Generates dist/llms-full.txt from the built HTML.
 *
 * Runs after every build so it cannot drift from the site. A hand-maintained
 * copy of the page content is worse than no file at all: it goes stale, and a
 * stale full-text dump is exactly the thing an answer engine will quote.
 *
 * Extraction is deliberately dumb - it takes the text that is actually in the
 * markup. Anything a widget computes at runtime is not here, which is correct:
 * those numbers belong to the visitor's browser, not to this file.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const ORIGIN = 'https://bhavya-dhoot.vercel.app';

const PAGES = [
    { file: 'index.html', path: '/', title: 'Home' },
    { file: 'work.html', path: '/work', title: 'Work' },
    { file: 'about.html', path: '/about', title: 'About' },
];

const ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    middot: '·', mdash: '-', ndash: '-', rarr: '→', larr: '←',
    ldquo: '"', rdquo: '"', lsquo: "'", rsquo: "'", hellip: '…',
    times: '×', sigma: 'σ', Sigma: 'Σ', Delta: 'Δ', Gamma: 'Γ',
    nu: 'ν', Theta: 'Θ', radic: '√', sup2: '²', deg: '°', minus: '−',
};

function decode(s) {
    return s
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&([a-z]+\d*);/gi, (m, name) => ENTITIES[name] ?? m);
}

/** Strip a document down to headings and prose, in source order. */
function extract(html) {
    const body = html.replace(/[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*/i, '');

    const cleaned = body
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<svg[\s\S]*?<\/svg>/gi, '')
        .replace(/<canvas[\s\S]*?<\/canvas>/gi, '')
        // UI state, not copy: the "measuring" placeholder and the stamps.
        .replace(/<span class="(?:wait|stamp)(?:\s[^"]*)?"[^>]*>[\s\S]*?<\/span>/gi, '')
        // Empty swipe element, and no stray space before punctuation after an inline close.
        .replace(/<i aria-hidden="true"><\/i>/g, '')
        .replace(/<\/(?:span|i|em|b|strong)>(?=[:;,.!?])/g, '');

    const flat = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    const out = [];

    // Metric blocks (span.fact holding span.fact-v and span.fact-l) are label + value in sibling spans, and carry the page's
    // most quotable facts. They are collected in a separate pass: putting a block
    // element in the prose alternation below makes a matched element consume the <p> tags
    // nested inside it, which silently drops half the page.
    // The negative lookahead stops at another outer .fact (class "fact" or "fact x"), never at the inner .fact-v or .fact-l.
    const metric = /<span class="fact(?:\s[^"]*)?"[^>]*>((?:(?!<span class="fact(?:\s[^"]*)?")[\s\S])*?<\/span>\s*<\/span>)/gi;
    const metrics = new Map();
    let k;
    while ((k = metric.exec(cleaned)) !== null) {
        const text = flat(k[1]);
        if (text.length > 1) metrics.set(k.index, text);
    }

    // Innermost blocks only, so <p>/<h3>/<li> nested inside an <li> are emitted one by one.
    const token = /<(h[1-6]|p|li|dt|dd|th|td)\b[^>]*>((?:(?!<(?:h[1-6]|p|li|dt|dd|th|td)\b)[\s\S])*?)<\/\1>/gi;
    let m;
    while ((m = token.exec(cleaned)) !== null) {
        // Emit any metric block that appeared before this prose node, so the
        // figures stay in document order next to the copy that frames them.
        for (const [at, text] of metrics) {
            if (at < m.index) { out.push({ tag: 'li', text }); metrics.delete(at); }
        }
        const text = flat(m[2]);
        if (text.length < 2) continue;
        out.push({ tag: m[1].toLowerCase(), text });
    }
    for (const text of metrics.values()) out.push({ tag: 'li', text });
    return out;
}

function render(nodes) {
    const seen = new Set();
    const lines = [];
    for (const n of nodes) {
        if (seen.has(n.text)) continue;      // nav and footer repeat across blocks
        seen.add(n.text);
        if (/^h[1-6]$/.test(n.tag)) {
            const level = Math.min(6, Number(n.tag[1]) + 2);
            lines.push('', '#'.repeat(level) + ' ' + n.text, '');
        } else if (n.tag === 'dt' || n.tag === 'th') {
            lines.push('', '**' + n.text + '**');
        } else if (n.tag === 'li') {
            lines.push('- ' + n.text);
        } else {
            lines.push(n.text, '');
        }
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const parts = [
    '# Bhavya Dhoot - full site text',
    '',
    '> Complete readable text of https://bhavya-dhoot.vercel.app/, generated from',
    '> the built pages at deploy time so it cannot drift from what is published.',
    '> Figures produced by the live in-browser tools are not included here: those',
    '> are computed on the visitor\'s machine, not stored.',
    '',
    `Generated from build. Origin: ${ORIGIN}`,
    '',
];

let missing = 0;
for (const page of PAGES) {
    const full = join(DIST, page.file);
    if (!existsSync(full)) { missing += 1; continue; }
    const html = readFileSync(full, 'utf8');
    parts.push(`\n---\n\n## ${page.title} - ${ORIGIN}${page.path}\n`);
    parts.push(render(extract(html)));
}

if (missing) {
    console.error(`gen-llms-full: ${missing} page(s) missing from ${DIST}; not writing`);
    process.exit(1);
}

const outPath = join(DIST, 'llms-full.txt');
writeFileSync(outPath, parts.join('\n') + '\n', 'utf8');
console.log(`gen-llms-full: wrote ${outPath} (${parts.join('\n').length} chars)`);
