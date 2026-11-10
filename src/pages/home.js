/**
 * Home - hero sketch, proof board, ten tools, and four working tools that run in the browser.
 */

import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/home.css';

import { boot } from '../app.js';
import { doodle } from '../doodle/paths.js';
import { ink } from '../doodle/draw.js';
import { initHero } from '../home/hero.js';
import { initProof } from '../home/proof.js';
import { initTools, benchResult } from '../home/tools.js';
import { initReconcile } from '../home/reconcile-view.js';
import { initPricer } from '../home/pricer-view.js';
import { initSolver } from '../home/solver-view.js';
import { initSignal } from '../home/signal-view.js';
import { initSelected } from '../home/selected.js';

// Every .link carries an empty svg slot in the HTML (so the row never shifts); ink the drawn arrow into it
function drawLinkArrows() {
    const d = doodle(109);
    document.querySelectorAll('a.link > svg').forEach((svg) => {
        if (svg.querySelector('path')) return;
        ink(svg, [{ d: d.arrow(3, 13, 42, 13, 5, 12), w: 4 }], { drawn: true });
    });
}

boot();
drawLinkArrows();

// One benchmark run feeds the proof board and the solver cells
const bench = benchResult();

initHero();
initProof(bench);
initTools();
initReconcile();
initPricer();
initSolver(bench);
initSignal();
initSelected();
