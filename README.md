
# 全球算力价格地图 · GPU Price Map

一个可直接部署的静态网站：展示全球 GPU（H100/H200/A100/GB200 等）价格的**实时表格和图表**。数据每日自动更新。

## 功能
- 表格过滤：按 GPU、定价类型、关键词搜索
- 图表：各 GPU 中位价、最低/最高价分布
- 自动更新：GitHub Actions 每天 02:00 UTC 运行抓取脚本，写回 `site/data/prices.json`
- 纯前端部署：可用 GitHub Pages / Vercel / Netlify 托管

## 快速开始
1. 新建 GitHub 仓库（或现有仓库），把本项目所有文件放进去（保持目录结构）。
2. 进入仓库 Settings -> Pages：
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `main`，`/site` 目录
3. 打开 `https://<你的GitHub用户名>.github.io/<仓库名>/` 即可访问网站。

> 若使用 **Vercel**：直接导入仓库，`site` 目录作为根目录；无需后端。

## 数据更新
- 默认从 `baseline_prices.csv` 读取你维护的价格；也可扩展 `scripts/fetch_sources.py` 里的 `fetch_public_sources()` 来抓取公开来源。
- GitHub Actions (`.github/workflows/update.yml`) 每天执行脚本，将合并后的数据写入 `site/data/prices.json` 并提交。

## 自定义
- 站点文案 / 主题：修改 `site/assets/style.css`、`site/index.html`
- 图表逻辑：修改 `site/assets/app.js`
- 数据字段：`site/data/prices.json` 的 schema 在表头中已体现

## 免责声明
数据来源于公开渠道与供稿，可能存在延迟或误差；请以供应商实际报价为准。
