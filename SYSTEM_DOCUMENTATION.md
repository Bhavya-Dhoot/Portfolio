# SYSTEM_DOCUMENTATION

[ROLE: ARCHITECT]

## 1. System Architecture Overview
The Bhavya Dhoot Portfolio is a high-performance, statically generated Single Page Application (SPA) designed to showcase professional achievements with elite, physics-based interactions. The architecture eschews heavy UI frameworks (like React or Vue) in favor of Vanilla JavaScript orchestrated by Vite. This constraint ensures absolute control over the DOM, minimal bundle sizes, and uncompromised rendering performance (targeting 60+ FPS on all devices).

## 2. Technology Stack Definition
- **Build System**: Vite v5 + esbuild (for lightning-fast HMR and optimized production bundling)
- **Styling**: Tailwind CSS v3 (Utility-first, with a highly customized `tailwind.config.js` acting as the design token source of truth)
- **Animation Engine**: GSAP (GreenSock Animation Platform) + ScrollTrigger (for complex timeline orchestration and scroll-linked reveals)
- **Scroll Physics**: Lenis (for smooth, inertia-based kinetic scrolling that synchronizes perfectly with GSAP)
- **3D Rendering**: Three.js (for WebGL-accelerated 3D scenes)
- **2D Rendering**: HTML5 Canvas API & SVG (for programmatic, performant data visualizations and reactive backgrounds)

## 3. Core Principles
- **Separation of Concerns**: HTML handles semantics, Tailwind layers handle layout/aesthetics, and distinct ES modules handle specific interaction domains.
- **Zero Trust Security Model**: Statically generated. No backend server execution. No user input vectors other than standard `mailto:` links and pure external hrefs.
- **Progressive Enhancement**: Runs core animations where hardware permits, deeply respects `prefers-reduced-motion` for accessibility.
- **Lazy Initialization**: Resource-heavy modules (like 3D WebGL contexts) are completely deferred until brought into the viewport via `IntersectionObserver`.

## 4. Directory & Module Structure

```text
Portfolio_SPline/
├── index.html                   # Master entry point, strict semantic HTML5
├── package.json                 # Dependency definitions
├── vite.config.js               # Vite build configuration, chunk splitting logic
├── tailwind.config.js           # Design system tokens (colors, fonts, keyframes)
├── vercel.json                  # Vercel deployment routing instructions
└── src/
    ├── main.js                  # Bootstrapper & Interaction Orchestrator
    ├── styles.css               # Global CSS, Tailwind layers, complex custom properties
    ├── animations.js            # Centralized GSAP ScrollTrigger definitions
    ├── cursor.js                # Custom dual-ring cursor logic and magnetic physics
    ├── components/
    │   ├── contact-3d.js        # Three.js Icosahedron WebGL context manager
    │   ├── nav.js               # Navigation states, intersection tracking
    │   ├── projects.js          # Project-specific Canvas 2D render loops
    │   └── skills.js            # Force-directed node graph logic for skills
    └── svg/
        └── grid.js              # Programmatic, cursor-reactive SVG background
```

## 5. Subsystem Deep Dives

### 5.1 Main Orchestrator (`src/main.js`)
Acts as the central nervous system of the application. 
- Instantiates Lenis smooth scroll and binds it to the browser's `requestAnimationFrame` loop.
- Bootstraps all other modules sequentially to ensure DOM readiness.
- Connects `gsap.ticker` to `lenis.raf` to ensure ScrollTrigger calculations are perfectly synced with interpolated scroll positions, preventing visual stutter.
- Initializes global `IntersectionObserver` instances for generic section-level states (e.g., triggering CSS-only line draws and progress bars).
- Listens to `visibilitychange` to aggressively pause/resume Lenis rendering, saving client battery and CPU cycles when the tab is hidden.

### 5.2 Physics Scroll Engine (Lenis & GSAP Integration)
Lenis hijacks native scroll wheel processing to provide an inertia-based feel. GSAP's `ScrollTrigger` is strictly tied to Lenis' scroll events using `ScrollTrigger.update`.
- **Interpolation Formula**: Tuned for a 1.25s duration using custom easing `t => Math.min(1, 1.001 - Math.pow(2, -10 * t))` to mimic a heavy, premium mechanical friction model.

### 5.3 Custom Interaction Layer (`src/cursor.js`)
Overrides the native cursor with a hardware-accelerated two-part DOM implementation.
- **Dot**: Tied to literal `clientX`/`clientY` mapping for instantaneous targeting.
- **Ring**: Trails the dot with computationally efficient calculated lag easing using linear interpolation (LERP): `current += (target - current) * friction`.
- **Magnetic Effect**: When hovering over `.magnetic` trigger elements, JS calculates the cursor's relative distance to the element's mathematical center and computes a transformation matrix `translate(x, y)` to linearly pull the element towards the pointer.

### 5.4 3D WebGL Subsystem (`src/components/contact-3d.js`)
A sophisticated, lightweight WebGL scene deployed in the Contact section.
- **Just-In-Time Booting**: Uses `IntersectionObserver` to completely block instantiation until the user scrolls within 15% range of the footer.
- **Scene Graph Composition**: Comprised of an inner opaque Icosahedron, an outer wireframe Icosahedron, two counter-rotating boundary Torus rings, and a 280-point BufferGeometry dynamic starfield.
- **Input Tracking**: Hooks into the container's local `mousemove` matrix boundary to adjust the camera/object rotation target (`targetRot`). The internal render loop interpolates towards this over time for buttery smooth mouse-parallax.

### 5.5 Canvas Renderers (`src/components/skills.js`, `src/components/projects.js`)
Deliberately avoids expensive DOM manipulation for micro-visualizations by dropping down directly to the native 2D Canvas API.
- **Skills System**: Implements a standalone custom 2D physics loop. Nodes contain base coordinate matrices, velocity vectors, and bounds detection code. A mouse repulsion force (`dx/dy`, Euclidean distance, inverse square falloff) applies vector velocities pushing nodes away, which then automatically dampen and drift back to origin via string tension math.
- **Project Overlays**: Each project card encapsulates a localized canvas (candlesticks, ROC curves, bar charts). These specific render loops are strictly conditional—active only on `mouseenter` events and immediately halted on `mouseleave`, preventing CPU burn.

## 6. Performance & Production Hardening
- **Dynamic Chunk Splitting**: `vite.config.js` restricts vendor sprawl through manual chunk distribution, isolating `lenis` and `gsap` from business logic to optimize CDN caching layers.
- **Minification Engines**: In Vite build pipelines, standard Terser is bypassed for the inherently faster `esbuild` native compiler. 
- **DOM Transformation Integrity**: All animations strictly utilize CSS `transform` overrides (`translate3d()`, `scale`) or `opacity` mutations. `top`/`left`/`width`/`height` modifications are strictly prohibited inside requestAnimationFrame loops to prevent CPU Layout/Paint recalculation bottlenecking.
- **Accessibility Fallbacks**: A `prefers-reduced-motion` media query match directly overwrites `--ease-expo` custom properties to `linear` and bypasses all structural JS GSAP initialization states. All content defaults immediately to `opacity: 1` and `transform: none`.

## 7. Configuration & Deployment Pipeline
The application conforms out-of-the-box to heavily optimized static deployment platforms like Vercel and Netlify.
- Entirely automated continuous integration via standard Git `push` hooks.
- `vercel.json` provides required NGINX-style rewrite instructions dictating that SPA fallback routing safely points missing files explicitly back to `index.html`. 
- No environment secrets (`.env`) are required for the base application.
