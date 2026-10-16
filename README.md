# 非洲地缘空间情报与冲突预警平台

一个专业的、国际化的非洲地区风险情绪与事件追踪数据平台。

## 设计理念

- **国际化、权威、中立、极简、高级感**
- 摒弃传统的“极客黑客风”或“深色战情室风”
- 转向“高级智库/高管决策支持平台”的风格
- 高信噪比设计、大量留白、清晰的层级关系、渐进式信息披露

## 核心功能模块

### 1. 舆情风险情绪指数（非洲宏观风向标）

- 全景地图可视化，聚焦非洲大陆
- 基于 Leaflet 的轻量地图视图，使用 OpenStreetMap 底图聚焦非洲大陆
- 热力图展示各国风险指数（PORI）
- 岛屿国家锚点高亮（毛里求斯、塞舌尔、马达加斯加）
- 交互式国家详情侧边栏
- 90 天趋势分析和 15 项解释维度雷达图

### 2. 智能冲突预警系统（决策信息流）

- 双栏布局：预警列表 + 详情视图
- 多级严重性分类（严重/警告/信息）
- 证据链展示（社交媒体、卫星监测、预测模型）
- 模型置信度可视化
- 人工研判功能（确认预警/标记误报/申请更多数据）

### 3. 影响范围模拟器（精密分析工具）

- 智能搜索和地理编码
- 事件类型选择（抗议/爆炸/武装冲突）
- 动态影响范围可视化
- 受影响人口统计
- 中资资产波及分析
- 关键基础设施识别

### 4. 坦赞铁路专属监控（微观传导追踪）

- 精确的铁路线路可视化
- 实时站点状态监控
- 路段中断风险评估
- 应急处置建议
- 关键联系方式
- 报告生成功能

## 视觉规范

### 色彩系统

