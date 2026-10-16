# 企业出海安全官：地缘政治风险识别与海外利益保护

线上地址：<https://enterprise-overseas-safety.vercel.app>

本项目面向企业海外安全与运营负责人，将非结构化新闻舆情转化为可解释的项目级风险预警。系统以大语言模型完成事件编码，以成本距离扩散模型刻画事件影响足迹，计算地缘政治风险压力指数并给出预警等级与处置建议；对低置信或地点不明的事件自动转入人工复核。方法本身适用于全球任意海外项目，当前以坦赞铁路（TAZARA）为示范案例。

## 功能模块

| 模块 | 路由 | 说明 |
| --- | --- | --- |
| 登录 | `/login` | 点击企业端进入，账号密码任意填写 |
| 风险情绪指数 | `/` | 国家层 PORI 指数热力地图、国家详情、15 项解释维度 |
| 影响模拟器 | `/impact-simulator` | 自定义事件类型与位置，模拟成本距离影响足迹 |
| 重点项目 | `/regional-insights` | 重点海外项目（坦赞铁路）风险事件与站点暴露 |
| 案例分析 | `/conflict-warning` | 预警信息流、证据链与人工研判 |
| 数据中心 | `/data-sources` | 数据来源目录 |
| 事件研判 | `/event-analysis` | 核心流程：粘贴新闻 → AI 编码 → 影响足迹 → 项目预警 → 建议 |
| AI对话 | `/ai-conversation` | 演示模块，展示问答式交互形态 |

## 技术架构

- 前端：Vite 6 + React 18 + TypeScript，Tailwind CSS，Leaflet 地图，MUI / Radix UI 组件。
- 服务端：Vercel Serverless Function `api/analyze.ts`，调用 DeepSeek `deepseek-chat`（JSON 模式，temperature 0.1，单次超时 30 秒，返回非法 JSON 时自动重试一次）。API Key 仅存在于服务端环境变量，不进入浏览器。
- 计算：事件编码结果在客户端完成地点解析、成本距离扩散（`src/utils/costDistanceImpact.ts`）、指数与预警等级计算（`src/utils/eventAnalysis.ts`）。
- 校验：模型输出在服务端与客户端两次校验（`src/data/eventAnalysisSchema.ts`），证据须为原文逐字片段、标签须属于 15 项分类。

```
新闻文本 ─▶ /api/analyze (mode=extract) ─▶ DeepSeek ─▶ 结构化编码（标签/E-S-V-C/地点/置信度）
        ─▶ 客户端：地点解析 → 成本距离足迹 → L 与预警等级 → 复核判定
        ─▶ /api/analyze (mode=advise) ─▶ DeepSeek ─▶ 预警语句与 3–5 条处置建议
```

## 运行环境

- Node.js 20 及以上（开发验证版本 v20.19.2；`npm run test:*` 脚本使用 `--experimental-strip-types`，建议 Node 22+）
- npm 10+
- 本地调试 API 需 Vercel CLI（`npm i -g vercel`）

## 安装与启动

```bash
git clone https://github.com/Fynn-jx/Africa_frontend.git
cd Africa_frontend
npm install --legacy-peer-deps

# 仅前端（事件研判的 AI 接口不可用）
npm run dev            # http://localhost:5173

# 前端 + Serverless API
cp .env.example .env   # 填入自己的 DEEPSEEK_API_KEY
vercel dev             # http://localhost:3000

# 构建
npm run build
```

## 配置

| 变量 | 说明 |
| --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek API Key，仅服务端使用 |
| `DEEPSEEK_MODEL` | 模型名，默认 `deepseek-chat` |

本地写入 `.env`，线上在 Vercel 项目 Settings → Environment Variables 中配置。`.env*` 已列入 `.gitignore`，仓库与源代码包中不含任何密钥，请勿提交密钥。未配置时接口返回 503 `MISSING_API_KEY`。

## 数据来源

- 坦赞铁路线路与站点 GeoJSON、非洲国家边界 GeoJSON（`public/data/`）
- 物流资产目录（`src/data/logisticsAssets.ts`，静态示意坐标）
- 新闻媒体与传统数据源目录（`public/data/news_media_classified.json`、`traditional_sources.json`），详见数据中心页面
- 事件研判示例文本均为虚构示例（`src/data/eventAnalysisSamples.ts`），不代表真实新闻

## 目录结构

```
api/
  analyze.ts            Serverless 研判接口（extract / advise）
  _prompts.ts           系统提示词
src/
  app/pages/            各页面（EventAnalysis.tsx 为核心流程）
  app/components/       布局、导航、地图组件
  data/                 分类体系、示例、PORI 定义、静态数据
  utils/                成本距离模型、事件研判计算、数据加载
public/data/            地理与数据源文件
scripts/                模型与研判流程测试脚本
docs/                   使用说明、提示词与工作流、示例输入输出
```

## 示例输入输出

事件研判页内置 4 个虚构示例，详见 [docs/示例输入输出.md](docs/示例输入输出.md)。以示例 1（Kasama 社区阻断）为例，一次线上运行结果为：置信度 0.60，预警等级高危，地缘政治风险压力指数 L = 0.700，影响足迹命中 13 个站点，影响范围约 26,650 km²。

## 边界案例：人工复核

系统在以下情形自动标注需人工复核，并允许人工修正标签、地点与是否风险事件：AI 置信度低于 0.6；判定为非风险事件；地点无法解析；地点仅有模型坐标；存在多个地点。示例 4（地点不明）返回置信度 0.30、places 为空，系统不猜测坐标、不生成足迹，转入人工复核。

## 文档

- [使用说明](docs/使用说明.md)
- [提示词与工作流](docs/提示词与工作流.md)
- [示例输入输出](docs/示例输入输出.md)
