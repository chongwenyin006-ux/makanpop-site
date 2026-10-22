## Current provider: TomTom + optional Overture (October 2026)

MakanPoP does not claim every restaurant is open, verified, or has usable images.

### Enable TomTom Places Discover

1. Register on https://my.tomtom.com/ and create a Places Search API key.
   Verify the free-tier terms at https://docs.tomtom.com/pricing.
   The currently advertised free allowance is 5,000 Places Discover requests per month, with no credit card needed to get started.
2. Set the server-side environment variable **TOMTOM_API_KEY** to your key.
   On Cloudflare Pages, add it as a private secret under the project environment variables.
   For the StackBlitz Node preview, add it to the private development environment before starting the server.
   NEVER place this value in GitHub source code, client JavaScript, screenshots or chat messages.
3. Restart/redeploy; inspect /api/provider-status. tomtomEnabled=true means the key was provided to the server.
   This alone does NOT prove the provider is accepting the key until a live address/restaurant search succeeds.

Without a configured key, the website explicitly labels its older OSM provider; it will not falsely claim to use TomTom.

### Features when TomTom is configured

- Nearby restaurants, fast food, cafés, food courts and related categories via TomTom Places Discover v3.
- User-selected Western Peninsular Malaysia search point (GPS, PV15, town, mall or address).
- Full address text lookup through a backend endpoint /api/addresses?q=..., showing address candidates for selection.
- Credentials remain server-side; frontend only receives names, coordinates, POI categories and addresses.
- Overture Maps monthly closure snapshot, when available, excludes only exact normalized name matches within 35m of places explicitly tagged permanently_closed. The feed is incomplete and not a real-time business verification.
- TomTom errors are shown rather than silently disguising fallback OSM records as TomTom.
- TomTom's free Places Discover API does not include a reliable restaurant photo gallery or menu prices.
  Existing source-credited Wikimedia Commons images, personal uploads and external Google Maps links remain separate.

### Usage and cost

The free tier has a monthly limit, not unlimited search. Each address search and each new location restaurant search consumes a request.
Repeated spins at the same location reuse the in-memory result; monitor/cap usage in your provider account before any public launch.
No credit card is required for the advertised free sign-up, but we have not validated a user account, live entitlement or future cost for this repository.

Docs: https://docs.tomtom.com/places-search-api/documentation/places-search/discover
Overture attribution: https://docs.overturemaps.org/attribution/
Lean preview: https://stackblitz.com/github/chongwenyin006-ux/makanpop-site/tree/preview
Tests: tests/tomtom.test.mjs run against mock responses and use NO live billable API calls.

---
# MakanPoP V8 — Cinematic Café Gacha

本版本基于你选择的视觉参考图，重构成可运行的页面。

## 关键区别
- 首页图形素材中，机器提取自你给的参考图片；可以点击或拖动的旋钮、导航、地点、筛选和结果是网页元素。
- 正确名称：**MakanPoP**。
- 左侧品牌文案 + 中央巨型图片机器 + 右侧三行设置，手机独立排版。
- 复用 V7 的真实餐厅 API、Klang 地区列表、Google Maps 导航、BlackList 和主题切换。
- 这不是完整 3D 网格模型，也没有真正的物理碰撞。转动与出球是 CSS 动画。

## 在 StackBlitz 使用
将 ZIP 解压后，**把里面的文件和文件夹**复制到本地 GitHub Desktop 的 `makanpop-site` 文件夹根目录，覆盖同名文件。
然后 Commit → Push，并在 StackBlitz 重新打开项目。
运行 `npm run dev`，预览 `http://localhost:3000`。

## 真实餐厅 & GPS
`/api/restaurants` 在 StackBlitz 由 `server.mjs` 提供，在 Cloudflare Pages 由 Pages Functions 提供。
真实餐厅来自 OpenStreetMap Overpass，公开服务仍可能限流、超时，餐厅价格往往没有提供。
GPS 需要浏览器定位授权、HTTPS/localhost 安全上下文。避免在受限 iframe 测试。
不会在餐厅查询失败时生成假店名。

## 部署至 Cloudflare Pages
GitHub Connect to Git；Framework: None；Build command: `exit 0`；Output dir: `public`。

## 版权及素材
视觉素材从用户在对话中提供的 MakanPoP 参考视觉制作，用于本网站的设计原型。图片内印刷小字属于机器素材；其它文案和按钮都是真实网页元素。

## Klang zero-cost real restaurant search (October 2026)

MakanPoP now prefers a **real OpenStreetMap Klang snapshot** before the shared live query.
This avoids hitting public Overpass servers for every spin.

- The homepage reads `/data/klang-restaurants.json` for supported Klang locations.
- `scripts/refresh-klang.mjs` collects named restaurants using OpenStreetMap, not invented businesses.
- `.github/workflows/refresh-klang.yml` runs an on-demand or weekly refresh on GitHub Actions.
- For a forked repo, workflows may be disabled. Go to Actions, enable workflows if prompted,
  select **Refresh real Klang restaurants**, and click **Run workflow** once.
- Verify that `public/data/klang-restaurants.json` exists before considering initial setup complete.
- If the public service is unavailable, the script preserves any previous snapshot.
- Pricing, allergen information, and live opening hours are not reliably supplied by OSM.
- Attribution: © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright

