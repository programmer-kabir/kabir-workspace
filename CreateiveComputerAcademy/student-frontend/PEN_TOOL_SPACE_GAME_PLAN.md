# 🚀 CCA Pen Tool Space Game — Full Plan

Reference: Adobe's official Pen Tool Game (helpx.adobe.com/illustrator/games/pen-tool-game) — Penny the space-explorer alien, Paper.js + SVG scenes, modular Level*.js files, a scrolling "Tunnel" minigame, Stars.js rating, ESC-to-close-path, final score screen. This plan reuses the *ideas* worth reusing and adapts them for CCA's own engine (`PenToolMasterGame.jsx` + the new Advanced Arena), without copying Adobe's IP (character, art, code).

---

## 1. Concept & Theme

**Story premise:** A student's cursor *is* a small spacecraft/drone flying through a vector galaxy. Every shape drawn is a "star-path" the drone must trace to unlock the next sector. Planets = shape targets. Anchor points = docking beacons. Bézier handles = the drone's steering thrusters.

**Mascot (original, not Adobe's Penny):**
- Name: **"Vecto"** — a small friendly robot-drone (not an alien, keeps it tool-neutral and on-brand for a *computer academy*, not just Illustrator).
- Personality: encouraging, slightly nerdy, celebrates small wins ("Nice anchor! +3 precision").
- Appears as: a simple 2-3 frame sprite (idle / thumbs-up / oops) — cheap to produce, doesn't need full character animation.

**Why this fits CCA:** ties directly into the existing brand (Brand Kit module already exists in staff/review portals) and gives Foundations Lab a consistent "space academy" identity across Typing Lab, Mouse Arcade, and Pen Tool — not just a one-off reskin.

---

## 2. Script / Narrative (sample, adjust tone as needed)

Short lines only — Adobe's own game proves brevity works better than long dialogue for a tool-practice game.

| Moment | Line (English) | Bengali/Banglish variant |
|---|---|---|
| Level intro | "New sector detected. Trace the path to dock." | "Notun sector paisi. Path trace kore dock koro." |
| First click | "Nice! Anchor locked." | "Bhalo! Anchor lock holo." |
| Handle drag | "Steady thrusters... shape the curve." | "Hater angul steady rakho... curve shape koro." |
| Mission complete | "Sector cleared! Accuracy: {X}%" | "Sector clear! Accuracy: {X}%" |
| Mistake (wall hit / bad handle) | "Recalibrating... try again." | "Recalibrate hocche... abar try koro." |
| Final stage complete | "Vector Galaxy fully mapped. You're a Pen Tool Pilot now." | "Puro Vector Galaxy map hoye gelo. Tumi ekhon Pen Tool Pilot." |

Keep every line ≤ 8 words on-screen (matches ASD-style clarity, doesn't block the canvas).

---

## 3. Level / Difficulty Structure

Reuse the tier system already built in `PenToolMasterGame.jsx` instead of inventing a new one:

```
Sector 1 (Beginner)     → straight-line polygons, no handles
Sector 2 (Intermediate) → single smooth curves, mirrored handles
Sector 3 (Advanced)     → broken/cusp handles, curvature-weight judgment
Sector 4 (Expert)       → sharp zigzags + timed tunnel flight
Final Sector            → combined score screen (all stars tallied)
```

Each sector = **Intro → Practice → Challenge**, same 3-step pattern Adobe uses per shape type:
- **Intro**: Vecto shows the shape once (auto-drawn demo, no input).
- **Practice**: guide lines + handle-direction hints on (current "Guide Lines" toggle, already built).
- **Challenge**: guide lines off, timer visible, real accuracy score counted toward the final tally.

---

## 4. Core Mechanics (what to add on top of what already exists)

Already working (from the Advanced Arena build): click = corner anchor, drag = curve handle, real accuracy scoring, difficulty badges, fullscreen mode.

**Worth adding, borrowed from Adobe's real-Illustrator-accurate controls:**
- **ESC key closes the current path** — matches actual Illustrator behavior, currently missing from our engine (we only auto-close on last point).
- **Ctrl+Z visual undo** — remove the last placed anchor/handle, not just a full mission reset (right now "Reset" wipes everything).
- **Alt-drag to break a handle mid-mission** — currently our missions pre-define broken handles in the data; making it a live keyboard modifier during any mission would be more realistic and reusable across future shapes.

---

## 5. New Minigame: "Tunnel Flight" (replaces/extends Wire Tracer)

Adobe's `TunnelGame.js` scrolls the *world* past a fixed character instead of a static trace — genuinely more game-like than our current static Wire Tracer. Plan:

- Camera/background auto-scrolls at a constant speed (`worldSpeed`), Vecto's drone stays fixed near the left third of the screen.
- Player draws the vertical offset only (mouse Y) — the drone follows the mouse's Y position while X auto-advances with the scroll.
- Tunnel walls (top/bottom bounds) narrow or bend as difficulty rises — same corridor-collision math we already have in Wire Tracer, just applied to a moving frame instead of a fixed path.
- Existing Expert-tier time-limit mechanic (already built for Serpent's Coil) folds naturally into this — scroll speed itself becomes the "timer."

This is a moderate rebuild of the existing Wire Tracer renderer, not a from-scratch feature — the collision-distance math, fail/win states, and sound hooks all carry over.

---

## 6. Scoring System

Keep what's already built, add one thing:
- Per-shape accuracy % (handle angle + weight) — ✅ already implemented.
- Per-shape 1–3 star rating — ✅ already computed server-side (`save_pentool_progress.php`, node-efficiency based) for the external academy; **reuse the same star formula client-side** for instant feedback here instead of waiting on a round-trip.
- **New: Final Sector combined score screen** — after the last stage, show total stars collected out of max, average accuracy across all sectors, and total time — mirrors Adobe's `Level008_EndStage` "finalscore" screen, which our current engine doesn't have (missions/tracks currently end silently with just a toast).

---

## 7. Visual / Art Direction — two real options

**Option A — Stay procedural (recommended, lower cost):**
Keep the current flat canvas + neon/cyberpunk grid look already built for the Advanced Arena. Add only: a small Vecto sprite (3 poses), a starfield background (cheap, generateable), and simple particle/glow effects already partly in place (confetti, shadow-blur strokes). No illustrator/artist needed — a developer can ship this alone.

**Option B — Adobe-style illustrated scenes (higher cost):**
Hand-drawn SVG backgrounds per level (like Adobe's `background001.png`, `background002.png`), Paper.js for scene-graph management, a fully animated mascot. Needs a dedicated artist, meaningfully more production time, and would mean rebuilding the rendering layer away from raw Canvas2D.

**Recommendation:** Option A first — ship the space theme, mascot, tunnel-flight, and final-score screen on the existing procedural engine. Revisit Option B only if the academy wants this to become a flagship, separately-marketed product.

---

## 8. Backend / Progress Wiring (important — currently broken for the *existing* main lab)

The real `/pen-tool` page today talks to `save_pentool_progress.php` / `student_pentool_stage_progress` via a `postMessage` listener that the embedded third-party game never actually sends — so admin's `PenToolReports.jsx` dashboard is silently empty for that page right now (flagged earlier in the Master Blueprint).

**For this new game, wire it correctly from day one:**
- Call `save_pentool_progress.php` directly from React (axios), same as `save_typing_session.php` already does elsewhere — no `postMessage` indirection needed since this game *is* React, not an iframe.
- Reuses the exact same table/endpoint the admin side already expects, so `PenToolReports.jsx` and `manage_pentool_progress.php` start showing real data with no backend changes.
- Bonus: this also gives a natural path to *fix* the existing dead integration later, since the schema is already proven to work once actually called.

---

## 9. Build Phases (rough order, not estimates)

1. **Branding pass** — finalize Vecto's look (3 sprite poses), starfield background, sector names, script lines (table above).
2. **Mechanics polish** — ESC-to-close-path, visual undo, live Alt-break-handle.
3. **Tunnel Flight rebuild** — scrolling-world version of Wire Tracer.
4. **Final Sector score screen** — aggregate stars/accuracy/time across all sectors.
5. **Backend wiring** — direct `save_pentool_progress.php` calls per sector completion.
6. **Full content pass** — fill in remaining shapes per tier beyond what Advanced Arena already has.
7. **QA pass** — test on the actual admin `PenToolReports.jsx` to confirm data flows end-to-end.

Each phase is independently shippable — e.g. branding + mechanics polish alone already meaningfully upgrades the current Advanced Arena without needing the Tunnel Flight rebuild done first.

---

## 10. What NOT to touch

- The external `/bezier/index.html` (bezier.method.ac embed) — leave as-is, it's the "official 21-stage academy" and stays separate.
- Don't copy Adobe's Penny character, art assets, or code — this plan is original, inspired by structure only (levels, tunnel concept, scoring pattern), not their IP.
