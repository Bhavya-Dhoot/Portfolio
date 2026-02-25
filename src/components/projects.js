/**
 * Project cards — Canvas mini-visualizations per project
 */

export function initProjects() {
    initProjectCanvas(1, drawTradingViz);
    initProjectCanvas(2, drawFintechViz);
    initProjectCanvas(3, drawSummitViz);
}

function initProjectCanvas(n, drawFn) {
    const canvas = document.getElementById(`proj-canvas-${n}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas to actual display size
    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
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

// ── Trading platform: candlestick-style chart ───────────────────
function drawTradingViz(ctx, w, h, t) {
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

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = 8 + (h - 16) * (i / 4);
        ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w - 8, y); ctx.stroke();
    }

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

// ── FinTech: ROC curve / metric bars ────────────────────────────
function drawFintechViz(ctx, w, h, t) {
    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const v = 8 + (i / 4) * (w - 16);
        ctx.beginPath(); ctx.moveTo(v, 8); ctx.lineTo(v, h - 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, v * (h / w)); ctx.lineTo(w - 8, v * (h / w)); ctx.stroke();
    }

    // Diagonal reference line
    ctx.beginPath();
    ctx.moveTo(8, h - 8); ctx.lineTo(w - 8, 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.75;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ROC curve (animated)
    ctx.beginPath();
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
        const fpr = i / steps;
        // Realistic ROC curve shape
        const tpr = Math.min(1, Math.pow(fpr, 0.25) + 0.05 * Math.sin(i * 0.4 + t));
        const x = 8 + fpr * (w - 16);
        const y = h - 8 - tpr * (h - 16);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const grad = ctx.createLinearGradient(8, h - 8, w - 8, 8);
    grad.addColorStop(0, 'rgba(96,165,250,0.9)');
    grad.addColorStop(1, 'rgba(244,114,182,0.9)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();

    // AUC label
    ctx.fillStyle = 'rgba(200,255,0,0.85)';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText('AUC: 0.94', w - 60, 20);
}

// ── Summit: event timeline / attendance bars ─────────────────────
function drawSummitViz(ctx, w, h, t) {
    const events = [
        { label: 'Reg', val: 0.72, color: '#c8ff00' },
        { label: 'Day 1', val: 0.88, color: '#60a5fa' },
        { label: 'Key', val: 1.00, color: '#f472b6' },
        { label: 'Work', val: 0.61, color: '#fb923c' },
        { label: 'Day 2', val: 0.79, color: '#60a5fa' },
        { label: 'Close', val: 0.95, color: '#c8ff00' },
    ];

    const barW = (w - 24) / events.length;
    const maxH = h - 32;

    events.forEach((ev, i) => {
        const animH = ev.val * maxH * Math.min(1, (Math.sin(t * 1.5 - i * 0.2) * 0.04 + 0.96) * 1);
        const x = 12 + i * barW + barW * 0.15;
        const bw = barW * 0.7;
        const y = h - 20 - animH;

        // Bar background
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, h - 20 - maxH, bw, maxH);

        // Filled bar
        const grad = ctx.createLinearGradient(0, y, 0, h - 20);
        grad.addColorStop(0, ev.color + 'cc');
        grad.addColorStop(1, ev.color + '22');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, bw, animH);

        // Label
        ctx.fillStyle = 'rgba(240,237,232,0.4)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ev.label, x + bw / 2, h - 6);
    });
}
