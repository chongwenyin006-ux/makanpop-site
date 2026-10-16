# MakanPop V6 — The Food Playground

A completely redesigned interactive food gacha website. The original design is inspired by the *creative direction* of editorial, collage-based, motion-rich sites, without copying Trevor Noah's graphics, brand, typography assets, or source code.

## What is new

- **Brand-new art direction:** bold editorial typography, navy / pink / lime palettes, animated sticker collage, layered capsule hero, kinetic ribbon and responsive layout.
- **Four clear steps:** location, 26 food categories, dislikes, budget & distance (instead of everything being crammed into the home screen).
- **9 mood tags and 10 additional avoidance/dietary concerns** (currently stored as preferences only: *not* hard filtering unless verified item tags exist).
- **Actual nearby places:** uses the existing `/api/restaurants` server route and OpenStreetMap/Overpass data. It does **not** fabricate restaurants, ratings or menus when the live query fails.
- **Current location and 32 manually selectable Malaysian areas**, including Klang, Bandar Bukit Tinggi, Bandar Botanic, Setia Alam and KL.
- **Blacklist**, **personal price notes** and **4 user-selectable themes** stored in the current browser.
- **Restaurant gallery** of real loaded places, with distance, map links, and simple sorting.
- **Responsive desktop / mobile**, user-controlled motion reduction support.

## Run in StackBlitz (the existing project)

1. Download and extract the ZIP.
2. Copy everything inside the extracted folder, including `lib/`, `functions/`, `public/`, `server.mjs`, `package.json`, `README.md`, `.gitignore`, into the local `makanpop-site` GitHub repository. Replace existing files.
3. Commit the changes (`Redesign MakanPop V6 Food Playground`) and `Push origin` in GitHub Desktop.
4. Refresh `https://stackblitz.com/github/lazycat-elyn/makanpop-site` (open the site preview in its own tab when trying GPS).
5. Node preview: `npm run dev` then visit the port 3000 preview.

## Cloudflare Pages deployment

Connect repository to Cloudflare Pages with:
- Framework: None
- Build command: `exit 0`
- Build output directory: `public`
- Use Pages Functions found in `functions/api/restaurants.js` and shared logic under `lib/`.

## Important limitations

- The restaurants API is an experimental **free public OpenStreetMap Overpass service**. It is not guaranteed to return data reliably, and some restaurants may not be mapped. Public API usage limits apply. For a larger audience, use a compliant managed data provider or host a suitable read-optimized copy.
- Browser GPS requires HTTPS, user permission, and compatible browser embedding. A manually selected place uses its *approximate center*, not the user's precise coordinates.
- Cuisine tags in OSM are inconsistent or missing. Strict 'want/avoid cuisine' filters can return 0 results; this is surfaced to the user instead of inventing matches.
- **Mood, spice, allergens, religious diet/halal, vegetarianity and ingredients** cannot reliably be verified from free OSM tags. These preferences are stored but deliberately *not* used to claim a restaurant is safe or suitable. Ask the restaurant to confirm details.
- '24/7 only' only checks places *explicitly marked `24/7`*. It is not a fully accurate 'open now' parser.
- Price filter uses **only personal prices the user entered**; absence is displayed clearly. The personal price is not a verified restaurant menu price.
- Restaurant selection is random from loaded matching results. The CSS gacha provides a visual interactive sequence, not a physics-based 3D model.
- Branding original to MakanPop; Google Maps is only used for outbound navigation. Data attribution to © OpenStreetMap contributors remains visible.

## Project files

- `public/index.html` — whole front end (HTML / CSS / JavaScript)
- `server.mjs` — local Node preview server
- `lib/restaurant-query.mjs` — input validation and Overpass queries
- `functions/api/restaurants.js` — Cloudflare Pages Functions API
- `public/_routes.json` — route configuration
- `package.json` — no external runtime packages

This is a *prototype* ready for user testing, not a production-grade restaurant directory. Before publicly scaling, validate the map-data terms, privacy and rate limits and improve coverage.
