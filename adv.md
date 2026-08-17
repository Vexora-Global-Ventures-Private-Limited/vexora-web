# Plan to Push Every Section Above 95

Below is a concrete, spec'd plan per section. For each I define (a) what "95+" means in that dimension, (b) every upgrade with exact values, (c) implementation order. No vague gestures — everything is a buildable ticket.

---

## 1. UI / UX → Target 96 (from 72, Δ +24)

**Definition of 95+ here:** A user opening this file for the first time should never wonder "what's happening", "where am I", "what can I do", or "how do I undo that". Every state has a visible affordance, every action has feedback, and power users can drive it entirely from the keyboard.

### Upgrades

| # | Upgrade | Spec | Why |
|---|---|---|---|
| 1.1 | **Stabilization overlay** | Full-canvas translucent layer `rgba(15,15,26,0.85)` + centered card with animated gradient bar (0→100% over ~4s) + `%` counter + text "Laying out 623 nodes…" + `Cancel` button | Removes the silent 3–5s dead screen on first load |
| 1.2 | **Command palette (Cmd+K / Ctrl+K)** | `Cmd+K` opens centered modal, `backdrop-filter: blur(12px)`, fuzzy search across (a) nodes, (b) communities, (c) actions (Reset View, Export PNG, Toggle Physics, Theme). Keyboard nav: ↑↓ to move, Enter to run, Esc to close. Recent items persisted in `localStorage` | Becomes the power-user front door; instantly feels elite |
| 1.3 | **Keyboard shortcuts overlay (`?`)** | Press `?` opens a centered modal listing every shortcut in a 2-col grid, categorized: Navigation / Selection / View / Panels. Each row: `<kbd>` + description | Discoverability without cluttering the UI |
| 1.4 | **Floating action cluster (top-right)** | 4 icon buttons: Reset View, Zoom-to-Fit, Export, Settings. Each `40×40px`, `border-radius: 8px`, `shadow-3`, tooltip on hover. Always visible, never overlaps graph | Solves "no reset / no zoom indicator / no export" in one move |
| 1.5 | **Minimap (bottom-right)** | `160×100px` canvas, `shadow-4`, semi-transparent bg. Renders all nodes as 1px dots in community color, draws current viewport as a draggable rectangle. Click-to-pan | Orientation in a 623-node graph is otherwise painful |
| 1.6 | **Zoom + selection indicator (bottom-left)** | Pill showing `Zoom: 1.2× · 3 selected · 412 visible` | Continuous orientation |
| 1.7 | **Right-click context menu on nodes** | Custom menu with: Focus · Isolate (hide non-neighbors) · Hide · Expand Neighbors · Copy ID · Copy as JSON · Set as Path Start. `shadow-4`, `border-radius: 8px`, fade-in 120ms | Replaces the single click→inspect model with a full action surface |
| 1.8 | **Path finder** | Shift-click node A, shift-click node B → BFS shortest path, animate edges with flowing dash, show breadcrumb `A → C → D → B` in info panel with `Clear` button | Elite graphs do this; basic graphs don't |
| 1.9 | **Responsive drawer sidebar** | `< 768px`: sidebar becomes a slide-in drawer triggered by hamburger FAB. `< 480px`: minimap hidden, palette goes full-width | Currently zero responsive behavior |
| 1.10 | **Settings panel** | Slide-in from right (320px), sections: Physics (toggle + sliders for gravity/springLength/damping), Edges (curvature, width, arrows), Labels (visibility threshold, font size), Hyperedges (toggle, alpha), Theme (dark/light/system), Density (comfortable/compact). All changes live-apply | Currently zero configuration |
| 1.11 | **Toast system (bottom-right)** | Stack of 3 max, each 320×48px, `shadow-4`, slide-in 200ms, auto-dismiss 3s, hover-to-pause. Used for: "Exported to graph.png", "Link copied", "Community 5 hidden" | Feedback for every silent action |
| 1.12 | **Empty states with personality** | "No search results for `xyz`" + sad-dot illustration. "All communities hidden" + `Show all` button. "No node selected" + hint text | Removes dead panels |
| 1.13 | **First-visit onboarding** | 3 coach marks (search, click-to-inspect, filter by community), `Skip` + `Next`, dismissed state in `localStorage`. Re-trigger via Help menu | Stops first-time confusion |
| 1.14 | **Export menu** | Dropdown from Export FAB: PNG (transparent bg toggle) · SVG · JSON · Share-link (URL-encoded visible/hidden state) · Copy as Markdown table | Currently none |
| 1.15 | **URL state persistence** | `?focus=app_layout_tsx&hidden=3,7,12&theme=light` — shareable, back/forward works | Elite tools have shareable state |

