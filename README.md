# Bhavya Dhoot — Portfolio

> Quantitative Developer · Finance Researcher · AI Engineer

A world-class interactive portfolio built from scratch — no templates, no React. Inspired by the design language of [monopo.vn](https://monopo.vn): extreme minimalism, physics-based scroll, cursor-reactive SVG graphics, and a premium technical feel.

**Live →** [portfolio-bhavya-dhoot.vercel.app](https://portfolio-bhavya-dhoot.vercel.app)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Build | [Vite](https://vitejs.dev/) v5 |
| Styling | [TailwindCSS](https://tailwindcss.com/) v3 + custom CSS |
| Animations | [GSAP](https://gsap.com/) + ScrollTrigger |
| Smooth Scroll | [Lenis](https://lenis.darkroom.engineering/) |
| 3D Scene | [Three.js](https://threejs.org/) |
| Graphics | Programmatic SVG + Canvas 2D |
| Fonts | Inter + JetBrains Mono |

---

## Features

- **Hero** — GSAP name reveal (slide-up lines), cursor-reactive SVG grid that warps in real-time
- **Custom cursor** — Dual-ring with mix-blend-mode & magnetic hover on all interactive elements
- **Marquee ticker** — Scrolling skills bar between Hero and About
- **Scroll progress bar** — Lime glow bar tracking reading position
- **Availability badge** — Pulsing "Open to opportunities" pill
- **Experience** — Accent bar that animates in on scroll per entry
- **Projects** — Hover-triggered canvas animations (candlesticks, ROC curve, bar chart)
- **Skills** — Real-time floating node graph with mouse repulsion physics
- **Contact** — Three.js wireframe icosahedron with particle constellation, mouse parallax
- **Performance** — Code-split chunks, lazy-loaded 3D, GPU-only transforms

---

## Getting Started

```bash
# Install dependencies
npm install

# Dev server → http://localhost:5173
npm run dev

# Production build → dist/
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
├── index.html
├── vite.config.js
├── tailwind.config.js
├── vercel.json
└── src/
    ├── main.js              ← Entry point
    ├── styles.css           ← Global styles + design tokens
    ├── animations.js        ← GSAP ScrollTrigger animations
    ├── cursor.js            ← Custom cursor + magnetic effects
    ├── components/
    │   ├── nav.js           ← Floating nav + active section indicator
    │   ├── projects.js      ← Canvas mini-visualizations per project
    │   ├── skills.js        ← Floating node graph (Canvas 2D)
    │   └── contact-3d.js   ← Three.js wireframe scene
    └── svg/
        └── grid.js          ← Cursor-reactive SVG hero grid
```

---

## Design Tokens

| Token | Value |
|-------|-------|
| Background | `#0a0a0a` |
| Text | `#f0ede8` |
| Muted | `#6b6b6b` |
| Accent | `#c8ff00` (electric lime) |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` |

---

## Deploying to Vercel

This project is Vercel-ready out of the box.

1. Import the repo at [vercel.com/new](https://vercel.com/new)
2. Vercel auto-detects Vite — no config needed
3. Every `git push` triggers a new deployment automatically

---

## Contact

**Bhavya Dhoot**  
[dhoot.bhavya1@gmail.com](mailto:dhoot.bhavya1@gmail.com) · [LinkedIn](https://www.linkedin.com/in/bhavya-dhoot/) · [GitHub](https://github.com/Bhavya-Dhoot)
