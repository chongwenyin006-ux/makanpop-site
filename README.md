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