### Implementation order
1.1 → 1.4 → 1.6 → 1.11 → 1.12 → 1.2 → 1.3 → 1.7 → 1.5 → 1.10 → 1.8 → 1.9 → 1.13 → 1.14 → 1.15

---

## 2. Colors → Target 96 (from 75, Δ +21)

**Definition of 95+ here:** Every color is a token, every token has a name and a role, contrast passes WCAG AAA on body text and AA on disabled, and both dark and light themes are first-class. No raw hex anywhere in markup.

### Upgrades

| # | Upgrade | Spec | Why |
|---|---|---|---|
| 2.1 | **Token layer** | Define `--bg-canvas`, `--bg-surface`, `--bg-surface-2`, `--border-subtle`, `--border-strong`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--accent-soft`, `--on-accent` as CSS variables on `:root`. Replace every hardcoded hex | Makes theming a variable swap |
| 2.2 | **Contrast fixes** | `--text-muted: #8a8aa3` (was `#555` → 7.2:1 on `#0f0f1a`, AAA). Stats footer `color: var(--text-secondary)` (was `#555`). Disabled states `--text-disabled: #5a5a78` only on truly disabled | Fixes the only WCAG failure |
| 2.3 | **9-step tonal palette per community color** | Each Tableau color gets 50/100/200/…/900 variants. Use 500 for node fill, 700 for border, 300 for hover ring, 100 for hyperedge tint | Lets depth/gradients use the same hue |
| 2.4 | **Semantic colors** | `--success: #22c55e`, `--warning: #f59e0b`, `--danger: #ef4444`, `--info: #3b82f6`. Used for: success toast, "isolated" badge, "no path found" warning, info pill | Adds meaning beyond community color |
| 2.5 | **Elevation via shadows** | `--shadow-1: 0 1px 2px rgba(0,0,0,0.3)`, `--shadow-2: 0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.5)`, `--shadow-3: 0 8px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.5)`, `--shadow-4: 0 24px 48px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.4)` | The single biggest visual lift |
| 2.6 | **Gradients** | Body: `radial-gradient(circle at 50% 0%, #1a1a2e 0%, #0f0f1a 70%)` for vignette. Sidebar header: `linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)`. Brand wordmark: `linear-gradient(135deg, #4E79A7, #6366f1)` text-clip | Adds depth, kills flatness |
| 2.7 | **Glassmorphism on overlays** | Modal/palette bg: `rgba(26,26,46,0.7)` + `backdrop-filter: blur(16px) saturate(140%)`. Border: `1px solid rgba(255,255,255,0.08)` | Modern, premium feel |
| 2.8 | **Light theme** | Full token swap: `--bg-canvas: #fafafa`, `--bg-surface: #ffffff`, `--text-primary: #1a1a2e`, `--text-secondary: #5a5a78`, `--border-subtle: rgba(0,0,0,0.06)`. Hyperedge alpha drops to 0.08, shadows use `rgba(0,0,0,0.08)` | Currently dark-only |
| 2.9 | **System theme detection** | `@media (prefers-color-scheme: light)` + manual override in Settings, persisted | Respects OS preference |
| 2.10 | **Color-blind safe palette toggle** | Switch to Okabe-Ito (`#E69F00, #56B4E9, #009E73, #F0E442, #0072B2, #D55E00, #CC79A7, #000000`) | Accessibility win |
| 2.11 | **Selected-node ring** | Animated `conic-gradient` ring at 1.5s rotation, 3px wide, community color → white → community color | Draw the eye to the active node |
| 2.12 | **Hyperedge restyle** | Use community color (not fixed indigo), fill alpha 0.10, stroke alpha 0.65, add `shadowBlur: 8` on the stroke | Currently disappears behind nodes |
| 2.13 | **Hover surface** | All interactive surfaces: `rgba(255,255,255,0.04)` overlay on hover, `rgba(255,255,255,0.08)` on active | Subtle but unmistakable |
| 2.14 | **Inner highlights** | Panels get `box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)` for top-edge sheen | Premium edge definition |

