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
- 90 天趋势分析和 14 维度雷达图

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

### 成本距离影响足迹

重点项目和影响模拟器共用 `src/utils/costDistanceImpact.ts`：

- `impact(g) = strength × scaleWeight × exp(-c(e,g) / lambdaKm)`，`lambdaKm = halfDistanceKm / ln(2)`。
- `halfDistanceKm` 是成本半衰距离，不是地图半径。默认：社区/社会 ESG 25 km；供应链、能源、贸易、绿色/灾害与交通物流 75 km；政策、冲突及其他类型 200 km。事件可显式指定 `scale`、`halfDistanceKm`（大于 0 且不超过 200）、`strength`、`scaleWeight`（0–1）。
- 事件强度 `strength` 默认高/危急 1、中 0.75、低 0.5；尺度权重 `scaleWeight` 默认 1。以上均为演示假设，未使用历史损失校准。
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

`typecheck:impact` 严格检查新增算法、加载器及事件数据；`build` 保持原有 `vite build`。项目全量 `tsc` 仍有缺失 Leaflet 类型等历史问题。

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
