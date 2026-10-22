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
- Scheduled action: `.github/workflows/build-peninsula.yml` (monthly and manual)
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