### Implementation order
2.1 → 2.2 → 2.5 → 2.6 → 2.13 → 2.14 → 2.3 → 2.4 → 2.7 → 2.8 → 2.9 → 2.10 → 2.11 → 2.12

---

## 3. Fonts → Target 96 (from 60, Δ +36) — biggest jump needed

**Definition of 95+ here:** Three role-specific web fonts, a documented type scale, tabular numerals on all data, optical sizing, and zero reliance on OS fallbacks for the primary experience.

### Upgrades

| # | Upgrade | Spec | Why |
|---|---|---|---|
| 3.1 | **Load three web fonts** | `@font-face` declarations for **Inter** (UI body), **JetBrains Mono** (code/labels/numbers), **Space Grotesk** (display/brand). Variable font versions, `font-display: swap`, preload critical weights via `<link rel="preload">` | Each role gets the right semantic font |
| 3.2 | **Font role mapping** | • Body, paragraphs, descriptions → Inter 400/500<br>• Node labels, neighbor links, search results, stats → JetBrains Mono 400/500<br>• h3 section headers, wordmark, palette title → Space Grotesk 600 uppercase 0.08em<br>• Brand wordmark "graphify" → Space Grotesk 700 22px with gradient text-clip | Code identifiers finally look like code |
| 3.3 | **Type scale (Major Third 1.250)** | `--fs-xs: 11px, --fs-sm: 13px, --fs-base: 15px, --fs-md: 19px, --fs-lg: 24px, --fs-xl: 31px, --fs-2xl: 39px`. Apply consistently | Replaces ad-hoc 11/12/13px |
| 3.4 | **Line-height scale** | `--lh-tight: 1.1` (display), `--lh-ui: 1.4` (UI text), `--lh-body: 1.6` (paragraphs) | Currently default everywhere |
| 3.5 | **Tabular numerals everywhere data appears** | `font-variant-numeric: tabular-nums` on stats, neighbor count, degree, zoom %, community count | Stops digit jitter |
| 3.6 | **Optical sizing** | `font-optical-sizing: auto` on Inter (variable font) — letterforms adjust to size, tiny labels stay legible | Subtle but premium |
| 3.7 | **Fallback metrics matching** | `@font-face { font-family: 'Inter'; size-adjust: 100.5%; ascent-override: 90%; }` for system fallbacks to avoid layout shift | No FOUT jolt |
| 3.8 | **Letter-spacing rules** | UI uppercase labels `+0.06em`, all-caps h3 `+0.08em`, large display `-0.02em`, body `0`, monospace identifiers `0` | Tightens or loosens per role |
| 3.9 | **Font weight discipline** | Only 400, 500, 600, 700 used. 500 for emphasis in body, 600 for headings, 700 for wordmark only | No accidental boldness |
| 3.10 | **Code-specific ligatures in mono** | `font-feature-settings: 'calt' 1, 'liga' 1` on JetBrains Mono — `=>`, `!==` render as proper glyphs | Code-graph authenticity |
| 3.11 | **Sub-pixel antialiasing** | `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` on body, but NOT on the canvas (canvas keeps default for crisp edges) | Crisp text without hurting graph rendering |
| 3.12 | **Variable font axis control** | Inter `wght` 400→500 on hover for subtle weight bump instead of color change | Smoother than color flash |
| 3.13 | **Min font size floor** | 11px absolute minimum (currently 11px exists, OK), but body text bumped to 13px and stats to 12px | Readability |
| 3.14 | **Heading hierarchy in info panel** | Node label `--fs-md` 600, fields `--fs-sm` 400, field labels `--fs-xs` 500 uppercase muted | Currently all 13px |
| 3.15 | **Wordmark lockup** | "graphify" + 16px glyph (3 dots in gradient) + tagline "Code, connected." in `--fs-xs` muted | Brand presence |

### Implementation order
3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.8 → 3.6 → 3.7 → 3.11 → 3.10 → 3.12 → 3.14 → 3.15 → 3.9 → 3.13

---

## 4. Styles → Target 96 (from 68, Δ +28)

