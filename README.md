# Bhavya Dhoot — Portfolio

> Quantitative Developer · AI Systems Engineer · Forward Deployed Engineer

A hand-built three-page site with no framework and no templates. The premise: instead of
describing what I build, the page **runs four working tools in your browser** as you scroll. Every
number they show is computed on your machine at read time — none of it is a stored figure.

**Live →** [bhavya-dhoot.vercel.app](https://bhavya-dhoot.vercel.app)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Build | [Vite](https://vitejs.dev/) 5, multi-page (three HTML entry points) |
| Styling | [TailwindCSS](https://tailwindcss.com/) 3 + custom CSS |
| Animation | [GSAP](https://gsap.com/) + ScrollTrigger |
| Smooth scroll | [Lenis](https://lenis.darkroom.engineering/) |
| Type splitting | [SplitType](https://github.com/lukePeavey/SplitType) (home page only) |
| Graphics | Canvas 2D + programmatic SVG |
| Fonts | Archivo + JetBrains Mono |

Three runtime dependencies total: `gsap`, `lenis`, `split-type`.

---

## Pages

| Route | Contents |
|-------|----------|
| `/` | Hero, proof metrics, and the four scroll-driven acts |
| `/work` | Four case studies plus eight research builds |
| `/about` | Operating history, systems-thinking panels, FAQ, technical stack |

---

## The four acts

Each act pins to the viewport and is driven by scroll position. Each ends in something that
actually computes.

1. **Whatever the business is losing** — five real client briefs, in their own words, each
   reforming glyph-by-glyph into the system that answered it. Hands off to a **two-pass
   reconciliation matcher**: exact reference and amount, then a normalised reference within an
   amount and date tolerance, then exceptions with stated reasons. Runs over a fixture invented for
   this page — no client data.
2. **Five inputs, one call** — a market-variance engine on canvas. Standardises five inputs against
   their own history and combines them on fixed weights into one regime call. Sample readings, real
   arithmetic.
3. **Price an option, live** — four layers explode apart, a pulse falls through them, then they
   collapse into a working **Black-Scholes payoff and Greeks explorer** with six preset regimes,
   each demonstrating a different dominant Greek.
4. **Then solve it in fewer steps** — the same option solved twice, stepping through real
   Newton-Raphson iterates, then an **implied-volatility solver benchmark** measured in your
   browser: cold start vs warm start over a 31-strike chain.

Design notes that matter more than they look:

- Every act resolves to a readable static state below 768px and under `prefers-reduced-motion` —
  the pins are gated by `gsap.matchMedia()`, and each renderer has a reduced-motion branch.
- Lit/active state is derived from **timeline time**, not from per-tween callbacks. Under scrub
  only the advancing tween fires, so callback-driven state silently desyncs when you scroll fast.
- Text holds still for roughly half its scroll budget. A statement that is only legible mid-flight
  is a statement nobody reads.

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ + regenerates llms-full.txt
npm run preview
```

---

## Project structure

```
├── index.html · work.html · about.html   ← three Vite entry points
├── vite.config.js · tailwind.config.js · vercel.json
├── scripts/
│   └── gen-llms-full.mjs      ← postbuild: full-text dump for AI crawlers
├── public/                    ← llms.txt, robots.txt, sitemap.xml, og.jpg
└── src/
    ├── core.js                ← shared per-page init (Lenis, nav, observers)
    ├── hero.js                ← hero entrance; home-only, keeps SplitType out of the shared chunk
    ├── acts.js                ← pinned-act + sticky-stack builders, renderer registry
    ├── animations.js · cursor.js · styles.css
    ├── pages/                 ← home.js · work.js · about.js
    ├── acts/                  ← brief.js · signal.js · pricing.js · solver.js
    ├── components/            ← payoff.js · solver.js · pipeline.js · portrait.js
    │                             skills.js · projects.js · dashboard.js · nav.js
    └── svg/grid.js
```

The engines are plain modules with assertions that run before anything touches the DOM:
`payoff.js` checks against known Black-Scholes values and put-call parity, `solver.js` round-trips
implied vol through the pricer, `pipeline.js` locks the fixture's match and exception counts.

---

## SEO / AEO

- `public/llms.txt` — structured summary for AI answer engines
- `/llms-full.txt` — generated from the **built HTML** at deploy time by
  `scripts/gen-llms-full.mjs`, so it cannot drift from what is published
- `public/robots.txt` — explicitly welcomes AI search crawlers; disallows bulk training scrapers
  that surface no citation
- JSON-LD `@graph` per page (`WebSite`, `Person`, `ProfilePage`, `CollectionPage`, `FAQPage`,
  `SoftwareApplication` for each live tool), distinct canonical and OG tags per route

Proof figures are baked into the markup rather than injected by JavaScript — a crawler with no JS
still reads the real numbers, and the count-up animation zeroes them at init instead.

---

## Design tokens

| Token | Value |
|-------|-------|
| Background | `#0a0a0a` |
| Surface | `#111111` |
| Text | `#f0ede8` |
| Muted | `#6b6b6b` |
| Accent | `#c8ff00` |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` |

---

## Deploying

Vercel-ready. `cleanUrls` is on, so `work.html` serves at `/work`. Every push to `main` deploys.

---

## Contact

**Bhavya Dhoot**
[dhoot.bhavya1@gmail.com](mailto:dhoot.bhavya1@gmail.com) ·
[LinkedIn](https://www.linkedin.com/in/bhavya-dhoot/) ·
[GitHub](https://github.com/Bhavya-Dhoot)
