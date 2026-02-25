/**
 * SVG Background Grid — cursor reactive
 * Programmatically generates an SVG grid that distorts toward the cursor
 */

export function initGrid() {
    const container = document.getElementById('hero-grid');
    if (!container) return;

    const cols = 20;
    const rows = 12;

    let mouse = { x: 0.5, y: 0.5 };
    let smoothMouse = { x: 0.5, y: 0.5 };
    let scrollVelocity = 0;
    let lastScrollY = 0;
    let animFrame = null;

    // Create SVG
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 60');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.style.cssText = 'width:100%;height:100%;position:absolute;inset:0;';
    container.appendChild(svg);

    // Defs — subtle glow filter
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = `
    <filter id="glow">
      <feGaussianBlur stdDeviation="0.3" result="blur" />
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
    svg.appendChild(defs);

    // Build grid points
    const points = [];
    for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
            points.push({
                baseX: (c / cols) * 100,
                baseY: (r / rows) * 60,
                x: (c / cols) * 100,
                y: (r / rows) * 60,
            });
        }
    }

    // Build horizontal lines
    const hLines = [];
    for (let r = 0; r <= rows; r++) {
        const line = document.createElementNS(ns, 'polyline');
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', 'rgba(255,255,255,0.04)');
        line.setAttribute('stroke-width', '0.12');
        svg.appendChild(line);
        hLines.push(line);
    }

    // Build vertical lines
    const vLines = [];
    for (let c = 0; c <= cols; c++) {
        const line = document.createElementNS(ns, 'polyline');
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', 'rgba(255,255,255,0.04)');
        line.setAttribute('stroke-width', '0.12');
        svg.appendChild(line);
        vLines.push(line);
    }

    // Accent dot at cursor intersection
    const accentDot = document.createElementNS(ns, 'circle');
    accentDot.setAttribute('r', '0.6');
    accentDot.setAttribute('fill', 'rgba(200,255,0,0.5)');
    accentDot.setAttribute('filter', 'url(#glow)');
    svg.appendChild(accentDot);

    // Update grid point positions based on cursor
    function updatePoints() {
        const mx = smoothMouse.x * 100;  // 0-100 in SVG coords
        const my = smoothMouse.y * 60;
        const radius = 30;
        const strength = 4 + scrollVelocity * 8;

        for (const p of points) {
            const dx = p.baseX - mx;
            const dy = p.baseY - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const influence = Math.max(0, 1 - dist / radius);
            const ease = influence * influence;

            // Repel from cursor
            if (dist > 0.01) {
                p.x = p.baseX + (dx / dist) * ease * strength * -1;
                p.y = p.baseY + (dy / dist) * ease * strength * -1;
            } else {
                p.x = p.baseX;
                p.y = p.baseY;
            }
        }

        // Move accent dot to cursor
        accentDot.setAttribute('cx', mx.toFixed(2));
        accentDot.setAttribute('cy', my.toFixed(2));
    }

    function buildPolyline(pts) {
        return pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    }

    function render() {
        // Smooth mouse following
        smoothMouse.x += (mouse.x - smoothMouse.x) * 0.06;
        smoothMouse.y += (mouse.y - smoothMouse.y) * 0.06;
        scrollVelocity *= 0.92;

        updatePoints();

        // Update horizontal lines
        for (let r = 0; r <= rows; r++) {
            const rowPts = [];
            for (let c = 0; c <= cols; c++) {
                rowPts.push(points[r * (cols + 1) + c]);
            }
            hLines[r].setAttribute('points', buildPolyline(rowPts));
        }

        // Update vertical lines
        for (let c = 0; c <= cols; c++) {
            const colPts = [];
            for (let r = 0; r <= rows; r++) {
                colPts.push(points[r * (cols + 1) + c]);
            }
            vLines[c].setAttribute('points', buildPolyline(colPts));
        }

        animFrame = requestAnimationFrame(render);
    }

    // Mouse tracking
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX / window.innerWidth;
        mouse.y = e.clientY / window.innerHeight;
    }, { passive: true });

    // Scroll velocity tracking
    window.addEventListener('scroll', () => {
        const sy = window.scrollY;
        scrollVelocity = Math.min(Math.abs(sy - lastScrollY) / 80, 1);
        lastScrollY = sy;
    }, { passive: true });

    render();

    return () => {
        cancelAnimationFrame(animFrame);
    };
}

/**
 * About section – animated geometric SVG visual
 */
export function initAboutSVG() {
    const wrap = document.getElementById('about-svg-wrap');
    if (!wrap) return;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'overflow:visible;';
    wrap.appendChild(svg);

    const cx = 200, cy = 200;

    // Concentric rings
    const rings = [150, 110, 75, 45, 20];
    rings.forEach((r, i) => {
        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', i === 0 ? 'rgba(200,255,0,0.15)' : 'rgba(255,255,255,0.05)');
        circle.setAttribute('stroke-width', i === 0 ? '1' : '0.5');
        circle.setAttribute('stroke-dasharray', i % 2 === 0 ? '4 8' : 'none');
        svg.appendChild(circle);
    });

    // Rotating outer ring with tick marks
    const outerG = document.createElementNS(ns, 'g');
    svg.appendChild(outerG);

    for (let i = 0; i < 36; i++) {
        const angle = (i / 36) * Math.PI * 2;
        const r1 = 155, r2 = i % 3 === 0 ? 167 : 161;
        const x1 = cx + Math.cos(angle) * r1;
        const y1 = cy + Math.sin(angle) * r1;
        const x2 = cx + Math.cos(angle) * r2;
        const y2 = cy + Math.sin(angle) * r2;
        const tick = document.createElementNS(ns, 'line');
        tick.setAttribute('x1', x1); tick.setAttribute('y1', y1);
        tick.setAttribute('x2', x2); tick.setAttribute('y2', y2);
        tick.setAttribute('stroke', i % 3 === 0 ? 'rgba(200,255,0,0.4)' : 'rgba(255,255,255,0.08)');
        tick.setAttribute('stroke-width', i % 3 === 0 ? '1.5' : '0.5');
        outerG.appendChild(tick);
    }

    // Cross hairs
    ['M 200 30 L 200 370', 'M 30 200 L 370 200'].forEach(d => {
        const line = document.createElementNS(ns, 'path');
        line.setAttribute('d', d);
        line.setAttribute('stroke', 'rgba(255,255,255,0.04)');
        line.setAttribute('stroke-width', '0.5');
        svg.appendChild(line);
    });

    // Center accent dot
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', 'rgba(200,255,0,0.7)');
    svg.appendChild(dot);

    // Animated inner dot
    let t = 0;
    function animateSVG() {
        t += 0.008;
        outerG.setAttribute('transform', `rotate(${t * 10}, ${cx}, ${cy})`);
        requestAnimationFrame(animateSVG);
    }
    animateSVG();
}