**Definition of 95+ here:** Every visual value is a token, every interactive element has 4 states (rest/hover/active/focus-visible/disabled), every surface has proper elevation, and there are zero inline styles in JS.

### Upgrades

| # | Upgrade | Spec | Why |
|---|---|---|---|
| 4.1 | **Spacing scale** | `--space-1: 4px, --space-2: 8px, --space-3: 12px, --space-4: 16px, --space-5: 24px, --space-6: 32px, --space-7: 48px`. Replace every ad-hoc padding/margin | Currently mixed 4/6/7/10/12/14 |
| 4.2 | **Radius scale** | `--radius-sm: 4px, --radius-md: 8px, --radius-lg: 12px, --radius-xl: 16px, --radius-full: 9999px` | Consistency |
| 4.3 | **Border tokens** | `--border-subtle: 1px solid rgba(255,255,255,0.06)`, `--border-strong: 1px solid rgba(255,255,255,0.12)`, `--border-accent: 1px solid var(--accent)` | Currently hardcoded `#2a2a4e` everywhere |
| 4.4 | **Elevation assignments** | Sidebar `shadow-3`; FAB cluster `shadow-3`, hover `shadow-4`; modal/palette `shadow-4`; tooltip `shadow-2`; dropdown `shadow-3`; toast `shadow-4` | Depth hierarchy |
| 4.5 | **4-state interactive system** | Every button/item gets: `:hover` (surface tint), `:active` (`transform: scale(0.97)`), `:focus-visible` (`outline: 2px solid var(--accent); outline-offset: 2px`), `:disabled` (opacity 0.4, cursor not-allowed) | Currently only `:hover` with no transition |
| 4.6 | **Replace inline styles with data attributes** | `el.dataset.color = node.color.background` + CSS `.search-item { border-left: 3px solid var(--node-color) }` set via `el.style.setProperty('--node-color', node.color.background)` (one property, not whole style block) | Separation of concerns; themeable |
| 4.7 | **Skeleton shimmer state** | `@keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }` on `linear-gradient(90deg, var(--bg-surface) 0%, var(--bg-surface-2) 50%, var(--bg-surface) 100%)` `background-size: 200% 100%`. Used in info panel + legend during load | Loading polish |
| 4.8 | **Inner highlight on panels** | `box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), var(--shadow-3)` on every elevated surface | Premium edge |
| 4.9 | **Hairline divider gradient** | Replace solid `#2a2a4e` borders between sidebar sections with `1px solid transparent; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent); border-image: …` | Subtle, modern |
| 4.10 | **Pill / badge component** | `.badge { padding: 2px var(--space-2); border-radius: var(--radius-full); font-size: var(--fs-xs); font-weight: 500; letter-spacing: 0.04em; }` with variants `.badge--accent`, `.badge--success`, etc. Used for "isolated", "selected", community tags | Replaces loose spans |
| 4.11 | **Button component** | `.btn` (32px height, 12px padding, `--fs-sm`, `--radius-md`) with variants `.btn--primary` (filled accent), `.btn--ghost` (transparent), `.btn--icon` (32×32 square). All get 4-state system | Replaces raw checkboxes/links as buttons |
| 4.12 | **Custom scrollbar** | `::-webkit-scrollbar { width: 8px; height: 8px } ::-webkit-scrollbar-track { background: transparent } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px } ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2) }` | Default OS scrollbars break immersion |
| 4.13 | **Selection color** | `::selection { background: rgba(78,121,167,0.4); color: #fff }` | Brand-aligned highlight |
| 4.14 | **Tooltip component** | `[data-tooltip]:hover::after { content: attr(data-tooltip); position: absolute; … }` with 100ms delay, fade-in 120ms, max-width 200px, `shadow-2` | Replaces browser title attribute |
| 4.15 | **Card / panel base** | `.panel { background: var(--bg-surface); border: var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-3), inset 0 1px 0 rgba(255,255,255,0.04); padding: var(--space-4) }` | Reusable surface |
| 4.16 | **Grid rhythm** | Sidebar uses flexbox column with consistent `--space-3` gaps between sections instead of mixed 0/8/12px | Visual rhythm |
| 4.17 | **Density modes** | `--density-comfortable` (default `--space-4` padding) vs `--density-compact` (`--space-2` padding, `--fs-xs` body) toggle in Settings | User preference |
| 4.18 | **Z-index scale** | `--z-base: 0, --z-sidebar: 10, --z-fab: 20, --z-tooltip: 30, --z-dropdown: 40, --z-modal: 50, --z-toast: 60, --z-overlay: 70` | Currently no z-index system |

