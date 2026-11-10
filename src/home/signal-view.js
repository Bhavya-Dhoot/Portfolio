/**
 * home/signal-view.js - five sample inputs fused into one call.
 * Readings are bundled with the page (the page says so); the z-scores, composite and
 * regime are computed here, on the visitor's machine.
 */

import { drawOn, pop, reveal } from '../motion/core.js';
import { doodle } from '../doodle/paths.js';
import { ink } from '../doodle/draw.js';
import { LAYERS, fuse } from '../tools/signal.js';

const fmt = (n, dp = 2) => n.toFixed(dp);

export function initSignal() {
    const list = document.getElementById('sig-cells');
    const chip = document.getElementById('sig-chip');
    const arrows = document.getElementById('sig-arrows');
    if (!list || !chip) return;

    const { scored, composite, regime } = fuse(LAYERS);
    const d = doodle(107);
    const bars = [];

    scored.forEach((l, i) => {
        const li = document.createElement('li');
        li.className = 'sig-cell';
        const reading = `${l.value.toLocaleString('en-US')}${l.unit}`;
        li.innerHTML = '<span class="sig-name"></span><span class="sig-read"></span>'
            + '<svg class="ink-svg sig-bar" viewBox="0 0 120 24" aria-hidden="true" focusable="false"></svg>'
            + '<span class="sig-z"></span>';
        li.querySelector('.sig-name').textContent = l.label;
        li.querySelector('.sig-read').textContent = reading;
        li.querySelector('.sig-z').textContent = `z ${l.z >= 0 ? '+' : ''}${fmt(l.z)}`;
        const svg = li.querySelector('svg');
        // A drawn centre tick and a bar whose length is exactly z * 60
        bars.push(...ink(svg, [
            { d: d.line(60, 3, 60, 21, 1), w: 3 },
            { d: d.line(60, 12, 60 + l.z * 60, 12, 2), w: 6 },
        ]));
        list.appendChild(li);
    });

    const sign = composite >= 0 ? '+' : '';
    chip.innerHTML = 'Composite <b></b>&nbsp;&nbsp;Regime <b></b>';
    const [bc, br] = chip.querySelectorAll('b');
    bc.textContent = `${sign}${fmt(composite)}`;
    br.textContent = regime;

    // Five arrows converge from the cells into the chip (the SVG is hidden on narrow screens)
    let arrowPaths = [];
    if (arrows) {
        arrows.setAttribute('viewBox', '0 0 1000 80');
        arrowPaths = ink(arrows, scored.map((_, i) => ({
            d: d.arrow(100 + i * 200, 4, 500 + (i - 2) * 30, 74, (i - 2) * 6, 14), w: 4,
        })));
    }

    // Motion: header rises in; bars and arrows draw on once; the chip springs in
    reveal(document.querySelectorAll('#signal .sec-head > *'), { start: 'top 85%' });
    reveal(list.querySelectorAll('.sig-cell'), { start: 'top 85%', stagger: .06 });
    drawOn(bars, { stagger: .06, dur: .4, start: 'top 80%', trigger: list });
    if (arrowPaths.length) drawOn(arrowPaths, { stagger: .06, dur: .4, delay: .3, start: 'top 75%', trigger: arrows });
    pop(chip, { origin: 'center center', start: 'top 90%', delay: .2 });
}
