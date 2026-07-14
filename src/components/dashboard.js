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

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
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
}