### Implementation order
4.1 → 4.2 → 4.3 → 4.18 → 4.5 → 4.11 → 4.15 → 4.4 → 4.8 → 4.6 → 4.7 → 4.12 → 4.13 → 4.14 → 4.10 → 4.9 → 4.16 → 4.17

---

## 5. Animations → Target 96 (from 40, Δ +56) — biggest absolute jump

**Definition of 95+ here:** A documented motion language with named easings and durations, every state change is animated, micro-interactions on every interactive element, animated data viz (path flow, node breathing, hyperedge glow), and full `prefers-reduced-motion` respect.

### Upgrades

| # | Upgrade | Spec | Why |
|---|---|---|---|
| 5.1 | **Motion tokens** | `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (entrances), `--ease-in: cubic-bezier(0.7, 0, 0.84, 0)` (exits), `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` (playful), `--ease-linear: linear`. Durations: `--dur-instant: 80ms, --dur-fast: 150ms, --dur-base: 250ms, --dur-slow: 400ms, --dur-slower: 800ms` | Currently zero motion system |
| 5.2 | **Global hover transitions** | Every interactive element: `transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)` | Fixes the instant-snap problem |
| 5.3 | **@keyframes library** | Define: `shimmer`, `pulse-ring`, `breathe`, `fadeInUp`, `scaleIn`, `spin`, `dashFlow`, `glow`, `bob`, `slideInRight`, `slideOutRight`, `countUp` | Reusable building blocks |
| 5.4 | **Stabilization progress animation** | Top bar: 0→100% over actual stabilization time, gradient sweep, % counter increments via `requestAnimationFrame`, fades out on `stabilizationIterationsDone` | Replaces silent wait |
| 5.5 | **Sidebar entrance** | On mount: each section (search, info, legend, stats) fades in + slides up 8px with 60ms stagger, total 400ms | First-impression polish |
| 5.6 | **Node hover (canvas)** | In `beforeDrawing`, scale hovered node `1.0 → 1.15` over 150ms via interpolated scale var, add `shadowBlur: 12` glow in community color, fade in label (`font.size: 0 → 14`) | Currently labels hidden until select |
| 5.7 | **Selected node ring** | `pulse-ring` keyframe: `box-shadow: 0 0 0 0 var(--accent), 0 0 0 8px transparent` → `0 0 0 6px transparent, 0 0 0 12px transparent` at 1.2s loop. Implemented in canvas as concentric stroked circles with `globalAlpha` decay | Eye magnet |
| 5.8 | **Hub node breathing** | Top 5% degree nodes get `breathe`: scale `1.0 → 1.06 → 1.0` over 3s, staggered start times. Implemented in `beforeDrawing` with `sin(time)` | Subtle "alive" feel |
| 5.9 | **Edge flow on path highlight** | `dashFlow` keyframe on `stroke-dashoffset` 16 → 0 over 800ms linear infinite. Applied to BFS shortest-path edges. Visible motion along the connection | Elite graphs animate connections |
| 5.10 | **Hyperedge breathing** | `glow` keyframe: `globalAlpha` 0.10 → 0.16 → 0.10 over 4s, `shadowBlur` 0 → 8 → 0. Staggered per hyperedge | Subtle life |
| 5.11 | **Search results stagger** | Each result item: `opacity: 0, transform: translateY(4px)` → `1, 0` with 30ms delay per item, max 20 items = 600ms total | Feels responsive, not popup-y |
| 5.12 | **Sidebar section expand/collapse** | `max-height` transition 250ms `--ease-out` + opacity, when filtering communities | Currently instant |
| 5.13 | **Modal/palette entrance** | `scaleIn` from `0.96` + `opacity: 0` → `1, 1` over 200ms `--ease-out`. Backdrop fades in 150ms | Premium modal feel |
| 5.14 | **Toast slide-in** | `slideInRight` from `translateX(120%)` → `0` over 250ms `--ease-spring`. Exit: `slideOutRight` 200ms `--ease-in` | Personality |
| 5.15 | **Stats count-up** | On load: 0 → 623, 0 → 1155, 0 → 42 animated over 1000ms with `--ease-out`, tabular-nums keeps digits stable | Data feels alive |
| 5.16 | **Physics warmup fade-in** | Each node: `opacity: 0 → 1` over 400ms with 2ms delay per node (capped at 600ms total) as they stabilize | Removes "pop" |
| 5.17 | **Theme transition** | On toggle: `transition: background 400ms, color 400ms` on `body` + cross-fade graph canvas via opacity | No jarring flash |
| 5.18 | **FAB hover** | Each FAB: `transform: translateY(-2px) scale(1.05)` + `shadow-3 → shadow-4` over 150ms `--ease-spring` | Tactile |
| 5.19 | **Active press** | All buttons/links: `:active { transform: scale(0.97) }` over 80ms | Click confirmation |
| 5.20 | **Tooltip fade** | Tooltip: `opacity: 0 → 1` over 120ms after 400ms delay | Smooth reveal |
| 5.21 | **Empty state bob** | Empty-state illustration: `bob` keyframe `translateY(0 → -4 → 0)` over 2.5s infinite | Personality |
| 5.22 | **Legend item hover** | `padding-left: 0 → 4px` over 150ms `--ease-out` (already attempted but instant — add transition) | Currently snaps |
| 5.23 | **Checkbox check** | Custom checkbox `::after` border-draw: `width/height 0 → 4/7px` over 150ms `--ease-out`, plus 1px scale bounce | Tactile toggle |
| 5.24 | **Hyperedge label fade-in** | When hyperedge first computed: label `opacity 0 → 0.8` over 600ms after 200ms delay | Reveals structure |
| 5.25 | **`prefers-reduced-motion`** | `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` — keep only essential state changes, disable all decorative motion | Accessibility mandate |

### Implementation order
5.1 → 5.2 → 5.3 → 5.25 (do this first as a safety net) → 5.4 → 5.5 → 5.15 → 5.6 → 5.7 → 5.11 → 5.13 → 5.14 → 5.2 (apply globally) → 5.18 → 5.19 → 5.20 → 5.22 → 5.23 → 5.8 → 5.9 → 5.10 → 5.16 → 5.17 → 5.21 → 5.24 → 5.12

---

## 6. Eliteness / Richness → Target 96 (from 55, Δ +41)

**Definition of 95+ here:** The tool has identity (brand), intelligence (AI/semantic features), completeness (every action a power user expects), and surprise (features they didn't know they wanted). It feels like a product, not a script.

### Upgrades

| # | Upgrade | Spec | Why |
|---|---|---|---|
| 6.1 | **Brand identity** | Wordmark "graphify" (Space Grotesk 700, gradient text-clip `#4E79A7 → #6366f1`), 16px glyph SVG (3 dots + 2 edges in gradient), tagline "Code, connected." below in `--fs-xs` muted. Favicon (same glyph). Top-left placement in sidebar header | Currently no brand at all |
| 6.2 | **Iconography — Lucide** | Load Lucide via CDN, 16px icons, `stroke-width: 1.5`, `--text-secondary` color. Icons: Search, Settings, Download, Share, Maximize, Sun, Moon, Keyboard, X, ChevronRight, ChevronDown, Circle, GitBranch, Users, Filter, Copy, Eye, EyeOff, ZoomIn, ZoomOut, Crosshair, Sparkles (for AI) | Currently zero icons |
| 6.3 | **Command palette (Cmd+K)** | As specified in 1.2. Add: recent commands, action history, "Search nodes in community X", "Hide all but selected" | Power-user front door |
| 6.4 | **AI: Explain this cluster** | Button in info-panel when a community is selected → calls z-ai-web-dev-sdk LLM with prompt: "Describe what these {N} code entities have in common: {labels}. One sentence." → streams into a callout box with Sparkles icon | "Wow" feature |
| 6.5 | **AI: Find similar** | Right-click node → "Find similar" → embeds node label + neighbor labels → LLM returns ranked list of other nodes → highlights them with pulse ring | Semantic search beyond string match |
| 6.6 | **AI: Smart community names** | On load, batch-send each community's top-10 labels to LLM → replace "Community 5" with "Layout & Root Setup", "Community 7" with "API Route Handlers", etc. Cache in `localStorage` | Removes the worst copy in the UI |
| 6.7 | **AI: Why connected?** | Path-finder result includes LLM-generated explanation: "A imports B because layout.tsx uses geistSans for font setup" | Makes the graph legible |
| 6.8 | **Progress system** | Top-edge 2px progress bar (NProgress-style) for any async op. Stabilization: bar fills 0→100%. Export: bar fills. AI calls: indeterminate pulse. Always paired with status text | Removes silent waits everywhere |
| 6.9 | **Export menu** | Full dropdown: PNG (with transparent-bg checkbox, scale 1×/2×/3×), SVG (vector, editable in Figma), JSON (full graph state), Share-link (URL-encoded), Copy as Markdown table (selected node + neighbors) | Currently zero |
| 6.10 | **Share-link persistence** | URL contains: `?focus=ID&hidden=1,3,7&theme=light&zoom=1.2`. On paste, restores state with a 600ms animated transition | Shareable findings |
| 6.11 | **Settings panel** | As specified in 1.10. Sliders for physics params, all live-apply with debounced re-stabilize (200ms) | Currently zero config |
| 6.12 | **Keyboard overlay (`?`)** | As specified in 1.3. Grouped sections with `kbd` styled components | Discoverability |
| 6.13 | **Minimap** | As specified in 1.5. Plus: minimap shows hidden-community nodes as faded gray dots | Orientation |
| 6.14 | **Onboarding** | As specified in 1.13. Coach marks with arrow pointing to: search box, a sample node, community filter. `Skip`/`Next`/`Got it`. localStorage flag | First-run friction |
| 6.15 | **Node context menu** | As specified in 1.7. Plus: "Set as Path Start", "Set as Path End" — enables path finding via right-click | Full action surface |
| 6.16 | **Path finder with breadcrumb** | As specified in 1.8. Breadcrumb at top of info panel: `layout.tsx → RootLayout() → metadata`, each chip clickable, `Clear` button | Elite feature |
| 6.17 | **Group / cluster mode** | Toggle in settings: "Group by: None / Community / File Type / Source File". When grouped, nodes collapse into cluster bubbles with count badge, click to expand | Tames 623-node chaos |
| 6.18 | **Live stats bar** | Bottom-left pill, updates on every action: `Zoom: 1.2× · Visible: 412/623 · Selected: 1 · Edges: 891` | Continuous orientation |
| 6.19 | **Toast system** | As specified in 1.11. Variants: success (green left border), info (blue), warning (amber), error (red). Action button support ("Undo") | Feedback layer |
| 6.20 | **Empty states with illustration** | As specified in 1.12. Each empty state has: SVG illustration (3 dots fading), headline, body, action button | Removes dead panels |
| 6.21 | **Footer** | Bottom of sidebar: `graphify v1.0 · 623 nodes · MIT · GitHub ↗`. Hover shows commit hash | Currently bare |
| 6.22 | **Help menu** | `?` icon in header → dropdown: Keyboard Shortcuts, Onboarding, Documentation, Report Issue, About | Discoverability |
| 6.23 | **Theme toggle** | Sun/Moon icon in header, animated cross-fade between palettes, 3rd state "System" | User preference |
| 6.24 | **Density toggle** | Comfortable/Compact icon in header | Power-user preference |
| 6.25 | **Search enhancements** | Search supports: `type:code`, `community:5`, `degree:>5`, `file:layout.tsx` — parsed query language | Power search |
| 6.26 | **Selection multi-mode** | Shift-click = add to selection, Cmd-click = remove, Cmd-A = select visible, Esc = clear. Multi-select shows aggregated info panel | Beyond single-select |
| 6.27 | **Drag-to-select box** | Hold Shift + drag on canvas = rectangular marquee select | Graph-app standard |
| 6.28 | **Pin nodes** | Right-click → "Pin" — node becomes immovable when physics is re-enabled. Pinned indicator (small pin icon overlay) | Layout control |
| 6.29 | **Annotation mode** | Toggle: click anywhere on canvas to drop a sticky note. Persisted in localStorage. Visible only in this mode | Collaborative feel |
| 6.30 | **Version badge** | Small `v1.0` pill near wordmark, hover reveals changelog modal | Product polish |

