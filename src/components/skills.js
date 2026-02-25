/**
 * Skills — Canvas-based floating node graph
 * Nodes grouped by category, connected by lines, drift in looping physics
 */

export function initSkills() {
    const canvas = document.getElementById('skills-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animFrame = null;
    let mouse = { x: -999, y: -999 };

    const CATEGORIES = [
        { name: 'Technical', color: '#c8ff00', skills: ['Python', 'TypeScript', 'SQL', 'Docker', 'Git', 'NumPy'] },
        { name: 'Analytics', color: '#60a5fa', skills: ['Quant Research', 'Backtesting', 'Statistics', 'Modeling'] },
        { name: 'AI / ML', color: '#f472b6', skills: ['XGBoost', 'Time-Series', 'NLP', 'LLMs', 'Scikit-learn'] },
        { name: 'Mgmt', color: '#fb923c', skills: ['Leadership', 'Strategy', 'Operations', 'Community'] },
    ];

    const CONNECT_DIST = 120;
    let nodes = [];

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        buildNodes();
    }

    function buildNodes() {
        nodes = [];
        const w = canvas.width, h = canvas.height;

        CATEGORIES.forEach((cat, ci) => {
            // Each category orbits a center anchor
            const anchorX = (ci % 2 === 0 ? 0.28 : 0.72) * w;
            const anchorY = (ci < 2 ? 0.3 : 0.7) * h;

            cat.skills.forEach((skill, si) => {
                const angle = (si / cat.skills.length) * Math.PI * 2 + ci * 0.5;
                const radius = 55 + si * 8;
                nodes.push({
                    label: skill,
                    color: cat.color,
                    ax: anchorX + Math.cos(angle) * radius,
                    ay: anchorY + Math.sin(angle) * radius,
                    x: anchorX + Math.cos(angle) * radius,
                    y: anchorY + Math.sin(angle) * radius,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    phase: Math.random() * Math.PI * 2,
                    r: 26 + skill.length * 1.2,
                    catIdx: ci,
                });
            });
        });
    }

    function draw(ts) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const t = ts * 0.001;

        // Update node positions — gentle drift around anchor
        nodes.forEach(n => {
            const driftX = Math.cos(t * 0.4 + n.phase) * 10;
            const driftY = Math.sin(t * 0.55 + n.phase * 1.3) * 8;
            n.x = n.ax + driftX;
            n.y = n.ay + driftY;

            // Mouse repulsion
            const dx = n.x - mouse.x;
            const dy = n.y - mouse.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 80) {
                const f = (80 - d) / 80;
                n.x += (dx / d) * f * 20;
                n.y += (dy / d) * f * 20;
            }
        });

        // Draw connection lines
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                // Only connect same category
                if (a.catIdx !== b.catIdx) continue;
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < CONNECT_DIST) {
                    const opacity = (1 - d / CONNECT_DIST) * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = a.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace(/^rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/, (m, r, g, b) =>
                        `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}`);
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        nodes.forEach(n => {
            // Hit test mouse
            const dx = n.x - mouse.x, dy = n.y - mouse.y;
            const hover = Math.sqrt(dx * dx + dy * dy) < n.r + 8;

            // Background pill
            const pad = { x: n.r, y: 14 };
            ctx.save();
            ctx.beginPath();
            roundRect(ctx, n.x - pad.x, n.y - pad.y / 2, pad.x * 2, pad.y, 6);
            ctx.fillStyle = hover
                ? hexToRgba(n.color, 0.18)
                : 'rgba(20, 20, 20, 0.85)';
            ctx.fill();
            ctx.strokeStyle = hover ? hexToRgba(n.color, 0.7) : hexToRgba(n.color, 0.3);
            ctx.lineWidth = hover ? 1.2 : 0.6;
            ctx.stroke();
            ctx.restore();

            // Label
            ctx.save();
            ctx.font = `${hover ? '500' : '300'} 10px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = hover ? n.color : 'rgba(240, 237, 232, 0.75)';
            ctx.fillText(n.label, n.x, n.y);
            ctx.restore();
        });

        animFrame = requestAnimationFrame(draw);
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // Mouse tracking relative to canvas
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }, { passive: true });

    canvas.addEventListener('mouseleave', () => {
        mouse.x = -999; mouse.y = -999;
    });

    // Start
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement);
    animFrame = requestAnimationFrame(draw);

    return () => {
        cancelAnimationFrame(animFrame);
        resizeObserver.disconnect();
    };
}
