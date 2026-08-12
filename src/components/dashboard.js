/**
 * dashboard.js — Canvas-free KPI dashboard
 * Animated counters only; every value is a real metric from a shipped system.
 * Formats via data attributes: data-target, data-prefix, data-suffix, data-decimals.
 */

export function initDashboard() {
  initKPICounters();
}

/* ── KPI Counter Animation ─────────────────────────────────────── */
function initKPICounters() {
  const cards = document.querySelectorAll('.kpi-card');
  if (!cards.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const format = (el, value) => {
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    return `${el.dataset.prefix || ''}${value.toFixed(decimals)}${el.dataset.suffix || ''}`;
  };

  // The markup ships the real figures, so crawlers and no-JS visitors read the
  // actual numbers rather than a wall of zeros. Zeroing therefore has to happen
  // here — and only while the card is still below the fold, or the reader
  // watches the value jump backwards before counting up.
  const zeroed = new WeakSet();
  cards.forEach((card) => {
    const el = card.querySelector('.kpi-value');
    if (!el || reduced) return;
    if (card.getBoundingClientRect().top <= window.innerHeight) return;
    el.textContent = format(el, 0);
    zeroed.add(el);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target.querySelector('.kpi-value');
        if (!el || el.dataset.animated) return;
        el.dataset.animated = '1';

        const target = parseFloat(el.dataset.target);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0', 10);

        // Already showing the real value: nothing to count up from.
        if (reduced || !zeroed.has(el)) {
          el.textContent = format(el, target);
          return;
        }

        const duration = 1400;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = `${prefix}${(eased * target).toFixed(decimals)}${suffix}`;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.3 }
  );

  cards.forEach((c) => observer.observe(c));

  // Safety net. Zeroing above means the real figures now depend on the observer
  // firing; if it is throttled or never delivers, the visitor is left staring at
  // a grid of zeros — strictly worse than not animating at all. Once a second,
  // finalise any card that is on screen but has not been animated, then stop.
  const settle = setInterval(() => {
    let pending = 0;
    cards.forEach((card) => {
      const el = card.querySelector('.kpi-value');
      if (!el || el.dataset.animated) return;
      const r = card.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        el.dataset.animated = '1';
        el.textContent = format(el, parseFloat(el.dataset.target));
      } else {
        pending += 1;
      }
    });
    if (!pending) clearInterval(settle);
  }, 1000);
}