### Implementation order
6.1 → 6.2 → 6.21 → 6.22 → 6.23 → 6.24 → 6.19 → 6.20 → 6.18 → 6.8 → 6.3 → 6.12 → 6.14 → 6.11 → 6.13 → 6.15 → 6.16 → 6.9 → 6.10 → 6.17 → 6.25 → 6.26 → 6.27 → 6.28 → 6.6 → 6.4 → 6.5 → 6.7 → 6.29 → 6.30

---

## Cross-Cutting Implementation Plan

### Phase 1 — Foundation (Days 1–2)
**Sections 2.1–2.5, 3.1–3.3, 4.1–4.4, 5.1–5.3, 5.25**
Token systems for color, font, space, motion. Without this, everything else is lipstick. Do `prefers-reduced-motion` guard first so all later animations are safe by default.

### Phase 2 — Visibility (Days 3–4)
**Sections 1.1, 1.4, 1.6, 1.11, 1.12, 6.1, 6.2, 6.21, 6.22, 5.4, 5.5, 5.15**
Things the user sees immediately on load: brand, icons, stabilization progress, entrance animations, stats count-up, empty states. Biggest perceived jump.

### Phase 3 — Interaction (Days 5–7)
**Sections 5.2, 5.6, 5.7, 5.11, 5.13, 5.14, 5.18, 5.19, 1.7, 1.10, 1.11, 6.3, 6.11, 6.19, 6.23, 6.24**
Motion language applied globally + command palette + settings + toasts + context menu. The tool now feels alive.

