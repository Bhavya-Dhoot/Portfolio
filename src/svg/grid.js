/**
 * SVG Background Grid — cursor reactive
 * Programmatically generates an SVG grid that distorts toward the cursor
 */

export function initGrid() {
    const container = document.getElementById('hero-grid');
    if (!container) return;

    const cols = 20;
    const rows = 12;

    // Mouse tracked in SVG viewBox units (100x60), mapped via getScreenCTM so
    // the accent dot lands exactly under the cursor regardless of how
    // preserveAspectRatio="slice" crops the grid at any viewport ratio.
    let mouse = { x: 50, y: 30 };
    let smoothMouse = { x: 50, y: 30 };
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
        const mx = smoothMouse.x;  // already in SVG coords
        const my = smoothMouse.y;
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
        smoothMouse.x += (mouse.x - smoothMouse.x) * 0.14;
        smoothMouse.y += (mouse.y - smoothMouse.y) * 0.14;
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

    // Mouse tracking — client px to SVG viewBox units, crop-aware
    window.addEventListener('mousemove', (e) => {
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
        mouse.x = p.x;
        mouse.y = p.y;
    }, { passive: true });

    // Scroll velocity tracking
    window.addEventListener('scroll', () => {
        const sy = window.scrollY;
        scrollVelocity = Math.min(Math.abs(sy - lastScrollY) / 80, 1);
        lastScrollY = sy;
    }, { passive: true });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
        // Single static frame: undistorted grid, dot at center
        updatePoints();
        for (let r = 0; r <= rows; r++) {
            hLines[r].setAttribute('points', buildPolyline(points.filter((_, i) => Math.floor(i / (cols + 1)) === r)));
        }
        for (let c = 0; c <= cols; c++) {
            vLines[c].setAttribute('points', buildPolyline(points.filter((_, i) => i % (cols + 1) === c)));
        }
    } else {
        render();
    }

    return () => {
        cancelAnimationFrame(animFrame);
    };
}
