/**
 * Floating navigation — blur-on-scroll and active-page state from the pathname.
 */

export function initNav() {
    const nav = document.getElementById('nav');
    const links = document.querySelectorAll('.nav-link');

    if (!nav) return;

    // Scrolled state
    const scrollHandler = () => {
        // Hysteresis (enter 24 / exit 8) so elastic-scroll jitter near the top
        // can't restart the 0.4s blur transition every frame
        const y = window.scrollY;
        const scrolled = nav.classList.contains('scrolled');
        if (!scrolled && y > 24) {
            nav.classList.add('scrolled');
        } else if (scrolled && y < 8) {
            nav.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Active page comes from the pathname; markup already sets it, this keeps
    // client-side navigations honest.
    const path = location.pathname.replace(/\/+$/, '') || '/';
    const pageKey = path === '/' ? 'home' : path.slice(1);
    links.forEach(l => l.classList.toggle('active', l.dataset.page === pageKey));

    // Cross-page links navigate normally; in-page anchors are handled once,
    // centrally, in core.js. No click interception here.

    return () => {
        window.removeEventListener('scroll', scrollHandler);
    };
}