### Phase 4 — Depth (Days 8–10)
**Sections 1.5, 1.8, 1.13, 1.14, 1.15, 6.13, 6.16, 6.17, 6.25, 6.26, 6.27, 6.28**
Minimap, path finder, onboarding, export, share-link, group/cluster mode, multi-select, drag-select, pin. Power-user surface.

### Phase 5 — Intelligence (Days 11–14)
**Sections 6.4, 6.5, 6.6, 6.7, 6.8**
AI features — smart community names, explain cluster, find similar, why connected. The differentiator that takes it from 90 → 96.

### Phase 6 — Refinement (Days 15–16)
**All `prefers-reduced-motion` audits, accessibility audit (WCAG AAA recheck), performance pass (debounce, throttle, requestAnimationFrame), cross-browser test (Chrome/Firefox/Safari), mobile responsive test, light theme test.**

---

## Definition Reference

- **Token**: a named CSS custom property (`--space-3`) holding a raw value, used everywhere instead of the raw value. Enables theming and consistency.
- **State (interactive)**: rest / hover / active / focus-visible / disabled — the 5 states every interactive element must define.
- **Elevation**: visual depth via `box-shadow` layers. Higher elevation = closer to user.
- **Motion language**: a documented set of easings + durations used consistently, so all motion feels like one designer made it.
- **Stagger**: sequential animation delay (e.g. 30ms per item) so a list appears to "unfold" rather than "pop".
- **Glassmorphism**: translucent background + backdrop blur + subtle border — the "frosted glass" look.
- **Skeleton state**: gray shimmer placeholder shown before real content loads.
- **Coach mark**: a small callout pointing at a UI element with explanatory text, used in onboarding.
- **FAB**: floating action button — a circular icon button hovering above content.
- **Command palette**: a centered modal triggered by `Cmd+K` that lets users search/run any action or navigate to any node.
- **Path finder**: feature that finds the shortest path between two nodes (BFS for unweighted, Dijkstra for weighted) and animates it.
- **Hyperedge**: a relationship connecting more than 2 nodes, rendered as a shaded hull around them.
- **Density mode**: UI compactness setting — "comfortable" (more padding) vs "compact" (less padding, more info per screen).
- **Optical sizing**: variable-font feature where letterforms adjust to the size they're rendered at (tighter at small sizes, more open at large).
- **Tabular numerals**: monospaced digit variants so columns of numbers align vertically.
- **WCAG AAA**: contrast ratio ≥ 7:1 for normal text, ≥ 4.5:1 for large text — stricter than AA.

---

**Total scope**: ~95 tickets across 6 sections, ~16 working days for one engineer. Expected outcome: every section ≥ 95, overall ~96, and the tool reads as a polished product rather than a script.