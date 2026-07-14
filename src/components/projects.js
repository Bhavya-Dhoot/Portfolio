/**
 * Project cards — Canvas mini-visualizations per case study
 * 1: Kronos MVE (candlesticks) · 2: Momentum (equity curve)
 * 3: Options Pricer (IV smile) · 4: THF Ops Suite (pipeline bars)
 */

export function initProjects() {
    initProjectCanvas(1, drawMarketViz);
    initProjectCanvas(2, drawEquityViz);
    initProjectCanvas(3, drawSmileViz);
    initProjectCanvas(4, drawOpsViz);
}

function initProjectCanvas(n, drawFn) {
    const canvas = document.getElementById(`proj-canvas-${n}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas to actual display size.
    // offsetWidth/Height ignore the .proj-visual pre-reveal scale(0.95)
    // transform; getBoundingClientRect() would bake that 5% into the buffer.
    function resize() {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();

    let t = 0;
    let animFrame = null;
    let isVisible = false;

    const card = canvas.closest('.project-card');

    if (card) {
        card.addEventListener('mouseenter', () => {
            isVisible = true;
            if (!animFrame) animate();
        });
        card.addEventListener('mouseleave', () => {
            isVisible = false;
            cancelAnimationFrame(animFrame);
            animFrame = null;
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        });
    }

    function animate() {
        t += 0.025;
        const w = canvas.offsetWidth, h = canvas.offsetHeight;
        ctx.clearRect(0, 0, w, h);
        drawFn(ctx, w, h, t);
        if (isVisible) animFrame = requestAnimationFrame(animate);
    }
}

function drawGrid(ctx, w, h) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = 8 + (h - 16) * (i / 4);
        ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w - 8, y); ctx.stroke();
    }
}

// ── 1. Kronos MVE: candlestick chart ────────────────────────────
function drawMarketViz(ctx, w, h, t) {
    const bars = 24;
    const barW = (w - 16) / bars;
    const data = [];

    // Generate pseudo-random price series using sin waves
    let price = 0.5;
    for (let i = 0; i < bars; i++) {
        price += (Math.sin(i * 0.7 + t) * 0.08 + Math.sin(i * 1.3) * 0.04);
        price = Math.max(0.1, Math.min(0.9, price));
        const open = price;
        const close = price + (Math.sin(i * 2.1 + t) * 0.07);
        const high = Math.max(open, close) + Math.abs(Math.sin(i + t)) * 0.06;
        const low = Math.min(open, close) - Math.abs(Math.cos(i + t)) * 0.06;
        data.push({ open, close: Math.max(0.05, Math.min(0.95, close)), high, low });
    }

    drawGrid(ctx, w, h);

    // Draw candles
    data.forEach((d, i) => {
        const x = 8 + i * barW + barW * 0.5;
        const yO = h - 8 - d.open * (h - 16);
        const yC = h - 8 - d.close * (h - 16);
        const yH = h - 8 - d.high * (h - 16);
        const yL = h - 8 - d.low * (h - 16);
        const bull = d.close >= d.open;
        const col = bull ? '#c8ff00' : '#ef4444';

        // Wick
        ctx.beginPath();
        ctx.moveTo(x, yH); ctx.lineTo(x, yL);
        ctx.strokeStyle = col + '80';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Body
        const bodyH = Math.max(1, Math.abs(yC - yO));
        ctx.fillStyle = bull ? 'rgba(200,255,0,0.7)' : 'rgba(239,68,68,0.7)';
        ctx.fillRect(x - barW * 0.35, Math.min(yO, yC), barW * 0.7, bodyH);
    });
}

// ── 2. Momentum: equity curve with drawdown dip ─────────────────
function drawEquityViz(ctx, w, h, t) {
    drawGrid(ctx, w, h);

    const steps = 48;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        let v = p * 0.72 + Math.sin(p * 9 + t) * 0.025 + Math.sin(p * 23) * 0.02 + 0.08;
        // Single drawdown episode mid-curve
        if (p > 0.55 && p < 0.68) v -= 0.07 * Math.sin(((p - 0.55) / 0.13) * Math.PI);
        const x = 8 + p * (w - 16);
        const y = h - 10 - v * (h - 24);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#c8ff00';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(200,255,0,0.85)';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SHARPE 1.44', 12, 20);
}

// ── 3. Options Pricer: IV smile ─────────────────────────────────
function drawSmileViz(ctx, w, h, t) {
    // Vertical strike grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const x = 8 + (i / 4) * (w - 16);
        ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, h - 8); ctx.stroke();
    }

    // ATM marker (dashed vertical)
    const atmX = 8 + 0.55 * (w - 16);
    ctx.beginPath();
    ctx.moveTo(atmX, 8); ctx.lineTo(atmX, h - 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Smile curve (skewed parabola in strike space)
    ctx.beginPath();
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const iv = 0.28 + 1.5 * Math.pow(p - 0.55, 2) + 0.02 * Math.sin(t + p * 6);
        const x = 8 + p * (w - 16);
        const y = h - 10 - iv * (h - 24);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#c8ff00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(200,255,0,0.85)';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('IV / STRIKE', 12, 20);
}

// ── 4. THF Ops Suite: per-system pipeline bars ──────────────────
function drawOpsViz(ctx, w, h, t) {
    const systems = [
        { label: 'S1', val: 0.92, color: '#c8ff00' },
        { label: 'S2', val: 0.74, color: '#c8ff00' },
        { label: 'S3', val: 0.85, color: '#c8ff00' },
        { label: 'S4', val: 0.66, color: '#c8ff00' },
        { label: 'S5', val: 0.98, color: '#c8ff00' },
        { label: 'S6', val: 0.58, color: '#c8ff00' },
    ];

    const barW = (w - 24) / systems.length;
    const maxH = h - 32;

    systems.forEach((s, i) => {
        const animH = s.val * maxH * (Math.sin(t * 1.5 - i * 0.2) * 0.04 + 0.96);
        const x = 12 + i * barW + barW * 0.15;
        const bw = barW * 0.7;
        const y = h - 20 - animH;

        // Bar background
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, h - 20 - maxH, bw, maxH);

        // Filled bar
        const grad = ctx.createLinearGradient(0, y, 0, h - 20);
        grad.addColorStop(0, s.color + 'cc');
        grad.addColorStop(1, s.color + '22');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, bw, animH);

        // Label
        ctx.fillStyle = 'rgba(240,237,232,0.4)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(s.label, x + bw / 2, h - 6);
    });
}
