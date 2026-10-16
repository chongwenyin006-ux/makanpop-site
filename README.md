# MakanPop V5.1 — GPS + Real Restaurants repair

本版本沿用 V5 POP Edition 外观与 Blacklist、扭蛋、RM 筛选等功能，并改进了**真实餐厅获取**：

- **StackBlitz 开发预览**：`server.mjs` 自带 `/api/restaurants`，后端代替浏览器向 Overpass 查询，减少前端跨域限制。
- **Cloudflare Pages 正式部署**：根目录的 `functions/api/restaurants.js` 提供同名接口，保留原来 `public` 作为部署目录。必须通过 **GitHub 连接 Cloudflare Pages** 部署 Functions；Cloudflare Dashboard 的静态 Direct Upload 不会部署 Functions。
- 仍采用真实的 OpenStreetMap 数据，遇到限制、超时或无结果不会造假。
- 对 GPS 被预览 iframe 拒绝增加了提示和「新标签打开」链接。**使用真实 GPS 时强烈建议在浏览器新标签打开预览，或者正式部署到 HTTPS Pages 域名。**
- 用户的个人金额和 Blacklist 仍存在浏览器 localStorage；地图坐标会传递给公共 Overpass 服务用于查询。

## 安装更新：不要重新创建 GitHub 项目

1. 解压本 ZIP。
2. 在 GitHub Desktop `makanpop-site` 点击 **Repository → Show in Explorer**。
3. 将解压出来的 `public/`、`functions/`、`lib/`、`server.mjs`、`package.json`、`.gitignore` 和 `README.md` 复制到仓库根目录（与 `.git` 文件夹平级）。如有询问，选择替换原文件。
4. GitHub Desktop 中 Summary 写 `Fix GPS and real restaurant API`，按 **Commit to main**，再按 **Push origin**。
5. 重新打开 https://stackblitz.com/github/lazycat-elyn/makanpop-site （必要时刷新 / 重新导入）。
6. 预览区右上角点击 **↗** 在浏览器独立标签页打开网站；点击 `📍 使用我的 GPS 位置` 并允许位置权限。
7. GPS 仍不行？在筛选页选择 Setapak 等地区，点击「找附近餐厅」来**独立测试餐厅接口**。如果手动地区也失败，查看网站提示的具体错误并截图发送。

## 免费发布到 Cloudflare Pages

- GitHub 集成仓库：`lazycat-elyn/makanpop-site`
- Framework：None
- Build command：`exit 0`
- Build output directory：`public`
- 根目录 `functions/api/restaurants.js` 会自动识别为 Pages Function。根目录 `lib/restaurant-query.mjs` 会被一起打包。
- 不需要 Google Places API Key。Cloudflare Functions 免费方案和 OpenStreetMap 公共 Overpass 有配额及限制，不保证高流量下稳定。

## 排错提示

- **GPS 权限被拒绝**：先检查 Chrome 地址栏左侧的位置权限；Windows「位置服务」也要启用。尽量用独立标签页，不要直接在 StackBlitz 右侧 iframe 测试。
- **餐厅 API 未启用**：检查 `functions/`、`lib/`、`server.mjs` 是否都复制到仓库根目录，且 StackBlitz 已重启开发服务器。
- **地图服务错误 / 超时 / 429**：这是公共地图服务临时不可用或访问受限，稍后重试或选择较小的半径。
- **真实餐厅数量为 0**：OSM 没有匹配到地点，放宽筛选、扩大范围或换地区；不会使用虚构餐厅填充。
- **某店价格待确认**：OSM 常不提供人均 RM 价格；只有个人已记账的价格可用于严格预算筛选。

> 自动化测试可以验证接口和 UI 逻辑，但无法代替你所在手机或电脑的实际 GPS 授权和公开地图接口测试。
