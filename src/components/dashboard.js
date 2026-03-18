/**
 * dashboard.js — Canvas-rendered KPI dashboard
 * Financial-style line chart + bar chart with scroll-triggered animation
 */

export function initDashboard() {
  initKPICounters();
  initLineChart();
  initBarChart();
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
        const isPercent = el.textContent.includes('%');
        const isMs = el.textContent.includes('ms');
        const isDecimal = String(target).includes('.');
        const duration = 1400;
        const start = performance.now();

        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = eased * target;

          if (isMs) {
            el.textContent = `−${Math.round(current)}ms`;
          } else if (isDecimal) {
            el.textContent = `${current.toFixed(1)}%`;
          } else {
            el.textContent = `${Math.round(current)}%`;
          }

          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.3 }
  );

  cards.forEach((c) => observer.observe(c));
}

/* ── Line Chart ────────────────────────────────────────────────── */
function initLineChart() {
  const canvas = document.getElementById('chart-line');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  // Simulated performance data (12 periods)
  const data = [4.2, 6.8, 5.1, 9.3, 8.7, 12.1, 11.4, 14.6, 13.2, 16.8, 15.9, 18.4];
  const maxVal = Math.max(...data) * 1.15;
  const padX = 45, padY = 25, padB = 30;

  let drawn = false;

  function draw(animProgress) {
    ctx.clearRect(0, 0, W, H);

    const chartW = W - padX - 15;
    const chartH = H - padY - padB;

    // Grid lines
    ctx.strokeStyle = 'rgba(107, 107, 107, 0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padY + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + chartW, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#6b6b6b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = ((maxVal / 4) * (4 - i)).toFixed(0);
      const y = padY + (chartH / 4) * i;
      ctx.fillText(`${val}%`, padX - 8, y + 3);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    const pointCount = Math.ceil(data.length * animProgress);
    for (let i = 0; i < data.length; i++) {
      const x = padX + (chartW / (data.length - 1)) * i;
      ctx.fillStyle = i < pointCount ? '#6b6b6b' : 'rgba(107,107,107,0.3)';
      ctx.fillText(`P${i + 1}`, x, H - 8);
    }

    if (pointCount < 2) return;

    // Area fill
    const gradient = ctx.createLinearGradient(0, padY, 0, padY + chartH);
    gradient.addColorStop(0, 'rgba(200, 255, 0, 0.08)');
    gradient.addColorStop(1, 'rgba(200, 255, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(padX, padY + chartH);
    for (let i = 0; i < pointCount; i++) {
      const x = padX + (chartW / (data.length - 1)) * i;
      const y = padY + chartH - (data[i] / maxVal) * chartH;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    }
    const lastX = padX + (chartW / (data.length - 1)) * (pointCount - 1);
    ctx.lineTo(lastX, padY + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#c8ff00';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    for (let i = 0; i < pointCount; i++) {
      const x = padX + (chartW / (data.length - 1)) * i;
      const y = padY + chartH - (data[i] / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Data points
    for (let i = 0; i < pointCount; i++) {
      const x = padX + (chartW / (data.length - 1)) * i;
      const y = padY + chartH - (data[i] / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#c8ff00';
      ctx.fill();
    }
  }

  // Scroll-triggered progressive draw
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !drawn) {
        drawn = true;
        const duration = 1200;
        const start = performance.now();
        function animate(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          draw(eased);
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      }
    },
    { threshold: 0.25 }
  );
  observer.observe(canvas);
}

/* ── Bar Chart ─────────────────────────────────────────────────── */
function initBarChart() {
  const canvas = document.getElementById('chart-bar');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  const categories = ['Signal Processing', 'Risk Assessment', 'Execution', 'Reporting'];
  const before = [45, 52, 61, 38];
  const after = [77, 93, 88, 79];
  const maxVal = 100;
  const padX = 45, padY = 20, padB = 35;

  let drawn = false;

  function draw(animProgress) {
    ctx.clearRect(0, 0, W, H);

    const chartW = W - padX - 15;
    const chartH = H - padY - padB;
    const groupW = chartW / categories.length;
    const barW = groupW * 0.28;
    const gap = 4;

    // Grid lines
    ctx.strokeStyle = 'rgba(107, 107, 107, 0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padY + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + chartW, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#6b6b6b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = ((maxVal / 4) * (4 - i)).toFixed(0);
      const y = padY + (chartH / 4) * i;
      ctx.fillText(`${val}%`, padX - 8, y + 3);
    }

    // Bars
    for (let i = 0; i < categories.length; i++) {
      const groupX = padX + groupW * i + groupW * 0.2;

      // Before bar (muted)
      const bH = (before[i] / maxVal) * chartH * animProgress;
      ctx.fillStyle = 'rgba(107, 107, 107, 0.3)';
      ctx.fillRect(groupX, padY + chartH - bH, barW, bH);

      // After bar (accent)
      const aH = (after[i] / maxVal) * chartH * animProgress;
      ctx.fillStyle = 'rgba(200, 255, 0, 0.7)';
      ctx.fillRect(groupX + barW + gap, padY + chartH - aH, barW, aH);

      // Category label
      ctx.fillStyle = '#6b6b6b';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(categories[i], groupX + barW + gap / 2, H - 8);
    }

    // Legend
    ctx.fillStyle = 'rgba(107, 107, 107, 0.5)';
    ctx.fillRect(W - 120, 8, 10, 10);
    ctx.fillStyle = '#6b6b6b';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Before', W - 106, 17);

    ctx.fillStyle = 'rgba(200, 255, 0, 0.7)';
    ctx.fillRect(W - 60, 8, 10, 10);
    ctx.fillStyle = '#6b6b6b';
    ctx.fillText('After', W - 46, 17);
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !drawn) {
        drawn = true;
        const duration = 1000;
        const start = performance.now();
        function animate(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          draw(eased);
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      }
    },
    { threshold: 0.25 }
  );
  observer.observe(canvas);
}