GitHub standard hosted Actions in a public repository is free; there is no API key or card.
Public Overpass services are best-effort; the static snapshot may be outdated between refreshes.

## Peninsular Malaysia food discovery (October 2026)

**Scope:** Peninsular Malaysia only (13 administrative regions, including KL / Putrajaya). Sabah, Sarawak and Labuan are excluded.
The website supports GPS searches and a searchable city, neighbourhood and shopping mall index.
Shopping-mall suggestions select a 500 m vicinity; the nearby results are not guaranteed to be inside the mall.

**Data:** all *mapped* named restaurant, fast_food, cafe, food_court, ice_cream, bakery and selected food-shop POIs in the Geofabrik Malaysia/Singapore/Brunei OpenStreetMap extract, clipped with Peninsular Malaysia state polygons from geoBoundaries.
The generated catalogue has real OSM POI identifiers, coordinates, food category tags where present, and address/unit/floor when mapped.
It never invents a restaurant to fill the selection. There is no guarantee of every restaurant or up-to-date menus inside every shopping mall.

- Generator: `scripts/build-peninsula.py` (downloads and processes the public Geofabrik PBF)
- Scheduled action: `.github/workflows/build-peninsula.yml` (weekly and manual)
- Published metadata: `/data/peninsula/manifest.json`
- City and mall lookup: `/data/peninsula/places.json`
- Nearby static tiles: `/data/peninsula/tXX_YYY.json`, downloaded on demand.
- If the national catalogue is missing or corrupt, the website still tries the previous Klang cache and public Overpass query.
- If a workflow shows a red cross, inspect its logs before treating coverage as completed.

**Attribution and licence:** © OpenStreetMap contributors under ODbL (https://www.openstreetmap.org/copyright).
Contains country/state boundary data © geoBoundaries, gbOpen CC BY 4.0 (https://www.geoboundaries.org/).
Geofabrik source https://download.geofabrik.de/asia/malaysia-singapore-brunei.html.

**Cost:** No Google Places API key or billing account. Static data is free; GitHub Actions/hosting
are within public-repository and free-plan use subject to provider limits. User-provided prices are personal notes,
not verified current menu prices.

## Restaurant photos and permanent closures

**What is excluded?** The nationwide OSM extract and the live fallback filter places
explicitly marked inactive via lifecycle tags (`disused:*`, `abandoned:*`,
`demolished:*`, `removed:*`, vacant shops, confirmed closed business-status
tags, and `opening_hours=closed`). Places which actually closed but have not
been updated on OpenStreetMap cannot be detected reliably with free OSM data.
The data build refreshes once per week via GitHub Actions; current on-site
business status is **not** guaranteed.

**User reports:** The result modal has `这家已永久关闭`. Confirming hides that
OSM POI from the current browser's future spins, and it can be restored in
`Blacklist`. This is not a verified global closure notice and does not write
to OpenStreetMap. Users can open the OSM place record to submit a verified edit.

**Actual restaurant photos:** `public/photo-lookup.js` only attempts to display
a Wikimedia Commons *File:* photo explicitly attached to this exact OSM
restaurant record (`wikimedia_commons` or Commons `image`). The Commons API
returns the thumbnail and author/license details; the interface attributes
the photographer and links to the file's source and full terms.
No unverified image searches, generic food photos, or pictures of other
branches are silently substituted. Restaurants with no appropriately tagged
Commons photo show a clear 'no verified photo' message and a separate link
to search the exact restaurant name/location in Google Maps. This link does
not embed Google Maps photographs or use a paid Google API.

The October 22 2026 West Malaysia snapshot currently has only **8 direct
restaurant-linked Commons photo references**. This is a severe coverage gap
and must not be represented as universal restaurant photography.

All map data: © OpenStreetMap contributors (ODbL). Photographs, when present,
follow the license and attribution shown on their individual Commons file pages.

## Address-first gacha and personal restaurant photos

- The current location **does not constrain** a manually chosen target. Example: while physically in Klang, choose `PV15` to search around the actual mapped PV15 building at 2A Jalan Danau Saujana 1, Setapak.
- The website accepts western-Peninsular locations, city/mall/building names, street-address strings from the OSM extract, and manually supplied `latitude, longitude` coordinates.
- Address search is built **offline** from the OSM/Geofabrik PBF by `scripts/build-peninsula.py`. It indexes the names, addresses and street names of mapped objects into narrow shards under `/data/peninsula/address-index/`. It is not powered by Google Maps or the public Nominatim geocoding service.
- A user presses **Search** to look up an address. When ambiguous, it shows concrete mapped location choices. It does not claim all Malaysian addresses are present.
- The existing cinematic gacha image now has a dedicated 2.5D independently movable dial. Drag the knob to rotate, or press START GACHA. Reflection/exit animations are visual rather than a real 3D physics simulation.
- For a restaurant with a directly associated licensed Wikimedia Commons photo, the result automatically shows the photo and source/author/license.
- Otherwise users can click the Google Maps photo lookup link. They can also upload an image they photographed or have permission to use. Personal images are resized through canvas (removing EXIF) and saved with IndexedDB **only in their current browser**; they are not published to other users and not verified by moderators.
- Users should not expect complete current real photos of every restaurant from free OpenStreetMap: the current mapping has very few directly Commons-linked images.
- No payment card, proprietary geocoding key, or paid photo API is required. Static photo uploads are on-device only.
