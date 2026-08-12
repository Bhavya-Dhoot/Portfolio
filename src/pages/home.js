/**
 * Home — hero, proof metrics, the live pricer, contact.
 */

import { initCore, onFontsReady } from '../core.js';
import { initHeroAnimation } from '../animations.js';
import { initGrid } from '../svg/grid.js';
import { initDashboard } from '../components/dashboard.js';
import { initPayoff } from '../components/payoff.js';
import '../acts/pricing.js';   // registers the pricing act renderer
import '../acts/solver.js';    // registers the solver act renderer

initCore();
initGrid();
initDashboard();
initPayoff();
onFontsReady(initHeroAnimation);

const badge = document.getElementById('availability-badge');
if (badge) setTimeout(() => badge.classList.add('visible'), 1800);
