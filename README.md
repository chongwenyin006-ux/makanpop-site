# MakanPop! — StackBlitz + GitHub + Cloudflare Pages

基于 **MakanPop V4**：真实 OpenStreetMap 餐厅、GPS、RM 预算（仅有记录时能可靠筛选）、Blacklist、可更换主题、互动扭蛋机。

## 文件说明

- `public/index.html` — 真实网站，所有界面与功能都在这里；**这是最主要的修改文件**。
- `server.mjs` — StackBlitz 本地预览工具，不上传到网站服务器执行。
- `package.json` — StackBlitz 自动运行配置。无需安装额外 npm 套件。
- `.gitignore` — 避免上传临时文件。

## 第一步：创建 GitHub 仓库

1. 登录 https://github.com/new
2. Repository name: `makanpop-site`；为了免费用 StackBlitz GitHub 导入，选择 **Public**。
3. 建立空仓库（不要先自动生成 README，以免第一步冲突）。
4. 在新仓库点 **Add file → Upload files**；先在电脑解压本 ZIP，然后将解压后的**内容**（包括 `public` 文件夹）上传至仓库根目录，并 Commit changes。
5. **重要**：GitHub 首页应该看到 `public/`、`server.mjs`、`package.json`、`README.md`。不要把整个 ZIP 当成一个文件上传。

> Public 仓库代表所有人都可以看源码。不要把密码、私人地址或任何 API 密钥存入仓库。

## 第二步：用 StackBlitz 打开项目

将你的真实 GitHub 用户名和仓库名代入链接：

`https://stackblitz.com/github/你的GitHub用户名/makanpop-site`

StackBlitz 会自动识别 `package.json`，启动 `npm run dev`（端口 3000），就能看到网站预览。
编辑 `public/index.html` 便可修改网站。

**注意**：GitHub 导入的 StackBlitz 预览不一定把修改自动保存回 GitHub。编辑后必须保存/提交到 GitHub，才会更新正式网站。对于初学者，先在 GitHub 网页按铅笔图标修改 `public/index.html` 并 Commit，然后 StackBlitz 刷新查看最不容易混淆。

## 第三步：Cloudflare Pages 连接 GitHub

1. 登录 https://dash.cloudflare.com/ → **Workers & Pages → Create application → Pages → Connect to Git**。
2. 授权 GitHub 并选择 `makanpop-site` 仓库。
3. 设置（不要套用 Next.js 模板）：
   - Production branch: `main`
   - Framework preset: `None` / 无
   - Build command: `exit 0`
   - Build output directory: `public`
4. Deploy。发布后你会得到一个 `*.pages.dev` 的 HTTPS 网址（准确名字要由 Cloudflare 确定）。
5. 往后 GitHub `main` 分支有新提交，Cloudflare 会自动更新网站。

## 测试真实 GPS 和餐厅

- 必须在 HTTPS 公开网址上点击「使用我的 GPS 位置」并允许定位（StackBlitz 预览的 iframe 可能限制地理定位）。
- 无法授权 GPS 时改用页面上预设的 Setapak、Kepong、Cheras 等地区查询。
- 网站使用公开 Overpass API 拉取 OpenStreetMap 的真实 POI（不需要 Google 密钥）。网络服务可能被限流、暂时关闭或资料不完整，因此不能保证每个地区总能查询成功。
- 餐厅位置与营业状况可能过时；没有实时人均 RM 价格或 Google 评分。自己的消费金额可存在浏览器，其他访客不会共享。
- 网站不上传用户的 Blacklist；它存放于当前浏览器的 localStorage。换设备不会自动同步。

## 费用说明

本项目没有付费 API 依赖。GitHub、StackBlitz 和 Cloudflare 的免费使用各有服务条款和限制，未来高流量或商业化可能需要调整。不要将 OpenStreetMap 公共查询端点视为无限制、无限稳定的生产服务。

地图资料版权说明：https://www.openstreetmap.org/copyright
