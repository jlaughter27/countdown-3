# Live Transformed Countdown

A *memento mori* Progressive Web App — a gentle, constant reminder that each
moment is precious. It counts down the time remaining in your life (based on
your birthdate and a chosen lifespan), rotates through encouraging quotes, and
can track the time remaining for the people you love.

> *"Teach us to number our days, that we may gain a heart of wisdom." — Psalm 90:12*

## Features

- **Lifetime countdown** — days remaining plus a live `HH:MM:SS` clock, and a
  "percentage lived" readout.
- **Rotating quotes** — Bible, Motivational, Theologians, or a shuffled Mix.
  Tap a quote to skip ahead. Optional text-to-speech.
- **Loved ones** — track up to five people, with photos and a special
  "until 18th birthday" mode for children.
- **Personal backgrounds** — a daily-random color, a solid color of your
  choice, or a rotating set of your own uploaded images.
- **Backup & restore** — export/import all your settings as JSON.
- **Installable & offline-first** — works with no network once loaded, thanks
  to a service worker and an app manifest.

All data stays **on your device** — settings live in `localStorage`, and
images live in IndexedDB. Nothing is uploaded anywhere.

## Running locally

It's a static site with no build step. Serve the folder over HTTP (a service
worker and `dialog`/manifest features need a real origin, not `file://`):

```bash
# any static server works, for example:
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Markup: countdown, dialogs (onboarding, settings, loved ones). |
| `style.css` | All styling (dark theme, responsive, reduced-motion aware). |
| `app.js` | App logic: countdown, quotes, loved ones, backgrounds, storage. |
| `quotes.js` | Quote pools and `getQuotePool(category)`. |
| `idb.min.js` | Tiny IndexedDB key/value helper (`get`/`set`/`keys`/`del`). |
| `service-worker.js` | Offline caching (resilient install, SWR, offline fallback). |
| `manifest.json` | PWA manifest (name, icons, theme). |
| `icons/` | App icons (`any` + `maskable`, 192 & 512). |
| `tools/gen-icons.mjs` | Regenerates the icons from code (`node tools/gen-icons.mjs`). |

## Regenerating icons

The icons are generated programmatically (no design tool or binary deps):

```bash
node tools/gen-icons.mjs
```