- **背景色**: 纯白 (#FFFFFF) 和浅灰 (#F9FAFB)
- **品牌主色**: 联合国蓝 (#005BBB)
- **预警语义色**: 莫兰迪色系（柔和红、警示黄）

### 排版体系

- **字体**: Inter（现代无衬线字体）
- **层级**: 通过字重和灰度区分
- **数字**: 等宽数字字体（Tabular numbers）

### 设计元素

- 极简底图，去除繁杂地貌
- 弥散阴影替代实线边框
- 圆角卡片设计
- 微妙的动画过渡

## 技术栈

- **框架**: React 18 + TypeScript
- **路由**: React Router v7
- **样式**: Tailwind CSS v4
- **动画**: Motion (Framer Motion)
- **图表**: Recharts
- **地图**: Leaflet + React Leaflet + CARTO Light 底图
- **图标**: Lucide React
- **UI 组件**: Radix UI

## 开始使用

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build
```

## 项目结构

### PORI：国家网格压力均值的对数变换与归一化

舆情风险情绪指数（PORI，Public Opinion Risk Index）是网格层地缘政治风险压力指数在国家层的聚合：先取国家 c 全部网格在第 t 周压力水平的均值 P，再取 ln(1+P)，并以历史窗口内各国各周 ln(1+P) 的最小值与最大值归一到 0—100（超出部分截断），即 PORI = 100 ×（ln(1+P) − 历史最小值）÷（历史最大值 − 历史最小值）。PORI 与项目周边预警所用的网格层压力水平、升级信号出自同一模型，仅空间尺度不同。
项目周边使用网格层压力水平 L 与升级信号 M（近2周均值相对前8周基线的变化率）进行预警。

```text
R_{g,t} = Σ_{e∈E_t} s_e × k_τ(e) × exp(-c(e,g) / λ_τ(e))
P_{c,t} = Mean_{g∈country(c)}(R_{g,t})
x_{c,t} = ln(1+P_{c,t})
PORI_{c,t} = clip(100 × (x_{c,t} - min_ref x) / (max_ref x - min_ref x), 0, 100)
```

- `g` 为网格，`c` 为国家，`t` 为第 t 周；距离函数 `c(e,g)` 中的 `c` 表示成本距离。同一网格可叠加多个事件的贡献；P 是国家全部网格压力水平的均值。**`ln(1+P)` 只做对数压缩，其结果本身不是 0–100 分；最终分数还需要归一化并截断超出范围的部分。**
- `τ(e)` 表示事件类别；`s_e` 为事件强度，`k_τ` 为事件类别 τ 的类别权重，`λ_τ` 为类别衰减参数，`c(e,g)` 为最小累计成本距离。类别权重及衰减参数需要由正式数据管线校准。下方单事件演示模型仍保留历史字段名 `scaleWeight` 与原有默认值，其内部命名不改变这里 `k_τ` 的类别权重语义，也不表示已实现正式类别参数表。演示模型使用 `lambdaKm = halfDistanceKm / ln(2)`，成本半衰距离与衰减参数不同。
- `min_ref x`、`max_ref x` 分别是历史窗口内各国各周 `ln(1+P)` 的最小值与最大值。正式管线必须记录国家全部网格、周统计窗口、历史窗口与更新规则，并明确分母为零时的处理；归一化后超出 0–100 的部分截断。当前前端只展示定义与演示值，尚未实现全量压力聚合、类别参数校准或正式历史窗口归一化。
- 三大类与15项子维度为各类别对网格压力的贡献分解（演示数据），用于风险解释，不参与 PORI 合成。
- 地图、排行榜与国家详情继续使用 `africanCountriesData.ts` 中的独立演示分数；数据中心预览的 `pori_score` 复用对应国家的演示分数。分类贡献、子维度、趋势和数据字典样例同属演示数据，不代表已经完成全量计算或历史损失校准。

共用说明位于 `src/data/poriDefinition.ts`，数据字典、lineage、地图 tooltip、国家详情、排行榜及 AI 指数口径回答均采用这一口径。下面的成本距离足迹提供单事件影响贡献，当前不直接生成国家 PORI。

### 成本距离影响足迹

重点项目和影响模拟器共用 `src/utils/costDistanceImpact.ts`：

- `impact(g) = strength × scaleWeight × exp(-c(e,g) / lambdaKm)`，`lambdaKm = halfDistanceKm / ln(2)`。
- `halfDistanceKm` 是成本半衰距离，不是地图半径。默认：社区/社会 ESG 25 km；供应链、能源、贸易、绿色/灾害与交通物流 75 km；政策、冲突及其他类型 200 km。事件可显式指定 `scale`、`halfDistanceKm`（大于 0 且不超过 200）、`strength`、`scaleWeight`（0–1）。
- 事件强度 `strength` 默认高/危急 1、中 0.75、低 0.5；单事件贡献系数保留内部字段名 `scaleWeight`，默认 1。现有尺度分组用于演示半衰距离，以上参数未使用历史损失校准，也不替代正式 PORI 的类别参数定义。
- 以事件为中心投影到约 5 km 的八邻域网格，使用 Dijkstra 最小累计成本。陆地阻力 1，原始铁路 GeoJSON 附近 7.5 km 阻力 0.45，跨国界增加 25 成本公里，国家面之外及面内孔洞不可通行。海岸事件所在格可连接相邻陆地。没有额外的道路、地形或实时交通数据。
- 绘制 `impact ≥ 0.1 / 0.25 / 0.5` 的嵌套 MultiPolygon，保留岛与孔洞；足迹面积为命中格数 × 25 km²。站点、矿产、物流和模拟资产的筛选与高亮均使用同一网格的 `impact ≥ 0.1`。
- 网格边界由 0.1 截止成本及最低阻力推导，超出边界返回 0。结果按事件坐标、强度、尺度参数及空间数据引用缓存；每组空间数据最多保留 12 个结果。两页共享数据请求与缓存。
- 模拟器中只有距离的演示资产按固定角度放置；这些示意坐标同时用于绘制和命中判断。人口和资产情景输入不代表实际损失。

验证命令（测试脚本使用 Node 24 的原生 TypeScript 支持）：

```bash
npm run test:impact
npm run typecheck:impact
npm run build
```

`typecheck:impact` 严格检查新增算法、加载器及事件数据；`build` 保持原有 `vite build`。项目全量 `tsc` 不在原有检查范围内；Track B 增加了包含新页面的 `typecheck:analysis`。

本地运行 `npm run dev`，打开 `/regional-insights` 与 `/impact-simulator`。选择不同铁路事件比较足迹；切换图层和打开站点详情应保留当前足迹，点击事件弹窗的 X 后足迹和受影响高亮应一起消失，项目仍保持选中。再切换事件或到影响模拟器，应使用对应事件的同一模型结果。

### 源码目录

```text
/src
  /app
    /components
      - Navigation.tsx             # 顶部导航栏
      - Root.tsx                   # 根布局组件
      /map
        - LeafletMap.tsx           # Leaflet 地图封装组件
      - CountryDetailsSidebar.tsx  # 国家详情侧边栏
    /pages
      - RiskSentimentIndex.tsx     # 风险情绪指数页面
      - ConflictEarlyWarning.tsx   # 冲突预警页面
      - ImpactSimulator.tsx        # 影响模拟器页面
      - RegionalInsights.tsx       # 重点项目与区域洞察页面
      - DataSources.tsx            # 数据中心页面
    - App.tsx                      # 应用入口
    - routes.tsx                   # 路由配置
  /data                            # 前端演示数据与知识库
  /hooks                           # 数据加载 hooks
  /styles                          # 全局样式与主题
  /utils                           # 静态 GeoJSON 数据加载工具
```

## 特色功能

- ✅ 响应式设计
- ✅ 流畅的页面切换动画
- ✅ 交互式数据可视化
- ✅ 专业的信息层级
- ✅ 高级的视觉效果
- ✅ 符合国际标准的设计语言

## 数据说明

当前版本使用模拟数据和静态 GeoJSON/JSON 数据进行展示。在实际部署中，可接入真实的数据源：

- 舆情数据 API
- 卫星图像分析
- 社交媒体监控
- 时间序列预测模型
- 地理信息系统（GIS）

## 许可证

专有软件 - 保留所有权利


## 事件研判（Track B 核心流程）

登录后打开 `/event-analysis`，或点击导航中的「事件研判」。输入中文、英文、法语或斯瓦希里语新闻（10–6000 字符），选择坦赞铁路 TAZARA，点击「开始研判」。四个按钮只填入虚构示例，所有结果仍由实际 API 抽取，未预置模型结果。

### 架构与工作流

`EventAnalysis.tsx` → `POST /api/analyze { mode: "extract", text, projectId: "tazara" }` → DeepSeek 严格 JSON 抽取 → 客户端地名解析与成本距离计算 → `POST /api/analyze { mode: "advise", computed }` → 基于计算结果生成建议。原有 AI 对话页仍为预设回答演示，已在顶部标注。

- 服务端：`api/analyze.ts` 是 Vercel Node 函数，直接调用 DeepSeek Chat Completions，无新增 SDK；仅补充 Node、React、Leaflet 类型依赖以严格检查 API、新页面与地图。模型 JSON 模式、temperature 0.1、AbortController 30 秒超时；Vercel 函数时限配置为 40 秒。`vercel.json` 的 SPA rewrite 排除 `/api` 与 `/api/*`。
- API 编译：`api/tsconfig.json` 使用 NodeNext 并将相对 `.ts` 导入改写为 `.js`；离线测试还会编译并加载处理函数及提示词，验证打包后的导入与返回契约。
- 提示词：`api/_prompts.ts` 单独导出抽取 / 建议指令，采用 TypeScript 字符串避免 Markdown 打包路径问题；`src/data/eventAnalysisSchema.ts` 共用现有三大类 15 项原名和运行时校验。原文引句、地名必须逐字出现在输入中；字段、标签、日期、坐标和建议条数均校验。
- 计算：`src/utils/eventAnalysis.ts` 复用 `costDistanceImpact.ts`、`loadTazaraData.ts` 与国家边界。地点按站点库（含中英文别名）、城市库、LLM 坐标依次解析；LLM 坐标标记低置信。多地点全部展示，本次仅计算首个可解析点，需人工核对其他地点，不能把多个足迹面积直接相加。
- 展示：`src/app/pages/EventAnalysis.tsx` 提供七步处理依据；`src/app/components/map/EventAnalysisMap.tsx` 复用 `ImpactFootprint`。物流资产使用 `src/data/logisticsAssets.ts` 中重点项目页既有静态目录，示意坐标不是实测资产；没有额外编造资产和损失。

### 环境变量与启动

使用 Node.js 24（测试依赖原生 TypeScript 支持）：

```bash
npm install --legacy-peer-deps
npm run dev
```

`npm run dev` **只启动前端**，不提供 `/api/analyze`。联调前后端可在已安装 Vercel CLI 的环境运行 `vercel dev`（仅本地，不执行 deploy）。使用已有本地项目配置即可；若 CLI 要求关联远程项目，请由维护者自行选择。

`.env.example` 仅包含变量名与非敏感默认模型名：

- `DEEPSEEK_API_KEY`：只在服务端进程环境中安全配置，必填；不使用 `VITE_` 前缀，不在浏览器输入，不写入源码、日志、提示词或版本库。
- `DEEPSEEK_MODEL`：可选，默认 `deepseek-chat`。

`.gitignore` 已忽略 `.env` 与 `.env.local`。仓库不包含任何 API key。本次实现没有写入或提供 key；未配置时返回 `503 / MISSING_API_KEY`，不会以示例结果代替。

在已安全配置进程环境变量的终端直接验证四个示例（不需要先启动 Vite / Vercel，也不会读取 `.env` 文件）：

```bash
node scripts/test-analyze-api.mjs
```

脚本直接调用真实 API 处理函数，逐条运行 extract，输出结构化摘要或明确错误；任一失败时退出码为 1，不打印 key。该命令会请求 DeepSeek；离线测试使用 `npm run test:analysis`，无需凭据。API 的缺少 key、上游异常、超时、无效 JSON 和 schema 校验失败都返回带 `error` / `code` 的 4xx/5xx；前端展示错误及重试，建议失败保留已完成的真实计算。

### 参数、口径与边界

- `SIGNAL_WEIGHTS`：`s_e = 0.4E + 0.3S + 0.3V`；C 的确认项只影响等级，不重复计入强度。
- `TAG_WEIGHTS`：15 类起步均为 1.0，**起步等权，待逻辑回归校准**。
- 衰减尺度复用现有映射：社会 ESG 25、供应链 / 能源 / 贸易 / 绿色 75、其他 200 成本公里的**半衰距离**，`λ = halfDistanceKm / ln(2)`；它不是半径，也不是直接将 25/75/200 当成 λ。
- `R = s_e × k_τ × exp(−c/λ)`；足迹 / 站点 / 物流命中使用实际 R ≥ 0.1。`L = max(沿线站点所在网格 impact_unit) × s_e × k_τ`，范围 0–1；impact_unit 的强度、类别权重为 1，避免把强度乘两次。采用原模型单位场 0.1 截止范围，范围外按 0 处理；L 可以小于 0.1，而实际足迹没有命中。
- 网格 5 km，陆地阻力 1，铁路阻力 0.45（缓冲 7.5 km），跨境加 25 成本公里，水域不可通行；详细模型见前文。参数可在相应常量与 `resolveImpactParameters` 调整，界面显示实际取值。
- `WARNING_THRESHOLDS`：L ≥ 0.5 高危、≥ 0.25 警惕、≥ 0.1 关注，否则无预警。confirmation=true 在基础等级上调一级，最高高危，L 本身不变。M 固定显示「需历史序列，暂不可计算」。这不是完整国家 PORI，也未做历史序列或损失校准。
- 置信度 < 0.6、非风险、地点 unresolved、仅有 LLM 坐标或多地点均给出人工复核原因。非风险事件不生成足迹、不计算 L，不把无法计算显示为 0 或无预警。地点不明也不推断落在坦赞铁路上。
- 人工可选择主标签、站点 / 城市或有效经纬度，并明确人工风险判定。「按修正重新计算」仅做客户端计算，保留原始抽取、引句、置信度和原始复核原因，并根据修正重算当前复核原因；低置信度仍显示「需人工复核」，标注「已人工修正」，清除旧建议；步骤 7 可单独生成新建议。没有修改信号的输入，若原文或信号有误应修改文本重新抽取。
- 虚构示例位于 `src/data/eventAnalysisSamples.ts`：Kasama 社区阻断；法语 Mbeya / Tunduma 燃油与通关；Dar es Salaam 文化节非风险；无明确地名的抗议。模型抽取有随机性，分类、引句、地点关联和人工修正均需最终复核。

验证：

```bash
npm run test:impact
npm run test:analysis
npm run typecheck:analysis
npm run build
```

新测试覆盖信号合成、等级阈值 / 确认上调、三种定位来源、unresolved、人工修正、非风险无足迹、低强度 L、真实铁路数据、API 契约 / 缺少凭据 / 上游异常 / JSON 解析失败 / 超时、四示例脚本和 rewrite。没有执行提交、推送或部署。

实现参考：[Vercel Node 函数](https://vercel.com/docs/functions/runtimes/node-js)、[Vercel rewrite 配置](https://vercel.com/docs/project-configuration/vercel-json#rewrites)、[DeepSeek JSON 输出](https://api-docs.deepseek.com/guides/json_mode/)。
