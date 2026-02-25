/**
 * Custom cursor + magnetic hover effects
 */

export function initCursor() {
    const cursor = document.getElementById('cursor');
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    if (!cursor || !dot || !ring) return;

    // Touch device: disable cursor
    if ('ontouchstart' in window) {
        cursor.style.display = 'none';
        return;
    }

    let dotX = 0, dotY = 0;
    let ringX = 0, ringY = 0;
    let mouseX = 0, mouseY = 0;
    let animFrame = null;

    cursor.style.opacity = '0';

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });

    function render() {
        // Dot follows mouse precisely
        dotX += (mouseX - dotX) * 0.85;
        dotY += (mouseY - dotY) * 0.85;
        dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

        // Ring follows with slight lag
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

        animFrame = requestAnimationFrame(render);
    }
    render();

    // Magnetic hover
    const magneticEls = document.querySelectorAll('.magnetic');
    magneticEls.forEach(el => {
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-hover');
        });

        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
            // Reset magnetic translate
            el.style.transform = '';
        });

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const relX = e.clientX - rect.left - rect.width / 2;
            const relY = e.clientY - rect.top - rect.height / 2;
            const strength = 0.35;
            el.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
            el.style.transition = 'transform 0.15s ease';
        });
    });

    // Interactive elements hover state
    document.querySelectorAll('a, button, [tabindex], .project-card').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    return () => cancelAnimationFrame(animFrame);
}
