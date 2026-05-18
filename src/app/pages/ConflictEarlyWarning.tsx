import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { motion } from "motion/react";
import L from "leaflet";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Diamond,
  Droplets,
  Factory,
  Gauge,
  Gavel,
  Globe2,
  Landmark,
  MapPin,
  Mountain,
  RadioTower,
  Scale,
  ShieldAlert,
  Siren,
  Waves,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import LeafletMap, { CircleMarker, Marker, Polyline, Popup } from "../components/map";

type CaseLevel = "极高" | "高" | "中";
type CaseCategory = "环境事故" | "社会治安" | "政策合规" | "供应链" | "公共卫生" | "交通运输" | "经营管理";
type PageLevel = "overview" | "detail";
type DetailMode = "analysis" | "solution";
type LngLat = [number, number];

interface CaseItem {
  id: string;
  title: string;
  country: string;
  province: string;
  locationName: string;
  coordinates: LngLat;
  date: string;
  category: CaseCategory;
  level: CaseLevel;
  score: number;
  impact: string;
  summary: string;
  coordinateAccuracy: string;
  evidenceTags: string[];
  drivers: string[];
  chain: string[];
  recommendations: string[];
  stakeholders: string[];
  financials: {
    revenueH1UsdBn: number;
    profitH1UsdBn: number;
    claimTrustUsdBn: number;
    emergencyFundMinUsdMn: number;
    emergencyFundMaxUsdMn: number;
  };
}

const ESRI_TOPO_TILE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
const ESRI_IMAGERY_TILE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTRIBUTION =
  "Tiles &copy; Esri, HERE, Garmin, FAO, NOAA, USGS, OpenStreetMap contributors";
const OSM_STANDARD_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const OPEN_RAILWAY_TILE = "https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png";
const OPEN_RAILWAY_ATTRIBUTION = '&copy; <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>';

type CaseMapLayerId = "admin" | "geo" | "transport" | "mineral";

interface CaseMapLayerOption {
  id: CaseMapLayerId;
  label: string;
  tileUrl: string;
  tileAttribution: string;
  overlayTileUrl?: string;
  overlayTileAttribution?: string;
  overlayTileOpacity?: number;
}

const ADMIN_MAP_LAYER: CaseMapLayerOption = {
  id: "admin",
  label: "行政地图",
  tileUrl: ESRI_TOPO_TILE,
  tileAttribution: ESRI_ATTRIBUTION,
};

const CASE_MAP_LAYERS = {
  zambia: [
    ADMIN_MAP_LAYER,
    { id: "geo", label: "地理图", tileUrl: ESRI_IMAGERY_TILE, tileAttribution: ESRI_ATTRIBUTION },
  ],
  tanzania: [
    ADMIN_MAP_LAYER,
    {
      id: "transport",
      label: "铁路交通图",
      tileUrl: OSM_STANDARD_TILE,
      tileAttribution: OSM_ATTRIBUTION,
      overlayTileUrl: OPEN_RAILWAY_TILE,
      overlayTileAttribution: OPEN_RAILWAY_ATTRIBUTION,
      overlayTileOpacity: 0.85,
    },
  ],
  zimbabwe: [
    ADMIN_MAP_LAYER,
    { id: "mineral", label: "矿产通道图", tileUrl: ESRI_IMAGERY_TILE, tileAttribution: ESRI_ATTRIBUTION },
  ],
  rubaya: [
    ADMIN_MAP_LAYER,
    { id: "mineral", label: "矿产地形图", tileUrl: ESRI_IMAGERY_TILE, tileAttribution: ESRI_ATTRIBUTION },
  ],
} satisfies Record<string, CaseMapLayerOption[]>;

const CASE_POINT_ICON = L.divIcon({
  className: "case-point-marker",
  html: '<span class="case-point-marker-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const caseItems: CaseItem[] = [
  {
    id: "zambia-chambishi-tailings-2025",
    title: "赞比亚谦比希铜矿尾矿坝决堤事故",
    country: "赞比亚",
    province: "铜带省",
    locationName: "谦比希湿法冶炼厂尾矿坝",
    coordinates: [28.05, -12.65],
    date: "2025-02-18",
    category: "环境事故",
    level: "极高",
    score: 94,
    coordinateAccuracy: "矿区级估算坐标",
    impact: "酸性尾矿水外泄，波及姆旺巴希河与卡富埃河水系，触发环境修复、社区赔偿、复工审批和声誉风险。",
    summary:
      "该案例围绕赞比亚铜带省谦比希湿法冶炼有限公司尾矿坝溃决展开，事故后企业、政府、社区和媒体围绕污染范围、修复义务、赔偿安排和复工条件持续博弈。",
    evidenceTags: ["政府通告", "企业公告", "诉讼主张", "第三方/媒体"],
    drivers: ["防渗膜被盗割或受损", "连续强降雨抬高尾矿库水位", "矿区边缘安防冗余不足", "下游社区高度依赖河流水源"],
    chain: ["防渗系统失效", "雨水渗透增强", "坝体液化失稳", "尾矿坝决堤", "污染进入卡富埃水系"],
    recommendations: [
      "建立尾矿坝雨季红线阈值，联动降雨预报、水位、渗压、坝体位移和视频巡检数据。",
      "对下游水体、农田和取水点设置连续采样点，形成可公开披露的第三方监测链路。",
      "将社区赔付、健康筛查、临时供水和复耕安排纳入统一台账，按周更新进度。",
      "复工前完成独立工程评估、应急演练和政府验收，避免单纯依赖事后公关回应。",
    ],
    stakeholders: ["Sino Metals", "NFCA", "铜带省政府", "下游社区", "中资项目与供应链伙伴"],
    financials: {
      revenueH1UsdBn: 1.752,
      profitH1UsdBn: 0.371,
      claimTrustUsdBn: 80,
      emergencyFundMinUsdMn: 20,
      emergencyFundMaxUsdMn: 200,
    },
  },
  {
    id: "tanzania-dar-port-election-unrest-2025",
    title: "坦桑尼亚大选暴乱冲击达累斯萨拉姆港",
    country: "坦桑尼亚",
    province: "达累斯萨拉姆 / 坦赞走廊",
    locationName: "达累斯萨拉姆港",
    coordinates: [39.29, -6.82],
    date: "2025-10-29",
    category: "交通运输",
    level: "极高",
    score: 91,
    coordinateAccuracy: "港口级估算坐标",
    impact: "大选后抗议、断网和宵禁导致港口与仓储作业停摆，铜钴货物流向边境、铁路和替代港口倒灌，推高运费、滞期费和交付延误。",
    summary:
      "该案例围绕坦桑尼亚大选后骚乱波及达累斯萨拉姆港展开。港口作为非洲对华铜出口关键节点，因政治动荡出现短期停摆，刚果（金）、赞比亚矿企和中国冶炼端同时承压。",
    evidenceTags: ["港口通告", "政府宵禁", "供应链反馈", "开源航运数据"],
    drivers: ["大选争议引发抗议与骚乱", "全国断网造成港口状态黑箱", "达港承载约三分之二非洲对华铜出口", "替代港口容量和仓储弹性不足"],
    chain: ["大选争议", "抗议与宵禁", "港口闭库停摆", "边境与铁路倒灌", "铜钴出口中断", "冶炼端库存承压"],
    recommendations: [
      "在大选前后对港口、边境和铁路节点设置政治风险红线，提前锁定备用舱位和仓储空间。",
      "对达累斯萨拉姆、德班、沃尔维斯湾、贝拉港建立成本-时效-容量联动模型，避免集体改道造成二次拥堵。",
      "按货值和交付紧迫度拆分处置：高优货走空运或公路，大宗低优货暂存内陆仓库等待窗口恢复。",
      "自动归集宵禁令、闭库通知、航运异常和第三方报告，形成保险理赔与客户延期交付证明包。",
    ],
    stakeholders: ["阿达尼国际港口控股公司", "坦桑尼亚港务局", "中资矿企", "刚果（金）/赞比亚铜钴矿生产商", "中国冶炼厂"],
    financials: {
      revenueH1UsdBn: 0.92,
      profitH1UsdBn: 0.18,
      claimTrustUsdBn: 1.6,
      emergencyFundMinUsdMn: 15,
      emergencyFundMaxUsdMn: 80,
    },
  },
  {
    id: "zimbabwe-lithium-export-ban-2026",
    title: "津巴布韦锂精矿出口禁令冲击供应链",
    country: "津巴布韦",
    province: "哈拉雷 / 锂矿产区",
    locationName: "津巴布韦矿业部与锂矿出口通道",
    coordinates: [31.05, -17.83],
    date: "2026-02-25",
    category: "经营管理",
    level: "极高",
    score: 93,
    coordinateAccuracy: "国家政策节点估算坐标",
    impact: "矿业部突然暂停原矿及锂精矿出口，并覆盖在途货物，导致矿山库存积压、港口与边境扣押风险上升，中国锂盐和电池材料供应链被迫寻找替代来源。",
    summary:
      "该案例围绕津巴布韦提前实施锂精矿出口禁令展开。政府以本土加工、税收和就业留存为目标，采用即刻生效、覆盖在途货物的行政手段，打破企业对合同和过渡期的预期。",
    evidenceTags: ["矿业部通知", "政府公报", "媒体吹风", "企业物流反馈"],
    drivers: ["资源民族主义升温", "企业抢出口刺激政策突袭", "政府倒逼本地冶炼投资", "既有合同保护被行政命令穿透"],
    chain: ["政策吹风", "官方强监管语义升温", "企业抢运原矿", "出口禁令突袭", "在途货物受阻", "国内锂供应缺口扩大"],
    recommendations: [
      "对总统、矿业部长、议会和主流媒体建立政策语义监测，捕捉禁止出口、本土化加工、国家收入等高危词。",
      "在橙色预警期内清点在途货物和边境库存，对高价值精矿执行抢运或就地保全。",
      "同步启动澳大利亚、南美供应商备用采购计划，给国内冶炼端预留安全库存窗口。",
      "归集合规证明、纳税记录、政府沟通邮件和装运单据，为临时许可谈判、豁免申请或仲裁留证。",
    ],
    stakeholders: ["津巴布韦矿业部", "中矿资源", "盛新锂能", "本地贸易商", "中国锂盐与电池材料企业"],
    financials: {
      revenueH1UsdBn: 1.08,
      profitH1UsdBn: 0.24,
      claimTrustUsdBn: 0.85,
      emergencyFundMinUsdMn: 25,
      emergencyFundMaxUsdMn: 120,
    },
  },
  {
    id: "drc-rubaya-tantalum-collapse-2026",
    title: "刚果（金）鲁巴亚冲突矿产特大塌方",
    country: "刚果（金）",
    province: "北基伍省",
    locationName: "鲁巴亚钶钽矿区",
    coordinates: [28.86, -1.57],
    date: "2026-01-28",
    category: "供应链",
    level: "极高",
    score: 96,
    coordinateAccuracy: "矿区级估算坐标",
    impact: "连日强降雨叠加M23控制下的无序开采，引发矿区连环坍塌和救援受阻。事故造成重大人员伤亡，并使全球钽供应链出现短期缺口、价格波动和合规审查压力。",
    summary:
      "该案例围绕刚果（金）北基伍省鲁巴亚钶钽矿区特大塌方展开。鲁巴亚供应全球超过15%的钽资源，矿区在武装割据、掠夺性征税和无支护开采下长期高危，强降雨成为触发连环坍塌的导火索。",
    evidenceTags: ["气象预警", "社群线索", "卫星影像", "人权/供应链报告"],
    drivers: ["极端降雨软化地质结构", "M23控制矿区并以矿养战", "矿坑超员和无支护平行开挖", "救援通道被武装冲突和道路破坏阻断"],
    chain: ["强降雨", "矿井渗水与土质松软", "无序开采结构失稳", "连环坍塌", "救援受阻", "钽供应链休克"],
    recommendations: [
      "将极端降雨、矿井渗水抱怨、道路通行和夜光遥感纳入鲁巴亚矿区红色预警模型。",
      "对正规企业、NGO和外派人员提前发布撤离与人道主义风险提示，避免进入M23控制区。",
      "下游采购商立即锁定巴西、澳大利亚等合规替代供应，并核算品位差异带来的有效金属缺口。",
      "自动生成供应链风险排除报告，证明未采购受灾非法区域矿石，降低血钽舆情和合规风险。",
    ],
    stakeholders: ["当地社区/矿工", "全球科技产业链", "M23运动", "合规采购企业", "人道主义组织"],
    financials: {
      revenueH1UsdBn: 1.35,
      profitH1UsdBn: 0.29,
      claimTrustUsdBn: 2.4,
      emergencyFundMinUsdMn: 30,
      emergencyFundMaxUsdMn: 180,
    },
  },
];

const demoCaseItems: CaseItem[] = [
  {
    id: "mali-gold-mine-kidnap-2025",
    title: "马里南部金矿营地遭武装绑架",
    country: "马里",
    province: "锡卡索大区",
    locationName: "布谷尼金矿带",
    coordinates: [-7.48, 11.42],
    date: "2025-07-23",
    category: "社会治安",
    level: "高",
    score: 88,
    coordinateAccuracy: "矿区级估算坐标",
    impact: "极端组织袭击矿区营地，影响中资小型矿山人员安全和运营连续性。",
    summary: "该案例围绕马里南部金矿营地绑架事件展开，反映极端组织对偏远矿区人员、设备和赎金链条的持续威胁。",
    evidenceTags: ["前方线索", "社区数据"],
    drivers: ["极端组织活动", "矿区安保薄弱"],
    chain: ["武装渗透", "营地袭击", "人员绑架"],
    recommendations: ["提高矿区安保等级"],
    stakeholders: ["矿企", "当地社区"],
    financials: { revenueH1UsdBn: 0.18, profitH1UsdBn: 0.03, claimTrustUsdBn: 0.2, emergencyFundMinUsdMn: 5, emergencyFundMaxUsdMn: 20 },
  },
  {
    id: "nigeria-edo-convoy-ambush-2025",
    title: "尼日利亚埃多州中企车队遭伏击",
    country: "尼日利亚",
    province: "埃多州",
    locationName: "Edelstine矿区通勤道路",
    coordinates: [5.91, 6.32],
    date: "2025-09-05",
    category: "社会治安",
    level: "高",
    score: 86,
    coordinateAccuracy: "道路节点估算坐标",
    impact: "车队遭伏击并造成安保人员伤亡，暴露矿区通勤路线和护卫协同风险。",
    summary: "该案例围绕矿区员工通勤车队遭伏击展开，适用于评估道路安保、护送频率和路线暴露度。",
    evidenceTags: ["开源媒体", "前方线索"],
    drivers: ["道路伏击", "护卫路线固定"],
    chain: ["车队出行", "路段伏击", "人员绑架"],
    recommendations: ["调整通勤路线和出行窗口"],
    stakeholders: ["中资项目", "安保单位"],
    financials: { revenueH1UsdBn: 0.22, profitH1UsdBn: 0.04, claimTrustUsdBn: 0.12, emergencyFundMinUsdMn: 3, emergencyFundMaxUsdMn: 15 },
  },
  {
    id: "cameroon-mines-community-arson-2025",
    title: "喀麦隆金矿遭社区纵火抗议",
    country: "喀麦隆",
    province: "阿达马瓦区",
    locationName: "Tignere金矿区",
    coordinates: [12.65, 7.37],
    date: "2025-11-04",
    category: "环境事故",
    level: "高",
    score: 82,
    coordinateAccuracy: "社区级估算坐标",
    impact: "当地居民纵火焚毁矿区设施，资源收益分配和社区关系成为主要矛盾。",
    summary: "该案例围绕矿区社区抗议与纵火事件展开，用于展示本地化ESG和社区沟通缺口风险。",
    evidenceTags: ["开源媒体", "社区舆情"],
    drivers: ["资源分配不满", "社区关系紧张"],
    chain: ["不满聚集", "抗议升级", "设施损毁"],
    recommendations: ["建立社区收益沟通机制"],
    stakeholders: ["矿企", "社区代表"],
    financials: { revenueH1UsdBn: 0.12, profitH1UsdBn: 0.02, claimTrustUsdBn: 0.08, emergencyFundMinUsdMn: 2, emergencyFundMaxUsdMn: 12 },
  },
  {
    id: "guinea-doko-gold-robbery-2025",
    title: "几内亚多科金矿遭武装抢劫",
    country: "几内亚",
    province: "康康大区",
    locationName: "Doko金矿区",
    coordinates: [-9.38, 11.67],
    date: "2025-04-03",
    category: "社会治安",
    level: "高",
    score: 79,
    coordinateAccuracy: "矿区级估算坐标",
    impact: "武装人员进入金矿抢夺黄金并造成外籍员工受伤，现场内线风险上升。",
    summary: "该案例用于展示黄金矿区盗抢、内外勾连和夜间安防薄弱带来的直接安全威胁。",
    evidenceTags: ["开源媒体"],
    drivers: ["武装抢劫", "内线引导"],
    chain: ["内线泄露", "夜间突袭", "黄金被盗"],
    recommendations: ["强化矿区出入和夜间巡检"],
    stakeholders: ["矿企", "安保团队"],
    financials: { revenueH1UsdBn: 0.1, profitH1UsdBn: 0.02, claimTrustUsdBn: 0.06, emergencyFundMinUsdMn: 2, emergencyFundMaxUsdMn: 8 },
  },
  {
    id: "egypt-suez-route-delay-2026",
    title: "苏伊士航线政治管控导致货期延误",
    country: "埃及",
    province: "苏伊士运河",
    locationName: "苏伊士运河通道",
    coordinates: [32.55, 29.97],
    date: "2026-03-18",
    category: "交通运输",
    level: "中",
    score: 71,
    coordinateAccuracy: "通道级估算坐标",
    impact: "航线通行窗口收紧，企业出口计划面临排队、绕航和仓储成本上升。",
    summary: "该案例展示关键海运咽喉节点政策管控对交付周期和替代航线成本的影响。",
    evidenceTags: ["航运数据", "通道监测"],
    drivers: ["通行管控", "航线拥堵"],
    chain: ["政策收紧", "排队增加", "货期延误"],
    recommendations: ["预留绕航和仓储弹性"],
    stakeholders: ["货代", "出口企业"],
    financials: { revenueH1UsdBn: 0.3, profitH1UsdBn: 0.06, claimTrustUsdBn: 0.04, emergencyFundMinUsdMn: 4, emergencyFundMaxUsdMn: 18 },
  },
  {
    id: "kenya-mombasa-port-strike-2026",
    title: "肯尼亚蒙巴萨港罢工扰动东非物流",
    country: "肯尼亚",
    province: "蒙巴萨",
    locationName: "蒙巴萨港",
    coordinates: [39.67, -4.04],
    date: "2026-01-14",
    category: "交通运输",
    level: "高",
    score: 80,
    coordinateAccuracy: "港口级估算坐标",
    impact: "港口装卸效率下降，东非内陆项目物资交付周期延长。",
    summary: "该案例展示劳资罢工和港口效率波动对工程项目设备进口的连锁影响。",
    evidenceTags: ["港口通告", "物流反馈"],
    drivers: ["劳资冲突", "港口拥堵"],
    chain: ["罢工动员", "作业下降", "货物滞留"],
    recommendations: ["提前锁定替代堆场"],
    stakeholders: ["港务局", "承包商"],
    financials: { revenueH1UsdBn: 0.4, profitH1UsdBn: 0.08, claimTrustUsdBn: 0.05, emergencyFundMinUsdMn: 6, emergencyFundMaxUsdMn: 20 },
  },
  {
    id: "south-africa-power-shortage-2026",
    title: "南非限电冲击工业园连续生产",
    country: "南非",
    province: "豪登省",
    locationName: "约翰内斯堡工业带",
    coordinates: [28.04, -26.2],
    date: "2026-02-09",
    category: "经营管理",
    level: "中",
    score: 68,
    coordinateAccuracy: "城市级估算坐标",
    impact: "持续限电压缩工厂产能，备用电力成本和交付违约风险同步上升。",
    summary: "该案例用于展示本地生产要素波动对海外园区经营管理的影响。",
    evidenceTags: ["电力公告", "企业反馈"],
    drivers: ["电力短缺", "能源成本上升"],
    chain: ["限电", "产能下降", "交付推迟"],
    recommendations: ["配置备用能源和排产策略"],
    stakeholders: ["园区企业", "电力公司"],
    financials: { revenueH1UsdBn: 0.8, profitH1UsdBn: 0.12, claimTrustUsdBn: 0.03, emergencyFundMinUsdMn: 8, emergencyFundMaxUsdMn: 30 },
  },
  {
    id: "mozambique-cabo-delgado-insurgency-2026",
    title: "莫桑比克北部武装活动威胁能源项目",
    country: "莫桑比克",
    province: "德尔加杜角省",
    locationName: "帕尔马能源项目区",
    coordinates: [40.48, -10.77],
    date: "2026-04-02",
    category: "社会治安",
    level: "高",
    score: 84,
    coordinateAccuracy: "项目区估算坐标",
    impact: "武装活动靠近能源项目区，外派人员撤离和承包商复工面临不确定性。",
    summary: "该案例展示恐怖主义和地方武装活动对大型能源项目的持续扰动。",
    evidenceTags: ["安全通报", "开源事件"],
    drivers: ["武装活动", "人员撤离"],
    chain: ["袭扰升级", "项目停工", "复工延期"],
    recommendations: ["动态调整安保等级"],
    stakeholders: ["能源企业", "承包商"],
    financials: { revenueH1UsdBn: 1.1, profitH1UsdBn: 0.18, claimTrustUsdBn: 0.09, emergencyFundMinUsdMn: 12, emergencyFundMaxUsdMn: 60 },
  },
  {
    id: "ghana-cocoa-export-tax-2026",
    title: "加纳出口税调整影响原料采购成本",
    country: "加纳",
    province: "阿散蒂大区",
    locationName: "库马西贸易节点",
    coordinates: [-1.62, 6.69],
    date: "2026-03-05",
    category: "政策合规",
    level: "中",
    score: 66,
    coordinateAccuracy: "城市级估算坐标",
    impact: "出口税率调整推高原料采购成本，合同价格重谈压力上升。",
    summary: "该案例用于展示财政压力下的贸易政策调整对企业采购和合同履约的影响。",
    evidenceTags: ["政策公告", "贸易数据"],
    drivers: ["税率调整", "财政压力"],
    chain: ["税负上升", "成本传导", "合同重谈"],
    recommendations: ["加入税费浮动条款"],
    stakeholders: ["采购企业", "供应商"],
    financials: { revenueH1UsdBn: 0.25, profitH1UsdBn: 0.05, claimTrustUsdBn: 0.02, emergencyFundMinUsdMn: 3, emergencyFundMaxUsdMn: 10 },
  },
  {
    id: "ethiopia-industrial-park-unrest-2026",
    title: "埃塞工业园劳资纠纷引发停工",
    country: "埃塞俄比亚",
    province: "奥罗米亚州",
    locationName: "工业园区",
    coordinates: [38.76, 8.98],
    date: "2026-01-27",
    category: "经营管理",
    level: "中",
    score: 70,
    coordinateAccuracy: "园区级估算坐标",
    impact: "劳资纠纷导致短期停工，订单交付和本地雇佣关系承压。",
    summary: "该案例展示海外园区人力资源管理、工会沟通和薪酬预期差带来的运营风险。",
    evidenceTags: ["园区反馈", "社交媒体"],
    drivers: ["劳资纠纷", "工资预期"],
    chain: ["不满积累", "停工抗议", "交付延误"],
    recommendations: ["建立工会沟通窗口"],
    stakeholders: ["园区企业", "员工组织"],
    financials: { revenueH1UsdBn: 0.32, profitH1UsdBn: 0.04, claimTrustUsdBn: 0.03, emergencyFundMinUsdMn: 4, emergencyFundMaxUsdMn: 12 },
  },
  {
    id: "uganda-border-clearance-delay-2026",
    title: "乌干达边境清关延误影响工程设备入场",
    country: "乌干达",
    province: "东部边境",
    locationName: "马拉巴口岸",
    coordinates: [34.28, 0.64],
    date: "2026-02-21",
    category: "交通运输",
    level: "中",
    score: 64,
    coordinateAccuracy: "口岸级估算坐标",
    impact: "清关政策临时收紧，工程设备在边境滞留并产生仓储费用。",
    summary: "该案例展示跨境口岸政策调整和通关效率变化对项目进度的影响。",
    evidenceTags: ["清关通告", "物流反馈"],
    drivers: ["口岸政策", "单证审查"],
    chain: ["审查加强", "边境滞留", "工期顺延"],
    recommendations: ["提前校核单证和备用口岸"],
    stakeholders: ["工程承包商", "货代"],
    financials: { revenueH1UsdBn: 0.2, profitH1UsdBn: 0.03, claimTrustUsdBn: 0.02, emergencyFundMinUsdMn: 2, emergencyFundMaxUsdMn: 9 },
  },
  {
    id: "angola-forex-control-2026",
    title: "安哥拉外汇管制影响利润汇回",
    country: "安哥拉",
    province: "罗安达",
    locationName: "罗安达金融节点",
    coordinates: [13.23, -8.83],
    date: "2026-04-11",
    category: "政策合规",
    level: "中",
    score: 69,
    coordinateAccuracy: "城市级估算坐标",
    impact: "外汇审批和资本汇出窗口收紧，企业现金流计划受到影响。",
    summary: "该案例用于展示跨境金融和资本管制对海外经营回款的影响。",
    evidenceTags: ["央行政策", "企业反馈"],
    drivers: ["外汇短缺", "审批收紧"],
    chain: ["管制升级", "汇出延后", "现金流承压"],
    recommendations: ["建立本地资金池和汇率对冲"],
    stakeholders: ["财务部门", "银行"],
    financials: { revenueH1UsdBn: 0.55, profitH1UsdBn: 0.1, claimTrustUsdBn: 0.04, emergencyFundMinUsdMn: 5, emergencyFundMaxUsdMn: 20 },
  },
  {
    id: "senegal-election-protest-2026",
    title: "塞内加尔选举抗议波及中资商圈",
    country: "塞内加尔",
    province: "达喀尔",
    locationName: "达喀尔商贸区",
    coordinates: [-17.45, 14.69],
    date: "2026-03-22",
    category: "社会治安",
    level: "中",
    score: 72,
    coordinateAccuracy: "城区级估算坐标",
    impact: "选举抗议造成商圈临时停业，仓储和门店安保压力上升。",
    summary: "该案例展示政治周期事件向商业街区和侨商资产扩散的风险路径。",
    evidenceTags: ["社交媒体", "当地新闻"],
    drivers: ["选举争议", "街头抗议"],
    chain: ["集会动员", "道路封锁", "商圈停业"],
    recommendations: ["制定门店闭店和人员撤离预案"],
    stakeholders: ["商户", "安保人员"],
    financials: { revenueH1UsdBn: 0.18, profitH1UsdBn: 0.03, claimTrustUsdBn: 0.01, emergencyFundMinUsdMn: 2, emergencyFundMaxUsdMn: 8 },
  },
  {
    id: "algeria-import-license-review-2026",
    title: "阿尔及利亚进口许可证审查趋严",
    country: "阿尔及利亚",
    province: "阿尔及尔",
    locationName: "进口许可证审批节点",
    coordinates: [3.06, 36.75],
    date: "2026-02-03",
    category: "政策合规",
    level: "中",
    score: 63,
    coordinateAccuracy: "国家政策节点估算坐标",
    impact: "进口许可审查延长，设备入境和经销商库存补充受到影响。",
    summary: "该案例展示准入许可和行政审批变动对企业市场进入的影响。",
    evidenceTags: ["政策公告", "企业反馈"],
    drivers: ["准入审查", "行政审批"],
    chain: ["审查趋严", "许可延迟", "库存不足"],
    recommendations: ["提前准备许可证材料"],
    stakeholders: ["经销商", "法务合规"],
    financials: { revenueH1UsdBn: 0.35, profitH1UsdBn: 0.07, claimTrustUsdBn: 0.02, emergencyFundMinUsdMn: 3, emergencyFundMaxUsdMn: 11 },
  },
  {
    id: "morocco-phosphate-logistics-2026",
    title: "摩洛哥磷矿外运铁路节点拥堵",
    country: "摩洛哥",
    province: "卡萨布兰卡-塞塔特",
    locationName: "磷矿铁路外运节点",
    coordinates: [-7.62, 33.59],
    date: "2026-05-06",
    category: "交通运输",
    level: "中",
    score: 61,
    coordinateAccuracy: "铁路节点估算坐标",
    impact: "铁路调度拥堵导致磷矿外运时效下降，港口装船计划延后。",
    summary: "该案例展示矿产铁路和港口协同效率对大宗资源出口的影响。",
    evidenceTags: ["铁路调度", "港口反馈"],
    drivers: ["铁路拥堵", "港口排期"],
    chain: ["调度延迟", "港口积压", "船期后移"],
    recommendations: ["优化铁路-港口装卸窗口"],
    stakeholders: ["矿企", "物流公司"],
    financials: { revenueH1UsdBn: 0.5, profitH1UsdBn: 0.09, claimTrustUsdBn: 0.02, emergencyFundMinUsdMn: 4, emergencyFundMaxUsdMn: 14 },
  },
  {
    id: "libya-oil-terminal-security-2026",
    title: "利比亚油港安全局势影响装船",
    country: "利比亚",
    province: "锡尔特湾",
    locationName: "油品出口终端",
    coordinates: [19.58, 30.49],
    date: "2026-01-31",
    category: "供应链",
    level: "高",
    score: 81,
    coordinateAccuracy: "港区级估算坐标",
    impact: "油港周边安全事件导致装船窗口不稳定，能源贸易履约风险上升。",
    summary: "该案例展示能源出口终端安全局势对供应链连续性的影响。",
    evidenceTags: ["安全事件", "航运反馈"],
    drivers: ["地方武装", "港区管控"],
    chain: ["冲突靠近", "装船暂停", "贸易延期"],
    recommendations: ["设置能源装船风险阈值"],
    stakeholders: ["能源企业", "贸易商"],
    financials: { revenueH1UsdBn: 1.2, profitH1UsdBn: 0.2, claimTrustUsdBn: 0.08, emergencyFundMinUsdMn: 10, emergencyFundMaxUsdMn: 45 },
  },
  {
    id: "namibia-uranium-water-risk-2026",
    title: "纳米比亚铀矿水资源约束引发运营风险",
    country: "纳米比亚",
    province: "埃龙戈区",
    locationName: "斯瓦科普蒙德矿业带",
    coordinates: [14.52, -22.68],
    date: "2026-04-24",
    category: "环境事故",
    level: "中",
    score: 65,
    coordinateAccuracy: "矿业带估算坐标",
    impact: "水资源约束和环保审批趋严，矿山扩产和社区关系面临压力。",
    summary: "该案例展示矿业项目在干旱地区面临的水资源、环保审批和社区沟通风险。",
    evidenceTags: ["环境审批", "社区反馈"],
    drivers: ["水资源紧张", "环保审批"],
    chain: ["取水受限", "扩产放缓", "社区质疑"],
    recommendations: ["建设水资源压力监测模型"],
    stakeholders: ["矿企", "监管机构"],
    financials: { revenueH1UsdBn: 0.42, profitH1UsdBn: 0.08, claimTrustUsdBn: 0.03, emergencyFundMinUsdMn: 4, emergencyFundMaxUsdMn: 16 },
  },
  {
    id: "botswana-diamond-export-review-2026",
    title: "博茨瓦纳钻石出口审查影响结算周期",
    country: "博茨瓦纳",
    province: "哈博罗内",
    locationName: "钻石贸易监管节点",
    coordinates: [25.91, -24.65],
    date: "2026-02-17",
    category: "政策合规",
    level: "中",
    score: 60,
    coordinateAccuracy: "城市级估算坐标",
    impact: "钻石出口审查和来源证明要求提高，贸易结算周期延长。",
    summary: "该案例用于展示资源出口合规审查对贸易单证、结算和客户交付的影响。",
    evidenceTags: ["监管公告", "贸易单据"],
    drivers: ["来源审查", "合规单证"],
    chain: ["审查加强", "结算延后", "客户交付延迟"],
    recommendations: ["提前完善来源证明链"],
    stakeholders: ["贸易商", "合规部门"],
    financials: { revenueH1UsdBn: 0.28, profitH1UsdBn: 0.06, claimTrustUsdBn: 0.02, emergencyFundMinUsdMn: 3, emergencyFundMaxUsdMn: 9 },
  },
  {
    id: "rwanda-data-localization-2026",
    title: "卢旺达数据本地化要求影响云服务部署",
    country: "卢旺达",
    province: "基加利",
    locationName: "基加利数字监管节点",
    coordinates: [30.06, -1.95],
    date: "2026-03-13",
    category: "政策合规",
    level: "中",
    score: 62,
    coordinateAccuracy: "城市级估算坐标",
    impact: "数据本地化要求提高，跨境云服务和客户数据处理需重新设计架构。",
    summary: "该案例展示数字主权和跨境数据合规对平台型企业部署模式的影响。",
    evidenceTags: ["数据政策", "合规审查"],
    drivers: ["数据本地化", "监管审查"],
    chain: ["政策发布", "架构调整", "合规成本上升"],
    recommendations: ["建设本地化数据分区方案"],
    stakeholders: ["云服务商", "合规团队"],
    financials: { revenueH1UsdBn: 0.16, profitH1UsdBn: 0.04, claimTrustUsdBn: 0.01, emergencyFundMinUsdMn: 2, emergencyFundMaxUsdMn: 7 },
  },
  {
    id: "cote-divoire-port-congestion-2026",
    title: "科特迪瓦阿比让港拥堵影响设备进口",
    country: "科特迪瓦",
    province: "阿比让",
    locationName: "阿比让港",
    coordinates: [-4.03, 5.32],
    date: "2026-04-08",
    category: "交通运输",
    level: "中",
    score: 67,
    coordinateAccuracy: "港口级估算坐标",
    impact: "港口排队和清关拥堵导致工程设备入场延后，项目施工计划被迫调整。",
    summary: "该案例展示西非港口拥堵对中资工程项目设备交付的影响。",
    evidenceTags: ["港口数据", "清关反馈"],
    drivers: ["港口拥堵", "清关延迟"],
    chain: ["船舶排队", "设备滞留", "工期延误"],
    recommendations: ["提前锁定堆场和备用船期"],
    stakeholders: ["工程企业", "货代"],
    financials: { revenueH1UsdBn: 0.31, profitH1UsdBn: 0.05, claimTrustUsdBn: 0.02, emergencyFundMinUsdMn: 3, emergencyFundMaxUsdMn: 12 },
  },
  {
    id: "sudan-border-conflict-supply-risk-2026",
    title: "苏丹边境冲突扰动人道物资通道",
    country: "苏丹",
    province: "喀土穆周边",
    locationName: "人道物资通道",
    coordinates: [32.56, 15.5],
    date: "2026-01-19",
    category: "公共卫生",
    level: "高",
    score: 83,
    coordinateAccuracy: "区域级估算坐标",
    impact: "边境冲突导致人道物资通道不稳定，医疗和生活物资配送受阻。",
    summary: "该案例展示武装冲突对公共卫生、物资保障和企业人员撤离通道的影响。",
    evidenceTags: ["冲突事件", "人道通报"],
    drivers: ["边境冲突", "道路封锁"],
    chain: ["冲突升级", "通道受阻", "物资短缺"],
    recommendations: ["建立撤离和物资替代通道"],
    stakeholders: ["NGO", "外派人员"],
    financials: { revenueH1UsdBn: 0.08, profitH1UsdBn: 0.01, claimTrustUsdBn: 0.02, emergencyFundMinUsdMn: 4, emergencyFundMaxUsdMn: 18 },
  },
];

const waterQualityTimeline = [
  { label: "事故发生", date: "2月18日", ph: "异常", metal: "超标", tone: "critical" },
  { label: "应急处置", date: "3月", ph: "波动", metal: "高位", tone: "warning" },
  { label: "后续通告", date: "8-9月", ph: "回落", metal: "回落", tone: "normal" },
];

const sentimentDimensions = [
  { name: "就业不满", value: 78, risk: "高风险" },
  { name: "环境焦虑", value: 86, risk: "极高" },
  { name: "赔偿预期", value: 83, risk: "高风险" },
  { name: "政府信任受损", value: 72, risk: "高风险" },
  { name: "安全秩序压力", value: 68, risk: "中高" },
];

const solutionTrendData = [
  { date: "2/04", actual: 34 },
  { date: "2/08", actual: 38 },
  { date: "2/12", actual: 45 },
  { date: "2/16", actual: 56 },
  { date: "2/18", actual: 64, predicted: 64 },
  { date: "2/20", predicted: 72 },
  { date: "2/24", predicted: 81 },
  { date: "2/28", predicted: 86 },
  { date: "3/04", predicted: 78 },
  { date: "3/08", predicted: 70 },
];

const communitySources = ["刺猬安全社群", "Facebook本地群组", "WhatsApp群聊", "本地论坛", "新闻评论"];

const rootCauseCards = [
  {
    title: "矿企入驻挤压本地就业机会",
    contribution: 64,
    detail: "二期项目外地技术工招聘讨论量激增，本地青年将其解释为“利益外流”。",
  },
  {
    title: "环境焦虑向就业议题叠加",
    contribution: 21,
    detail: "粉尘、水质、尾矿库排水被用作放大不满的共同叙事。",
  },
  {
    title: "信息不对称导致谣言扩散",
    contribution: 15,
    detail: "企业招募规则、岗位比例和技能门槛缺少本地可理解的解释。",
  },
];

const actionPlans = [
  {
    title: "稳住社区预期",
    timing: "24小时内",
    owner: "公共事务 + 社区联络",
    objective: "先降低对抗性情绪，避免议题从环保扩散到停工、封路和索赔动员。",
    actions: ["公布临时供水与健康筛查安排", "邀请村镇代表进入现场沟通机制", "每日固定时间披露修复进度"],
  },
  {
    title: "修复工程可信化",
    timing: "72小时内",
    owner: "EHS + 工程承包商",
    objective: "把企业处置从“口头承诺”转成可验证的工程动作，重建政府和社区信任。",
    actions: ["引入第三方采样与水质公开表", "拆分尾矿坝封堵、排水、清淤节点", "形成可追踪的复工前验收清单"],
  },
  {
    title: "法务与赔付分层",
    timing: "7日内",
    owner: "法务 + 财务 + 保险",
    objective: "区分紧急救助、事实核验、诉讼谈判，避免一次性把全部诉求推入对抗轨道。",
    actions: ["先行设置紧急救助窗口", "建立受影响农户登记台账", "同步启动保险与责任边界核验"],
  },
];

const ownershipNodes = [
  {
    name: "中国有色矿业有限公司",
    detail: "港交所上市母公司，H股代码 1258.HK",
    tone: "parent",
  },
  {
    name: "Sino-Metals Leach Zambia",
    detail: "谦比希湿法冶炼主体，直接涉事/被告",
    tone: "defendant",
  },
  {
    name: "NFC Africa Mining",
    detail: "谦比希矿区相关主体，直接涉诉/被告",
    tone: "defendant",
  },
];

const toLeafletPoint = ([lng, lat]: LngLat): [number, number] => [lat, lng];

const detailCaseIds = new Set(caseItems.map((item) => item.id));

const caseTypeStyles: Record<CaseCategory, { marker: string; bg: string; text: string; border: string }> = {
  环境事故: { marker: "#16A34A", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  社会治安: { marker: "#DC2626", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  政策合规: { marker: "#7C3AED", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  供应链: { marker: "#F59E0B", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  公共卫生: { marker: "#0891B2", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  交通运输: { marker: "#005BBB", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  经营管理: { marker: "#475569", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

const caseCategoryOrder: CaseCategory[] = ["社会治安", "交通运输", "政策合规", "供应链", "经营管理", "环境事故", "公共卫生"];

function CaseMapLayerSwitch({
  layers,
  activeLayerId,
  onChange,
}: {
  layers: CaseMapLayerOption[];
  activeLayerId: CaseMapLayerId;
  onChange: (layerId: CaseMapLayerId) => void;
}) {
  return (
    <div className="absolute right-3 top-3 z-[500] flex rounded-lg border border-gray-200 bg-white/95 p-1 shadow-sm">
      {layers.map((layer) => (
        <button
          key={layer.id}
          type="button"
          onClick={() => onChange(layer.id)}
          className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
            activeLayerId === layer.id ? "bg-[#005BBB] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
          }`}
        >
          {layer.label}
        </button>
      ))}
    </div>
  );
}

export default function ConflictEarlyWarning() {
  const [selectedCase, setSelectedCase] = useState<CaseItem>(caseItems[0]);
  const [pageLevel, setPageLevel] = useState<PageLevel>("overview");
  const [isCaseLibraryOpen, setIsCaseLibraryOpen] = useState(true);

  const overviewCases = useMemo(() => [...caseItems, ...demoCaseItems.sort((a, b) => b.score - a.score)], []);
  const highRiskCount = useMemo(() => overviewCases.filter((item) => item.level === "极高" || item.level === "高").length, [overviewCases]);

  const handleSelectCase = (item: CaseItem) => {
    setSelectedCase(item);
    if (detailCaseIds.has(item.id)) {
      setPageLevel("detail");
    }
  };

  if (pageLevel === "detail") {
    return <CaseDetailDashboard selectedCase={selectedCase} onBack={() => setPageLevel("overview")} />;
  }

  return (
    <div className="h-[calc(100vh-73px)] overflow-hidden bg-[#F6F8FA]">
      <div className="flex h-full">
        <aside className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ${isCaseLibraryOpen ? "w-[372px]" : "w-[76px]"}`}>
          <div className={`border-b border-gray-100 ${isCaseLibraryOpen ? "px-5 py-5" : "px-3 py-4"}`}>
            <div className={`mb-4 flex items-center ${isCaseLibraryOpen ? "justify-between" : "justify-center"}`}>
              {isCaseLibraryOpen ? (
                <>
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-5 w-5 text-[#005BBB]" />
                      <h2 className="text-lg font-semibold text-gray-900">案例分析</h2>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">在线权威底图驱动的事件案例库</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCaseLibraryOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                    aria-label="收起案例库"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCaseLibraryOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-[#005BBB] hover:bg-blue-50"
                  aria-label="展开案例库"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {isCaseLibraryOpen ? (
              <div className="grid grid-cols-3 gap-2">
                <OverviewMetric label="案例" value={overviewCases.length.toString()} />
                <OverviewMetric label="在线底图" value="Esri" />
                <OverviewMetric label="高风险" value={highRiskCount.toString()} />
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg font-semibold text-[#005BBB]">{overviewCases.length}</div>
                <div className="text-[11px] text-gray-500">案例</div>
              </div>
            )}
          </div>

          {isCaseLibraryOpen ? (
            <div className="flex-1 overflow-y-auto p-3">
              {overviewCases.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCase(item)}
                  whileHover={{ x: 3 }}
                  className={`mb-2 w-full rounded-lg border p-3 text-left transition-all ${
                    selectedCase.id === item.id ? "border-[#005BBB] bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${caseTypeStyles[item.category].bg} ${caseTypeStyles[item.category].text} ${caseTypeStyles[item.category].border} border`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">{item.title}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.country} · {item.province}
                      </div>
                    </div>
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs leading-5 text-gray-600">{item.summary}</p>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 justify-center p-3">
              <button
                type="button"
                onClick={() => setIsCaseLibraryOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white"
                aria-label="展开案例列表"
              >
                {overviewCases.length}
              </button>
            </div>
          )}
        </aside>

        <main className="relative flex-1">
          <CaseOverviewMap cases={overviewCases} selectedCase={selectedCase} onSelectCase={handleSelectCase} />
        </main>
      </div>
    </div>
  );
}

function OverviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
      <div className="text-base font-semibold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  );
}

function CaseTypeLegend() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="mb-2 text-xs font-semibold text-gray-600">颜色说明</div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2">
        {caseCategoryOrder.map((category) => {
          const style = caseTypeStyles[category];
          return (
            <div key={category} className="flex items-center gap-2 text-xs text-gray-700">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: style.marker }}
              />
              <span>{category}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CaseOverviewMap({
  cases,
  selectedCase,
  onSelectCase,
}: {
  cases: CaseItem[];
  selectedCase: CaseItem;
  onSelectCase: (item: CaseItem) => void;
}) {
  return (
    <div className="relative h-full w-full">
      <LeafletMap
        center={[20, 0]}
        zoom={4}
        minZoom={3}
        maxZoom={9}
        tileUrl={ESRI_TOPO_TILE}
        tileAttribution={ESRI_ATTRIBUTION}
      >
        {cases.map((item) => {
          const isSelected = item.id === selectedCase.id;
          const typeStyle = caseTypeStyles[item.category];
          return (
            <CircleMarker
              key={item.id}
              center={toLeafletPoint(item.coordinates)}
              radius={isSelected ? 11 : 9}
              pathOptions={{
                color: "#FFFFFF",
                weight: 3,
                fillColor: typeStyle.marker,
                fillOpacity: 0.95,
              }}
              eventHandlers={{
                click: () => onSelectCase(item),
                mouseover: (event) => event.target.openPopup(),
                mouseout: (event) => event.target.closePopup(),
              }}
            >
              <Popup closeButton={false} autoPan={false} className="case-map-popup">
                <div className="w-64">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeStyle.bg} ${typeStyle.text}`}>{item.category}</span>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">{item.level}</span>
                    <span className="text-[11px] text-gray-500">{item.date}</span>
                  </div>
                  <div className="text-sm font-semibold leading-5 text-gray-900">{item.title}</div>
                  <p className="mt-1 text-xs leading-5 text-gray-600">{item.summary}</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {item.locationName} · {item.coordinateAccuracy}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </LeafletMap>
      <div className="pointer-events-none absolute bottom-6 left-6 z-[500]">
        <CaseTypeLegend />
      </div>
    </div>
  );
}

function CaseDetailDashboard({ selectedCase, onBack }: { selectedCase: CaseItem; onBack: () => void }) {
  const [detailMode, setDetailMode] = useState<DetailMode>("analysis");

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col overflow-hidden bg-[#F4F6F8]">
      <header className="flex h-[84px] flex-shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-5">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="返回案例库"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">{selectedCase.category}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <CalendarDays className="h-3.5 w-3.5" />
                {selectedCase.date}
              </span>
            </div>
            <h1 className="truncate text-xl font-semibold text-gray-950">{selectedCase.title}</h1>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setDetailMode("analysis")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                detailMode === "analysis" ? "bg-white text-[#005BBB] shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              事件分析
            </button>
            <button
              type="button"
              onClick={() => setDetailMode("solution")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                detailMode === "solution" ? "bg-white text-[#005BBB] shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              解决方案
            </button>
          </div>
        </div>
      </header>

      {detailMode === "analysis" ? <EventAnalysisColumns selectedCase={selectedCase} /> : <SolutionColumns selectedCase={selectedCase} />}
    </div>
  );
}

function EventAnalysisColumns({ selectedCase }: { selectedCase: CaseItem }) {
  if (selectedCase.id === "tanzania-dar-port-election-unrest-2025") {
    return <TransportEventAnalysisColumns selectedCase={selectedCase} />;
  }
  if (selectedCase.id === "zimbabwe-lithium-export-ban-2026") {
    return <LithiumEventAnalysisColumns selectedCase={selectedCase} />;
  }
  if (selectedCase.id === "drc-rubaya-tantalum-collapse-2026") {
    return <RubayaEventAnalysisColumns selectedCase={selectedCase} />;
  }

  return (
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(310px,0.95fr)_minmax(500px,1.38fr)_minmax(330px,1fr)] gap-3 p-3">
        <DashboardColumn
          eyebrow="事故原因"
          title=""
          description=""
        >
          <DamMechanismDiagram />
          <CauseCouplingBoard selectedCase={selectedCase} />
          <CommunityPerceptionGapBoard />
        </DashboardColumn>

        <DashboardColumn
          eyebrow="损失主体"
          title=""
          description=""
          prominent
        >
          <SpatialAssetMap selectedCase={selectedCase} />
          <OwnershipTree />
          <FinancialResilienceBoard selectedCase={selectedCase} />
        </DashboardColumn>

        <DashboardColumn
          eyebrow="不良后果"
          title=""
          description=""
        >
          <LegalBlackSwanBoard selectedCase={selectedCase} />
          <EnvironmentalImpactBoard selectedCase={selectedCase} />
          <WaterQualitySimulator />
        </DashboardColumn>
      </div>
  );
}

function SolutionColumns({ selectedCase }: { selectedCase: CaseItem }) {
  if (selectedCase.id === "tanzania-dar-port-election-unrest-2025") {
    return <TransportSolutionColumns selectedCase={selectedCase} />;
  }
  if (selectedCase.id === "zimbabwe-lithium-export-ban-2026") {
    return <LithiumSolutionColumns selectedCase={selectedCase} />;
  }
  if (selectedCase.id === "drc-rubaya-tantalum-collapse-2026") {
    return <RubayaSolutionColumns selectedCase={selectedCase} />;
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(310px,0.95fr)_minmax(500px,1.38fr)_minmax(330px,1fr)] gap-3 p-3">
      <DashboardColumn
        eyebrow="预测"
        title="14天走势"
        description=""
      >
        <ForecastTrendBoard />
        <AiForecastAlert />
      </DashboardColumn>

      <DashboardColumn
        eyebrow="态势"
        title="社区情绪"
        description=""
        prominent
      >
        <CommunitySentimentBoard selectedCase={selectedCase} />
        <RootCauseDiagnosisBoard />
      </DashboardColumn>

      <DashboardColumn
        eyebrow="企业应对"
        title="推荐方案"
        description=""
      >
        <ActionRecommendationBoard />
        <RecommendedSolutionBoard selectedCase={selectedCase} />
      </DashboardColumn>
    </div>
  );
}

const transportRiskFactors = [
  { label: "大选争议", value: "主要反对党候选人被取消资格后，抗议、骚乱和宵禁迅速扩散。" },
  { label: "节点集中", value: "达累斯萨拉姆港承载约三分之二非洲对华铜出口，路径依赖过高。" },
  { label: "断网黑箱", value: "互联网封锁削弱港口状态、仓储安全和解封时间的实时可见性。" },
];

const transportImpactRows = [
  { label: "出口中断", value: "铜钴货流停摆", percent: 88, color: "bg-red-700" },
  { label: "改道耗时", value: "+7-14天", percent: 66, color: "bg-amber-500" },
  { label: "运费溢价", value: "+15%-25%", percent: 54, color: "bg-[#005BBB]" },
];

const routeOptions = [
  { route: "原地等待达港恢复", time: "5-9天", cost: "低", fit: "大宗低优货" },
  { route: "改道德班港", time: "12-18天", cost: "高", fit: "谨慎使用" },
  { route: "沃尔维斯湾/贝拉港", time: "10-16天", cost: "中高", fit: "小批量分流" },
  { route: "空运/公路急运", time: "1-4天", cost: "极高", fit: "高价值钴/急单" },
];

const transportForecastData = [
  { date: "10/22", actual: 38 },
  { date: "10/25", actual: 46 },
  { date: "10/28", actual: 58 },
  { date: "10/29", actual: 71, predicted: 71 },
  { date: "11/01", predicted: 84 },
  { date: "11/04", predicted: 89 },
  { date: "11/07", predicted: 76 },
  { date: "11/10", predicted: 62 },
];

function TransportEventAnalysisColumns({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(310px,0.95fr)_minmax(500px,1.38fr)_minmax(330px,1fr)] gap-3 p-3">
      <DashboardColumn eyebrow="风险源" title="" description="">
        <ElectionUnrestBoard />
        <PortSinglePointBoard selectedCase={selectedCase} />
        <InformationBlackoutBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="损失主体" title="" description="" prominent>
        <TransitRouteMapBoard selectedCase={selectedCase} />
        <SupplyChainStakeholderBoard selectedCase={selectedCase} />
        <TransportCostBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="不良后果" title="" description="">
        <CopperExportImpactBoard selectedCase={selectedCase} />
        <DominoBackflowBoard />
        <DecisionParalysisBoard />
      </DashboardColumn>
    </div>
  );
}

function TransportSolutionColumns({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(310px,0.95fr)_minmax(500px,1.38fr)_minmax(330px,1fr)] gap-3 p-3">
      <DashboardColumn eyebrow="预测" title="港口停摆预警" description="">
        <TransportForecastBoard />
        <TransportRiskSignalBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="智能决策" title="动态路由" description="" prominent>
        <DynamicRoutingBoard />
        <MixedStrategyBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="企业应对" title="存证与理赔" description="">
        <InsuranceEvidenceBoard />
        <TransportActionBoard selectedCase={selectedCase} />
        <RecommendedSolutionBoard selectedCase={selectedCase} />
      </DashboardColumn>
    </div>
  );
}

function ElectionUnrestBoard() {
  return (
    <PanelCard icon={AlertTriangle} title="宏观政治导火索" accent="red">
      <div className="rounded-lg border border-red-100 bg-red-50 p-3">
        <div className="text-xs font-semibold text-red-800">2025年10月底至11月初</div>
        <p className="mt-2 text-sm leading-6 text-red-950">
          大选后争议引发抗议和骚乱，政府实施全国断网与无限期宵禁，港口、仓储和城市通勤同步受压。
        </p>
      </div>
      <div className="mt-3 space-y-2">
        {transportRiskFactors.map((item) => (
          <TriggerFactor key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </PanelCard>
  );
}

function PortSinglePointBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={Gauge} title="单点故障" accent="yellow">
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="对华铜出口" value="约67%" detail="流经达港" danger />
        <KpiTile label="替代路线" value="3条" detail="容量均受限" />
        <KpiTile label="停摆窗口" value="1-2周" detail="事件持续期" />
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-600">
        {selectedCase.locationName}的效率优势带来路径锁定。一旦港口闭库或城市交通失序，刚果（金）和赞比亚铜钴出口缺少即时可用的冗余通道。
      </p>
    </PanelCard>
  );
}

function InformationBlackoutBoard() {
  return (
    <PanelCard icon={RadioTower} title="信息黑箱" accent="slate">
      <div className="grid grid-cols-2 gap-2">
        {["货柜是否安全", "仓库是否闭库", "船期何时恢复", "边境是否放行"].map((item) => (
          <div key={item} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
            {item}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
        断网和宵禁削弱一线状态回传，企业只能按最坏情形备货、抢舱或抛售，进一步放大市场波动。
      </div>
    </PanelCard>
  );
}

function TransitRouteMapBoard({ selectedCase }: { selectedCase: CaseItem }) {
  const layerOptions = CASE_MAP_LAYERS.tanzania;
  const [activeLayerId, setActiveLayerId] = useState<CaseMapLayerId>("admin");
  const activeLayer = layerOptions.find((layer) => layer.id === activeLayerId) ?? layerOptions[0];

  return (
    <PanelCard icon={MapPin} title="物流通道定位" accent="blue">
      <div className="relative h-[336px] overflow-hidden rounded-lg border border-gray-200 bg-slate-100">
        <LeafletMap
          center={selectedCase.coordinates}
          zoom={7}
          minZoom={4}
          maxZoom={8}
          tileUrl={activeLayer.tileUrl}
          tileAttribution={activeLayer.tileAttribution}
          overlayTileUrl={activeLayer.overlayTileUrl}
          overlayTileAttribution={activeLayer.overlayTileAttribution}
          overlayTileOpacity={activeLayer.overlayTileOpacity}
        >
          <Marker position={toLeafletPoint(selectedCase.coordinates)} icon={CASE_POINT_ICON}>
            <Popup>
              <div className="text-sm font-semibold text-gray-900">达累斯萨拉姆港</div>
              <div className="text-xs text-gray-500">关键出海口 / 港口停摆节点</div>
            </Popup>
          </Marker>
          {[
            { name: "赞比亚铜带", point: [28.2, -12.9] as LngLat },
            { name: "刚果（金）矿区", point: [27.5, -11.6] as LngLat },
            { name: "坦赞边境", point: [32.77, -9.33] as LngLat },
          ].map((node) => (
            <CircleMarker
              key={node.name}
              center={toLeafletPoint(node.point)}
              radius={7}
              pathOptions={{ color: "#FFFFFF", weight: 2, fillColor: "#F59E0B", fillOpacity: 0.95 }}
            >
              <Popup>{node.name}</Popup>
            </CircleMarker>
          ))}
        </LeafletMap>
        <div className="absolute left-3 top-3 z-[500] rounded-lg bg-white/95 px-3 py-2 shadow-sm">
          <div className="text-xs font-semibold text-gray-950">坦赞走廊 · 铜钴外运链路</div>
        </div>
        <CaseMapLayerSwitch layers={layerOptions} activeLayerId={activeLayerId} onChange={setActiveLayerId} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MapBadge label="关键节点" value="达累斯萨拉姆港" />
        <MapBadge label="影响链路" value="矿山-边境-铁路/公路-港口" />
      </div>
    </PanelCard>
  );
}

function SupplyChainStakeholderBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={Building2} title="受影响主体" accent="blue">
      <div className="space-y-2">
        {selectedCase.stakeholders.map((stakeholder, index) => (
          <div key={stakeholder} className={`rounded-lg border px-3 py-2 ${index < 2 ? "border-blue-100 bg-blue-50" : "border-amber-100 bg-amber-50"}`}>
            <div className="text-sm font-semibold text-gray-950">{stakeholder}</div>
            <div className="mt-1 text-[11px] text-gray-600">{index < 2 ? "港口运营与监管节点" : "供应链承压主体"}</div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function TransportCostBoard() {
  return (
    <PanelCard icon={BarChart3} title="成本与时效冲击" accent="green">
      <div className="space-y-3">
        {transportImpactRows.map((row) => (
          <ImpactCompareRow key={row.label} {...row} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <KpiTile label="替代路线耗时" value="+7-14天" detail="南部非洲港口" />
        <KpiTile label="紧急订舱溢价" value="15%-25%" detail="运力紧张期" danger />
      </div>
    </PanelCard>
  );
}

function CopperExportImpactBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={Diamond} title="铜出口中断" accent="red">
      <div className="rounded-lg border border-red-200 bg-red-950 p-4 text-white">
        <div className="text-xs text-red-100">区域物流大动脉栓塞</div>
        <div className="mt-3 text-3xl font-semibold">达港关闭</div>
        <div className="mt-1 text-sm text-red-100">非洲铜钴货流向内陆和替代港口倒灌</div>
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-600">{selectedCase.impact}</p>
    </PanelCard>
  );
}

function DominoBackflowBoard() {
  return (
    <PanelCard icon={ArrowRight} title="内陆倒灌效应" accent="yellow">
      <div className="space-y-2">
        {["港口停摆", "边境堆场滞留", "列车/卡车占用", "空箱空车无法回流", "矿山发货端二次瘫痪"].map((item, index, array) => (
          <div key={item}>
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">{item}</div>
            {index < array.length - 1 && <div className="flex h-5 items-center justify-center text-gray-300"><ArrowRight className="h-3.5 w-3.5 rotate-90" /></div>}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function DecisionParalysisBoard() {
  return (
    <PanelCard icon={ShieldAlert} title="传统模式局限" accent="slate">
      <div className="space-y-2">
        <TriggerFactor label="预防" value="重商业成本、轻地缘冗余，缺少常态化备用通道。" />
        <TriggerFactor label="监测" value="依赖官方通报，断网和宵禁期间进入黑箱期。" />
        <TriggerFactor label="处置" value="贸易商集中涌向替代港口，形成羊群效应和二次拥堵。" />
      </div>
    </PanelCard>
  );
}

function TransportForecastBoard() {
  return (
    <PanelCard icon={BarChart3} title="停摆风险走势" accent="blue">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">物流关键节点风险指数</div>
          <div className="mt-1 text-2xl font-semibold text-gray-950">89</div>
          <div className="mt-1 text-[11px] text-gray-500">骚乱后高点</div>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-right">
          <div className="text-[11px] text-red-700">预警建议</div>
          <div className="text-xl font-semibold text-red-800">红色</div>
          <div className="mt-1 text-[11px] text-red-700">提前7天锁定备用运力</div>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={transportForecastData} margin={{ top: 26, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={[20, 95]} tick={{ fontSize: 10 }} />
            <ChartTooltip formatter={(value) => [`${value}/100`, "节点风险指数"]} />
            <ReferenceLine x="10/29" stroke="#DC2626" strokeDasharray="4 4" label={{ value: "大选日", position: "insideTop", fill: "#DC2626", fontSize: 10, dy: -16 }} />
            <Line type="monotone" dataKey="actual" name="选前监测" stroke="#005BBB" strokeWidth={2.5} dot={{ r: 2.5, fill: "#005BBB" }} connectNulls />
            <Line type="monotone" dataKey="predicted" name="封港后研判" stroke="#DC2626" strokeWidth={2.5} strokeDasharray="7 7" dot={{ r: 2.5, fill: "#DC2626" }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </PanelCard>
  );
}

function TransportRiskSignalBoard() {
  return (
    <PanelCard icon={Activity} title="预警信号" accent="red">
      <div className="space-y-2">
        <TriggerFactor label="社媒动员" value="反对派支持者出现封路、抵制投票和港区聚集相关讨论。" />
        <TriggerFactor label="历史相关" value="抗议与港口罢工/封锁在历史案例中高度相关，触发联动预警。" />
        <TriggerFactor label="节点脆弱" value="达港高集中度使港口异常直接映射到铜钴出口中断。" />
      </div>
    </PanelCard>
  );
}

function DynamicRoutingBoard() {
  return (
    <PanelCard icon={MapPin} title="动态路由评估" accent="blue">
      <div className="grid grid-cols-2 gap-2">
        {routeOptions.map((option) => (
          <div key={option.route} className="rounded-lg border border-gray-100 bg-white p-3">
            <div className="text-sm font-semibold text-gray-950">{option.route}</div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-gray-600">
              <span>时效：{option.time}</span>
              <span>成本：{option.cost}</span>
              <span>{option.fit}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
        当达港预计停运约5天时，全量改道德班可能造成更长总时效。模型建议按货值、交期和港口容量拆分。
      </div>
    </PanelCard>
  );
}

function MixedStrategyBoard() {
  return (
    <PanelCard icon={Scale} title="推荐混合策略" accent="green">
      <div className="space-y-3">
        {[
          { title: "高优先级急单", detail: "采用空运或高成本公路运输，确保客户交付和冶炼端关键批次不断供。" },
          { title: "大宗低优货物", detail: "暂留赞比亚或刚果（金）内陆仓，等待达港恢复，避免挤入德班拥堵。" },
          { title: "小批量分流", detail: "按容量窗口切入沃尔维斯湾或贝拉港，控制替代港口仓储压力。" },
        ].map((item, index) => (
          <div key={item.title} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="text-sm font-semibold text-gray-950">方案{index + 1}：{item.title}</div>
            <p className="mt-2 text-xs leading-5 text-gray-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function InsuranceEvidenceBoard() {
  return (
    <PanelCard icon={Gavel} title="可信存证" accent="slate">
      <div className="grid grid-cols-2 gap-2">
        {["宵禁令原文", "港口闭库通知", "人权/伤亡报告", "AIS航迹异常"].map((item) => (
          <div key={item} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
            {item}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
        系统自动打包不可抗力证据和运输延迟记录，用于营业中断险、货运延迟险和客户延期交付说明。
      </div>
    </PanelCard>
  );
}

function TransportActionBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={RadioTower} title="处置清单" accent="green">
      <div className="space-y-2">
        {selectedCase.recommendations.map((item) => (
          <div key={item} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-700">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
            {item}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

const lithiumRiskFactors = [
  { label: "政策突袭", value: "矿业部将全面禁令从2027年提前到2026年2月，并宣布即刻暂停出口。" },
  { label: "抢运反噬", value: "企业误判过渡期，集中加速原矿出口，被政府解读为资源掠夺。" },
  { label: "本土化倒逼", value: "政府借禁令推动选矿、冶炼和就业留在本国，提升谈判筹码。" },
];

const apriiDimensions = [
  { name: "官方语义强度", value: 88, weight: "40%" },
  { name: "本土舆论热度", value: 76, weight: "30%" },
  { name: "社群动员指数", value: 69, weight: "30%" },
];

const lithiumForecastData = [
  { date: "2/04", actual: 35 },
  { date: "2/11", actual: 49 },
  { date: "2/18", actual: 67 },
  { date: "2/25", actual: 91, predicted: 91 },
  { date: "3/05", predicted: 86 },
  { date: "3/18", predicted: 78 },
  { date: "4/02", predicted: 64 },
  { date: "4/15", predicted: 52 },
];

const lithiumAlternateSuppliers = [
  { source: "澳大利亚锂精矿", leadTime: "2-4周", cost: "高", use: "主力替代" },
  { source: "南美盐湖资源", leadTime: "4-8周", cost: "中高", use: "中期补口" },
  { source: "国内库存调拨", leadTime: "1-7天", cost: "中", use: "短期保供" },
  { source: "本地加工谈判", leadTime: "1-3月", cost: "不确定", use: "政策换许可" },
];

function LithiumEventAnalysisColumns({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(310px,0.95fr)_minmax(500px,1.38fr)_minmax(330px,1fr)] gap-3 p-3">
      <DashboardColumn eyebrow="风险源" title="" description="">
        <PolicyShockBoard />
        <ResourceNationalismBoard />
        <ContractRelianceBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="损失主体" title="" description="" prominent>
        <LithiumSupplyMapBoard selectedCase={selectedCase} />
        <LithiumStakeholderBoard selectedCase={selectedCase} />
        <InTransitTrapBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="不良后果" title="" description="">
        <LithiumSupplyBreakBoard selectedCase={selectedCase} />
        <TraditionalPolicyBlindspotBoard />
        <LithiumMarketPressureBoard />
      </DashboardColumn>
    </div>
  );
}

function LithiumSolutionColumns({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(310px,0.95fr)_minmax(500px,1.38fr)_minmax(330px,1fr)] gap-3 p-3">
      <DashboardColumn eyebrow="预测" title="APRII共振指数" description="">
        <ApriiIndexBoard />
        <LithiumPolicyForecastBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="智能决策" title="供应链替代" description="" prominent>
        <LithiumAlternativeBoard />
        <LithiumEmergencyStrategyBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="企业应对" title="合规存证" description="">
        <LithiumEvidenceBoard />
        <LithiumActionBoard selectedCase={selectedCase} />
        <RecommendedSolutionBoard selectedCase={selectedCase} />
      </DashboardColumn>
    </div>
  );
}

function PolicyShockBoard() {
  return (
    <PanelCard icon={AlertTriangle} title="政策突袭" accent="red">
      <div className="rounded-lg border border-red-100 bg-red-50 p-3">
        <div className="text-xs font-semibold text-red-800">2026年2月25日 · 即刻生效</div>
        <p className="mt-2 text-sm leading-6 text-red-950">
          津巴布韦突然暂停原矿及锂精矿出口，连在途货物也被纳入管制，企业原本预期的2027年缓冲期被压缩为零。
        </p>
      </div>
      <div className="mt-3 space-y-2">
        {lithiumRiskFactors.map((item) => (
          <TriggerFactor key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </PanelCard>
  );
}

function ResourceNationalismBoard() {
  return (
    <PanelCard icon={Landmark} title="资源民族主义" accent="yellow">
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="政策目标" value="本土加工" detail="选矿/冶炼留在当地" danger />
        <KpiTile label="谈判筹码" value="禁令" detail="换取建厂承诺" />
        <KpiTile label="参照路径" value="印尼镍" detail="资源换产业链" />
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-600">
        政府不再满足于原矿出口税收，而是希望通过行政命令重塑利润分配，把更多加工、就业和财政收益留在国内。
      </p>
    </PanelCard>
  );
}

function ContractRelianceBoard() {
  return (
    <PanelCard icon={Gavel} title="合同信赖失效" accent="slate">
      <div className="space-y-2">
        <TriggerFactor label="传统假设" value="企业认为采矿合同和既有协议可保护出口安排。" />
        <TriggerFactor label="现实冲击" value="行政命令直接覆盖贸易流，合同保护难以抵消政策突袭。" />
        <TriggerFactor label="关键教训" value="法律文本必须叠加政治风向、民意和财政压力监测。" />
      </div>
    </PanelCard>
  );
}

function LithiumSupplyMapBoard({ selectedCase }: { selectedCase: CaseItem }) {
  const layerOptions = CASE_MAP_LAYERS.zimbabwe;
  const [activeLayerId, setActiveLayerId] = useState<CaseMapLayerId>("admin");
  const activeLayer = layerOptions.find((layer) => layer.id === activeLayerId) ?? layerOptions[0];
  const mineNodes = [
    { name: "哈拉雷政策节点", point: selectedCase.coordinates, tone: "#DC2626" },
    { name: "Bikita锂矿区", point: [31.62, -20.1] as LngLat, tone: "#F59E0B" },
    { name: "Arcadia锂项目", point: [31.18, -17.78] as LngLat, tone: "#F59E0B" },
    { name: "贝拉港方向", point: [34.84, -19.83] as LngLat, tone: "#005BBB" },
  ];
  const route: [number, number][] = [[-20.1, 31.62], [-18.5, 32.4], [-19.83, 34.84]];

  return (
    <PanelCard icon={MapPin} title="锂供应链定位" accent="blue">
      <div className="relative h-[336px] overflow-hidden rounded-lg border border-gray-200 bg-slate-100">
        <LeafletMap
          center={[32.2, -19.0]}
          zoom={6}
          minZoom={4}
          maxZoom={8}
          tileUrl={activeLayer.tileUrl}
          tileAttribution={activeLayer.tileAttribution}
          overlayTileUrl={activeLayer.overlayTileUrl}
          overlayTileAttribution={activeLayer.overlayTileAttribution}
          overlayTileOpacity={activeLayer.overlayTileOpacity}
        >
          <Polyline positions={route} pathOptions={{ color: "#005BBB", weight: 3, dashArray: "6 6" }} />
          {mineNodes.map((node) => (
            <CircleMarker
              key={node.name}
              center={toLeafletPoint(node.point)}
              radius={node.name === "哈拉雷政策节点" ? 9 : 7}
              pathOptions={{ color: "#FFFFFF", weight: 2, fillColor: node.tone, fillOpacity: 0.95 }}
            >
              <Popup>{node.name}</Popup>
            </CircleMarker>
          ))}
        </LeafletMap>
        <div className="absolute left-3 top-3 z-[500] rounded-lg bg-white/95 px-3 py-2 shadow-sm">
          <div className="text-xs font-semibold text-gray-950">津巴布韦 · 锂矿-边境-港口链路</div>
        </div>
        <CaseMapLayerSwitch layers={layerOptions} activeLayerId={activeLayerId} onChange={setActiveLayerId} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MapBadge label="政策节点" value="哈拉雷 / 矿业部" />
        <MapBadge label="影响链路" value="矿区-边境-贝拉港-中国冶炼端" />
      </div>
    </PanelCard>
  );
}

function LithiumStakeholderBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={Building2} title="受影响主体" accent="blue">
      <div className="space-y-2">
        {selectedCase.stakeholders.map((stakeholder, index) => (
          <div key={stakeholder} className={`rounded-lg border px-3 py-2 ${index === 0 ? "border-red-100 bg-red-50" : "border-blue-100 bg-blue-50"}`}>
            <div className="text-sm font-semibold text-gray-950">{stakeholder}</div>
            <div className="mt-1 text-[11px] text-gray-600">{index === 0 ? "政策制定与许可节点" : "供应链与谈判承压主体"}</div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function InTransitTrapBoard() {
  return (
    <PanelCard icon={ShieldAlert} title="在途货物陷阱" accent="red">
      <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-950">
        禁令覆盖已装车、已到边境或已抵港的锂精矿，货物可能被扣押、退回矿区或转为临时许可谈判筹码。
      </div>
      <div className="mt-3 space-y-2">
        <ImpactCompareRow label="滞箱/仓储费" value="快速累积" percent={68} color="bg-red-700" />
        <ImpactCompareRow label="物流空驶" value="往返损耗" percent={52} color="bg-amber-500" />
        <ImpactCompareRow label="合同交付" value="延期违约" percent={78} color="bg-[#005BBB]" />
      </div>
    </PanelCard>
  );
}

function LithiumSupplyBreakBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={Diamond} title="锂供应链断裂" accent="red">
      <div className="rounded-lg border border-red-200 bg-red-950 p-4 text-white">
        <div className="text-xs text-red-100">经营管理场景</div>
        <div className="mt-3 text-3xl font-semibold">出口禁令</div>
        <div className="mt-1 text-sm text-red-100">锂矿库存、贸易合同和中国冶炼端同步承压</div>
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-600">{selectedCase.impact}</p>
    </PanelCard>
  );
}

function TraditionalPolicyBlindspotBoard() {
  return (
    <PanelCard icon={Scale} title="传统模式局限" accent="slate">
      <div className="space-y-2">
        <TriggerFactor label="预防" value="重合同审核、轻政治风向，低估资源民族主义。" />
        <TriggerFactor label="监测" value="等待政府公报时，禁令往往已经即刻生效。" />
        <TriggerFactor label="处置" value="事后赴哈拉雷游说，缺少筹码，只能建厂、罚款或争取临时许可。" />
      </div>
    </PanelCard>
  );
}

function LithiumMarketPressureBoard() {
  return (
    <PanelCard icon={BarChart3} title="市场与库存压力" accent="yellow">
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="政策窗口" value="72小时" detail="正式文件前的抢运期" danger />
        <KpiTile label="配额松动" value="4月" detail="禁令后谈判窗口" />
        <KpiTile label="进口地位" value="第二大" detail="中国锂精矿来源" />
        <KpiTile label="核心风险" value="缺口" detail="冶炼端补库压力" />
      </div>
    </PanelCard>
  );
}

function ApriiIndexBoard() {
  const score = Math.round(apriiDimensions.reduce((sum, item) => sum + item.value * (Number.parseInt(item.weight) / 100), 0));
  return (
    <PanelCard icon={Activity} title="APRII共振指数" accent="blue">
      <div className="grid grid-cols-[160px_1fr] gap-4">
        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
          <div className="text-xs font-semibold text-red-700">当前读数</div>
          <div className="mt-3 text-5xl font-semibold text-gray-950">{score}</div>
          <div className="mt-1 text-xs text-gray-600">红色区间 / 政策突变迫近</div>
        </div>
        <div className="space-y-3">
          {apriiDimensions.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">{item.name}</span>
                <span className="text-gray-500">权重{item.weight} · {item.value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div className={`${item.value >= 85 ? "bg-red-600" : "bg-amber-500"} h-full rounded-full`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
        APRII同时捕捉官方强监管语义与本土舆论、社群动员的共振。官方表态和民间情绪同频时，指数会快速抬升。
      </div>
    </PanelCard>
  );
}

function LithiumPolicyForecastBoard() {
  return (
    <PanelCard icon={BarChart3} title="政策风险走势" accent="red">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lithiumForecastData} margin={{ top: 26, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={[20, 100]} tick={{ fontSize: 10 }} />
            <ChartTooltip formatter={(value) => [`${value}/100`, "APRII"]} />
            <ReferenceLine x="2/25" stroke="#DC2626" strokeDasharray="4 4" label={{ value: "禁令", position: "insideTop", fill: "#DC2626", fontSize: 10, dy: -16 }} />
            <Line type="monotone" dataKey="actual" name="政策语义监测" stroke="#005BBB" strokeWidth={2.5} dot={{ r: 2.5, fill: "#005BBB" }} connectNulls />
            <Line type="monotone" dataKey="predicted" name="禁令后研判" stroke="#DC2626" strokeWidth={2.5} strokeDasharray="7 7" dot={{ r: 2.5, fill: "#DC2626" }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
        系统在正式禁令前2-3周给出橙色预警，建议加速出货、冻结新增长单并启动替代采购。
      </div>
    </PanelCard>
  );
}

function LithiumAlternativeBoard() {
  return (
    <PanelCard icon={MapPin} title="替代供应模拟" accent="blue">
      <div className="grid grid-cols-2 gap-2">
        {lithiumAlternateSuppliers.map((option) => (
          <div key={option.source} className="rounded-lg border border-gray-100 bg-white p-3">
            <div className="text-sm font-semibold text-gray-950">{option.source}</div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-gray-600">
              <span>{option.leadTime}</span>
              <span>成本：{option.cost}</span>
              <span>{option.use}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
        最优策略不是单纯抢运，而是“高价值精矿抢运 + 国内库存调拨 + 澳大利亚替代长单”组合。
      </div>
    </PanelCard>
  );
}

function LithiumEmergencyStrategyBoard() {
  return (
    <PanelCard icon={Scale} title="最后72小时策略" accent="green">
      <div className="space-y-3">
        {[
          { title: "抢运高价值批次", detail: "优先处理已装车、近边境和高品位精矿，降低在途货物被扣押概率。" },
          { title: "暂停低确定性新单", detail: "冻结尚未取得出口许可的新增合同，避免继续积累违约风险。" },
          { title: "谈判本地加工承诺", detail: "用本地选矿、冶炼投资计划换取临时出口配额或过渡许可。" },
        ].map((item, index) => (
          <div key={item.title} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="text-sm font-semibold text-gray-950">动作{index + 1}：{item.title}</div>
            <p className="mt-2 text-xs leading-5 text-gray-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function LithiumEvidenceBoard() {
  return (
    <PanelCard icon={Gavel} title="合规证据链" accent="slate">
      <div className="grid grid-cols-2 gap-2">
        {["合规出口证明", "纳税记录", "政府沟通邮件", "装运与边境单据"].map((item) => (
          <div key={item} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
            {item}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
        证据链用于证明企业善意履约，支撑临时许可、豁免、赔偿谈判或国际仲裁。
      </div>
    </PanelCard>
  );
}

function LithiumActionBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={RadioTower} title="处置清单" accent="green">
      <div className="space-y-2">
        {selectedCase.recommendations.map((item) => (
          <div key={item} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-700">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
            {item}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

const rubayaImpactRows = [
  { subject: "当地社区/矿工", loss: "生命灾难", result: "至少300人遇难，其中包括近70名未成年人；未注册矿工较多，真实伤亡可能更高。" },
  { subject: "全球科技产业链", loss: "供应冲击", result: "鲁巴亚供应全球超过15%的钽资源，停产引发钽精矿缺口、价格波动和电子产业原料压力。" },
  { subject: "M23运动", loss: "资金打击", result: "矿区停采切断重要资金来源，可能促使武装组织采取更激进的掠夺行动。" },
  { subject: "合规企业", loss: "声誉风险", result: "刚果（金）钽矿被贴上冲突矿产标签，国际买家收紧采购标准，尽调成本上升。" },
];

const rubayaForecastData = [
  { date: "1/08", actual: 42 },
  { date: "1/15", actual: 55 },
  { date: "1/22", actual: 73 },
  { date: "1/28", actual: 94, predicted: 94 },
  { date: "2/04", predicted: 91 },
  { date: "2/11", predicted: 84 },
  { date: "2/18", predicted: 76 },
  { date: "2/25", predicted: 68 },
];

const rubayaAlternativeSuppliers = [
  { source: "巴西Mibra等矿山", leadTime: "25-35天", cost: "中高", use: "保交付" },
  { source: "澳大利亚合规矿源", leadTime: "40-50天", cost: "高", use: "稳长期" },
  { source: "港口/贸易商现货", leadTime: "3-10天", cost: "极高", use: "短期扫货" },
  { source: "铌/陶瓷替代", leadTime: "3-6月", cost: "研发成本", use: "长期降依赖" },
];

function RubayaEventAnalysisColumns({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(310px,0.95fr)_minmax(500px,1.38fr)_minmax(330px,1fr)] gap-3 p-3">
      <DashboardColumn eyebrow="风险源" title="" description="">
        <RubayaRainGovernanceBoard />
        <PredatoryMiningBoard />
        <RescueBlockageBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="损失主体" title="" description="" prominent>
        <RubayaMineMapBoard selectedCase={selectedCase} />
        <RubayaStakeholderBoard selectedCase={selectedCase} />
        <RubayaImpactTableBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="不良后果" title="" description="">
        <RubayaCasualtySupplyBoard selectedCase={selectedCase} />
        <TantalumHeartStopBoard />
        <ConflictMineralComplianceBoard />
      </DashboardColumn>
    </div>
  );
}

function RubayaSolutionColumns({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(310px,0.95fr)_minmax(500px,1.38fr)_minmax(330px,1fr)] gap-3 p-3">
      <DashboardColumn eyebrow="预测" title="气象-舆情耦合" description="">
        <RubayaDisasterForecastBoard />
        <RubayaWeakSignalBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="智能决策" title="供应链替代" description="" prominent>
        <TantalumAlternativeBoard />
        <TantalumPressureTestBoard />
      </DashboardColumn>

      <DashboardColumn eyebrow="企业应对" title="ESG溯源" description="">
        <RubayaTraceabilityBoard />
        <RubayaActionBoard selectedCase={selectedCase} />
        <RecommendedSolutionBoard selectedCase={selectedCase} />
      </DashboardColumn>
    </div>
  );
}

function RubayaRainGovernanceBoard() {
  return (
    <PanelCard icon={CloudRain} title="天灾引爆人祸" accent="red">
      <div className="rounded-lg border border-red-100 bg-red-50 p-3">
        <div className="text-xs font-semibold text-red-800">2026年1月28日 · 北基伍省</div>
        <p className="mt-2 text-sm leading-6 text-red-950">
          连日强降雨软化山体和矿井结构，触发滑坡式坍塌；真正的底层风险来自长期无序开采和武装割据下的监管真空。
        </p>
      </div>
      <div className="mt-3 space-y-2">
        <TriggerFactor label="天灾诱因" value="极端降雨、土质松软、矿井渗水增多。" />
        <TriggerFactor label="治理失效" value="M23控制矿区，国家安全生产监管失效。" />
        <TriggerFactor label="系统脆弱" value="全球钽供应高度依赖高风险产区，断供传导快。" />
      </div>
    </PanelCard>
  );
}

function PredatoryMiningBoard() {
  return (
    <PanelCard icon={ShieldAlert} title="掠夺性开采" accent="yellow">
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="M23控制" value="2024/5起" detail="矿区割据" danger />
        <KpiTile label="月度敛财" value="$80万+" detail="税费与运输盘剥" />
        <KpiTile label="单坑作业" value="约500人" detail="远超承载" danger />
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-600">
        矿区被视为战争融资工具，安全检查、隧道加固和限员作业都会降低短期产出，因此被系统性忽视。
      </p>
    </PanelCard>
  );
}

function RescueBlockageBoard() {
  return (
    <PanelCard icon={RadioTower} title="救援受阻" accent="slate">
      <div className="space-y-2">
        <TriggerFactor label="政府军" value="无法进入M23控制区，重型机械难以抵达。" />
        <TriggerFactor label="国际组织" value="担心交火、绑架和道路破坏，不敢贸然靠近。" />
        <TriggerFactor label="黄金72小时" value="现场主要依赖居民和武装人员徒手挖掘，生还窗口被错过。" />
      </div>
    </PanelCard>
  );
}

function RubayaMineMapBoard({ selectedCase }: { selectedCase: CaseItem }) {
  const layerOptions = CASE_MAP_LAYERS.rubaya;
  const [activeLayerId, setActiveLayerId] = useState<CaseMapLayerId>("admin");
  const activeLayer = layerOptions.find((layer) => layer.id === activeLayerId) ?? layerOptions[0];
  const nodes = [
    { name: "鲁巴亚钶钽矿区", point: selectedCase.coordinates, color: "#DC2626" },
    { name: "戈马贸易集散", point: [29.22, -1.68] as LngLat, color: "#F59E0B" },
    { name: "卢旺达边境方向", point: [29.25, -1.5] as LngLat, color: "#005BBB" },
    { name: "乌干达方向", point: [29.98, -0.4] as LngLat, color: "#005BBB" },
  ];

  return (
    <PanelCard icon={MapPin} title="冲突矿产定位" accent="blue">
      <div className="relative h-[336px] overflow-hidden rounded-lg border border-gray-200 bg-slate-100">
        <LeafletMap
          center={selectedCase.coordinates}
          zoom={8}
          minZoom={5}
          maxZoom={10}
          tileUrl={activeLayer.tileUrl}
          tileAttribution={activeLayer.tileAttribution}
          overlayTileUrl={activeLayer.overlayTileUrl}
          overlayTileAttribution={activeLayer.overlayTileAttribution}
          overlayTileOpacity={activeLayer.overlayTileOpacity}
        >
          <Polyline positions={[[-1.57, 28.86], [-1.68, 29.22], [-1.5, 29.25]]} pathOptions={{ color: "#005BBB", weight: 3, dashArray: "6 6" }} />
          {nodes.map((node) => (
            <CircleMarker
              key={node.name}
              center={toLeafletPoint(node.point)}
              radius={node.name === "鲁巴亚钶钽矿区" ? 9 : 7}
              pathOptions={{ color: "#FFFFFF", weight: 2, fillColor: node.color, fillOpacity: 0.95 }}
            >
              <Popup>{node.name}</Popup>
            </CircleMarker>
          ))}
        </LeafletMap>
        <div className="absolute left-3 top-3 z-[500] rounded-lg bg-white/95 px-3 py-2 shadow-sm">
          <div className="text-xs font-semibold text-gray-950">北基伍省 · 鲁巴亚钽矿链路</div>
        </div>
        <CaseMapLayerSwitch layers={layerOptions} activeLayerId={activeLayerId} onChange={setActiveLayerId} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MapBadge label="核心矿种" value="钶钽矿 / Tantalum" />
        <MapBadge label="全球供应" value="超过15%钽资源" />
      </div>
    </PanelCard>
  );
}

function RubayaStakeholderBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={Building2} title="受影响主体" accent="blue">
      <div className="space-y-2">
        {selectedCase.stakeholders.map((stakeholder, index) => (
          <div key={stakeholder} className={`rounded-lg border px-3 py-2 ${index === 2 ? "border-red-100 bg-red-50" : "border-blue-100 bg-blue-50"}`}>
            <div className="text-sm font-semibold text-gray-950">{stakeholder}</div>
            <div className="mt-1 text-[11px] text-gray-600">{index === 2 ? "武装控制与资金链受冲击主体" : "人员、产业链或合规承压主体"}</div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function RubayaImpactTableBoard() {
  return (
    <PanelCard icon={Scale} title="影响与损失" accent="yellow">
      <div className="space-y-2">
        {rubayaImpactRows.map((row) => (
          <div key={row.subject} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-950">{row.subject}</div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-amber-700">{row.loss}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-600">{row.result}</p>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function RubayaCasualtySupplyBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={AlertTriangle} title="生命与供应双重冲击" accent="red">
      <div className="rounded-lg border border-red-200 bg-red-950 p-4 text-white">
        <div className="text-xs text-red-100">特大矿难 / 供应链休克</div>
        <div className="mt-3 text-3xl font-semibold">300+遇难</div>
        <div className="mt-1 text-sm text-red-100">全球钽供应核心产区停摆</div>
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-600">{selectedCase.impact}</p>
    </PanelCard>
  );
}

function TantalumHeartStopBoard() {
  return (
    <PanelCard icon={Diamond} title="钽供应心脏骤停" accent="red">
      <div className="space-y-3">
        <ImpactCompareRow label="全球供应占比" value=">15%" percent={75} color="bg-red-700" />
        <ImpactCompareRow label="月度缺口预估" value="18%+" percent={68} color="bg-amber-500" />
        <ImpactCompareRow label="库存耗尽窗口" value="约14天" percent={56} color="bg-[#005BBB]" />
      </div>
      <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-900">
        原矿断供会沿“冶炼厂开工率-钽粉价格-电容器成本-终端电子产品”链条传导。
      </div>
    </PanelCard>
  );
}

function ConflictMineralComplianceBoard() {
  return (
    <PanelCard icon={Gavel} title="冲突矿产标签" accent="slate">
      <div className="grid grid-cols-2 gap-2">
        {["采购标准收紧", "尽调成本上升", "血钽舆情风险", "客户审计压力"].map((item) => (
          <div key={item} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
            {item}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
        合规企业需要证明矿石来源与M23控制区切割，否则可能被国际买家暂停采购。
      </div>
    </PanelCard>
  );
}

function RubayaDisasterForecastBoard() {
  return (
    <PanelCard icon={BarChart3} title="塌方风险走势" accent="blue">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rubayaForecastData} margin={{ top: 26, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={[20, 100]} tick={{ fontSize: 10 }} />
            <ChartTooltip formatter={(value) => [`${value}/100`, "塌方风险"]} />
            <ReferenceLine x="1/28" stroke="#DC2626" strokeDasharray="4 4" label={{ value: "塌方", position: "insideTop", fill: "#DC2626", fontSize: 10, dy: -16 }} />
            <Line type="monotone" dataKey="actual" name="气象-社群监测" stroke="#005BBB" strokeWidth={2.5} dot={{ r: 2.5, fill: "#005BBB" }} connectNulls />
            <Line type="monotone" dataKey="predicted" name="事故后供应研判" stroke="#DC2626" strokeWidth={2.5} strokeDasharray="7 7" dot={{ r: 2.5, fill: "#DC2626" }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-900">
        极端降雨预报与“矿井渗水严重”“土质松软”等社群抱怨同频出现时，系统触发红色预警。
      </div>
    </PanelCard>
  );
}

function RubayaWeakSignalBoard() {
  return (
    <PanelCard icon={Activity} title="弱信号捕捉" accent="red">
      <div className="space-y-2">
        <TriggerFactor label="视觉信号" value="SAR卫星监测运输道路和桥梁通行，夜光遥感识别矿区作业停摆。" />
        <TriggerFactor label="社群信号" value="抓取寻人、道路关闭、矿井渗水、卡车停运等本地语言线索。" />
        <TriggerFactor label="价格信号" value="非正式交易渠道钽矿报价短时涨幅超过20%，提示中间商预期断供。" />
      </div>
    </PanelCard>
  );
}

function TantalumAlternativeBoard() {
  return (
    <PanelCard icon={MapPin} title="替代采购作战图" accent="blue">
      <div className="grid grid-cols-2 gap-2">
        {rubayaAlternativeSuppliers.map((option) => (
          <div key={option.source} className="rounded-lg border border-gray-100 bg-white p-3">
            <div className="text-sm font-semibold text-gray-950">{option.source}</div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-gray-600">
              <span>{option.leadTime}</span>
              <span>成本：{option.cost}</span>
              <span>{option.use}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
        建议组合：70%订单转向巴西保交付，30%锁定澳洲稳长期，同时扫货港口合规现货。
      </div>
    </PanelCard>
  );
}

function TantalumPressureTestBoard() {
  return (
    <PanelCard icon={Gauge} title="供应网络压力测试" accent="green">
      <div className="space-y-2">
        <TriggerFactor label="缺口量化" value="按鲁巴亚月均产量、停产天数和其他矿区闲置产能计算总量缺口。" />
        <TriggerFactor label="品位折算" value="对低品位替代矿自动折算有效金属含量，避免只看吨数。" />
        <TriggerFactor label="传导路径" value="原矿断供 → 冶炼厂开工下降 → 钽粉涨价 → 电容器成本上升。" />
      </div>
    </PanelCard>
  );
}

function RubayaTraceabilityBoard() {
  return (
    <PanelCard icon={Gavel} title="ESG合规与溯源" accent="slate">
      <div className="grid grid-cols-2 gap-2">
        {["官方通报", "卫星地貌变化", "人权组织报告", "采购批次溯源"].map((item) => (
          <div key={item} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
            {item}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
        自动生成《供应链风险排除报告》，证明事故前已尽监测义务，且未采购来自受灾非法区域的矿石。
      </div>
    </PanelCard>
  );
}

function RubayaActionBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={RadioTower} title="处置清单" accent="green">
      <div className="space-y-2">
        {selectedCase.recommendations.map((item) => (
          <div key={item} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-700">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
            {item}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function ForecastTrendBoard() {
  return (
    <PanelCard icon={BarChart3} title="趋势预测" accent="blue">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">风险情绪指数</div>
          <div className="mt-1 text-2xl font-semibold text-gray-950">86</div>
          <div className="mt-1 text-[11px] text-gray-500">事故后高点</div>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-right">
          <div className="text-[11px] text-red-700">系统预警级别</div>
          <div className="text-xl font-semibold text-red-800">高风险</div>
          <div className="mt-1 text-[11px] text-red-700">联动处置建议</div>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={solutionTrendData} margin={{ top: 26, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={[20, 95]} tick={{ fontSize: 10 }} />
            <ChartTooltip formatter={(value) => [`${value}/100`, "风险情绪指数"]} />
            <ReferenceLine
              x="2/18"
              stroke="#DC2626"
              strokeDasharray="4 4"
              label={{ value: "事故发生", position: "insideTop", fill: "#DC2626", fontSize: 10, dy: -16 }}
            />
            <Line type="monotone" dataKey="actual" name="事故前真实走势" stroke="#005BBB" strokeWidth={2.5} dot={{ r: 2.5, fill: "#005BBB" }} connectNulls />
            <Line type="monotone" dataKey="predicted" name="事故后14天研判走势" stroke="#DC2626" strokeWidth={2.5} strokeDasharray="7 7" dot={{ r: 2.5, fill: "#DC2626" }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
        <div className="rounded-lg bg-blue-50 px-3 py-2"><span className="font-semibold text-[#005BBB]">蓝线</span> 事故前真实社区情绪走势</div>
        <div className="rounded-lg bg-red-50 px-3 py-2"><span className="font-semibold text-red-700">红虚线</span> 事故后14天研判走势</div>
      </div>
    </PanelCard>
  );
}

function AiForecastAlert() {
  return (
    <PanelCard icon={AlertTriangle} title="预警提示" accent="red">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-red-900">阻碍矿区物流通道风险</div>
          <span className="rounded-full bg-red-700 px-2.5 py-1 text-xs font-semibold text-white">高风险</span>
        </div>
        <p className="text-xs leading-5 text-red-900">
          风险情绪指数在事故后升至高位，系统将“环保不信任、就业不满、索赔动员”联动为处置建议输入。
        </p>
      </div>
      <div className="mt-3 space-y-2">
        <TriggerFactor label="环保不信任" value="水质、尾矿库排水和修复进度成为事故后核心讨论。" />
        <TriggerFactor label="就业不满" value="本地岗位与外来技术工议题叠加，推动线下动员风险升温。" />
        <TriggerFactor label="索赔动员" value="集体诉讼与赔偿预期提高社区组织化表达强度。" />
      </div>
    </PanelCard>
  );
}

function TriggerFactor({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="w-20 flex-shrink-0 text-xs font-semibold text-gray-900">{label}</span>
      <span className="text-xs leading-5 text-gray-600">{value}</span>
    </div>
  );
}

function CommunitySentimentBoard({ selectedCase }: { selectedCase: CaseItem }) {
  const overallIndex = Math.round(sentimentDimensions.reduce((sum, item) => sum + item.value, 0) / sentimentDimensions.length);

  return (
    <PanelCard icon={Activity} title="社区情绪" accent="blue">
      <div className="grid grid-cols-[180px_1fr] gap-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs font-semibold text-[#005BBB]">综合风险情绪指数</div>
          <div className="mt-3 text-5xl font-semibold text-gray-950">{overallIndex}</div>
          <div className="mt-1 text-xs text-gray-600">/100，越高表示风险越高</div>
          <div className="mt-4 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-gray-600">
            当前核心语义集中在“失业”“本地岗位”“粉尘”“水质”。
          </div>
        </div>

        <div className="space-y-3">
          {sentimentDimensions.map((item) => (
            <SentimentBar key={item.name} {...item} />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
        <div className="mb-2 text-xs font-semibold text-gray-900">脱敏数据源</div>
        <div className="flex flex-wrap gap-2">
          {communitySources.map((source) => (
            <span key={source} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-gray-600">
              {source}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-gray-600">
        关联案例：{selectedCase.locationName}。系统先剥离垃圾信息，再抽取与就业、环境相关的语义权重，用于判断社区压力是否正在外溢。
      </p>
    </PanelCard>
  );
}

function SentimentBar({ name, value, risk }: { name: string; value: number; risk: string }) {
  const color = value >= 75 ? "bg-red-600" : value >= 55 ? "bg-amber-500" : "bg-emerald-600";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{name}</span>
        <span className="text-gray-500">{risk} · {value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RootCauseDiagnosisBoard() {
  return (
    <PanelCard icon={Gauge} title="情绪根因" accent="yellow">
      <div className="grid grid-cols-3 gap-2">
        {rootCauseCards.map((card) => (
          <div key={card.title} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="text-[11px] text-gray-500">贡献度</div>
            <div className="mt-1 text-2xl font-semibold text-gray-950">{card.contribution}%</div>
            <div className="mt-2 text-xs font-semibold leading-5 text-gray-900">{card.title}</div>
            <p className="mt-2 text-[11px] leading-5 text-gray-600">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3">
        <div className="mb-3 text-xs font-semibold text-amber-900">归因链条解析</div>
        <CausalStep label="社群舆情源头" value="本地意见领袖发帖称：二期工程招了300个外地技术工，本地年轻人只能打零工。" />
        <CausalStep label="情绪发酵放大" value="该帖24小时内被转发400次，引发失业青年群体共鸣。" />
        <CausalStep label="衍生次生风险" value="部分激进言论开始向环境污染扩散，试图联合环保NGO放大议题。" />
      </div>
    </PanelCard>
  );
}

function CausalStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex gap-3 last:mb-0">
      <span className="w-24 flex-shrink-0 rounded bg-white px-2 py-1 text-center text-[11px] font-semibold text-amber-800">{label}</span>
      <span className="text-xs leading-5 text-amber-950">{value}</span>
    </div>
  );
}

function ActionRecommendationBoard() {
  return (
    <PanelCard icon={Scale} title="企业应对方案" accent="green">
      <div className="space-y-3">
        {actionPlans.map((plan, index) => (
          <div key={plan.title} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-950">方案{index + 1}：{plan.title}</div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700">{plan.timing}</span>
            </div>
            <div className="mb-2 text-[11px] font-semibold text-gray-500">牵头：{plan.owner}</div>
            <p className="text-xs leading-5 text-gray-700">{plan.objective}</p>
            <div className="mt-3 grid gap-1.5">
              {plan.actions.map((action) => (
                <div key={action} className="flex items-start gap-2 rounded-md bg-white px-2.5 py-1.5 text-[11px] leading-4 text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                  {action}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

interface SolutionReport {
  headline: string;
  situation: string[];
  causes: string[];
  solutions: string[];
}

function getCaseSolutionReport(selectedCase: CaseItem): SolutionReport {
  if (selectedCase.id === "tanzania-dar-port-election-unrest-2025") {
    return {
      headline: "坦桑尼亚达累斯萨拉姆港关闭事件咨询报告",
      situation: [
        "2025年10月底至11月初，坦桑尼亚大选后发生大规模抗议和骚乱。由于主要反对党候选人被取消资格，反对派支持者和当地民众在多个城市发起抗议，政府随后实施全国互联网封锁和无限期宵禁。政治动荡迅速外溢至交通运输和港口运营体系，达累斯萨拉姆港及相关仓储、清关、陆路集疏运环节受到严重影响，部分仓库关闭，货物通行和港区作业进入高度不确定状态。",
        "达累斯萨拉姆港是东非最重要的物流枢纽之一，也是刚果（金）、赞比亚等内陆矿业国家铜钴资源出口的重要通道。对于中国供应链而言，该港承担了非洲对华铜出口的关键份额。港口关闭后，已经从矿区发出的铜钴货物滞留在边境、中转站或港口仓储环节，新的矿石列车和卡车无法顺利进入港区，空箱和空车也无法回流至内陆矿山，导致矿区发货、边境通关、港口装船和中国冶炼端到货节奏同时受阻。",
        "本事件对企业造成的影响具有链式扩散特征。第一，矿企和贸易商面临库存积压、回款周期延长和合同交付延期；第二，物流企业面临车辆滞留、运力占用、仓储费和滞期费上升；第三，中国冶炼厂面临原料到港不确定和安全库存消耗；第四，客户侧可能因交货延误触发违约索赔或重新议价。更重要的是，断网和宵禁使企业无法及时掌握港口内部状态，港区是否安全、仓库何时开放、货柜是否受损、船期能否恢复等关键信息均处于“黑箱”状态，进一步放大了恐慌性决策和市场波动。",
      ],
      causes: [
        "本次事件的直接诱因是大选后政治冲突。反对派候选人被取消资格，引发选举合法性争议和街头抗议，政府采取断网、宵禁和安全管控措施，导致港口和城市基础运行受到冲击。但从供应链角度看，真正的问题并不在于一次选举抗议，而在于企业长期忽视政治风险对关键物流节点的传导效应。",
        "达累斯萨拉姆港之所以成为系统性风险节点，主要源于供应链路径的高度集中。对于刚果（金）和赞比亚铜钴矿企而言，达港具备距离、成本和成熟度优势，因此长期被视为首选甚至默认出海口。企业在日常经营中追求运输效率和成本最低化，却没有同步建设足够的备用港口、备用仓储和多式联运冗余。一旦达港因政治动荡、罢工、封锁或仓储关闭而失效，供应链缺少可立即切换的“热备份”通道。",
        "替代路径的可行性也被高估。南非德班港、纳米比亚沃尔维斯湾和莫桑比克贝拉港在理论上可以承接部分改道货物，但这些港口自身存在基础设施老化、拥堵、铜处理能力有限或仓储容量不足等约束。当大量贸易商同时改道时，替代港口会迅速从“备用方案”变成新的拥堵点，导致运输距离增加、时效延长和运费溢价上升。",
        "此外，断网造成的信息不对称是本次危机的重要放大器。企业无法获得实时港口状态，只能依赖代理人、零散消息或延迟通报进行判断。在信息缺失情况下，不同企业往往选择同时抢舱、抢仓、改道或暂停发货，形成羊群效应。这种非理性集体行动不仅推高价格，也削弱了整体供应链恢复效率。",
      ],
      solutions: [
        "建议企业将该事件纳入“关键物流节点中断”一级响应，建立“政治预警、动态路由、货物分层、证据存证”四线并行机制。",
        "第一，建立港口政治风险预警。企业应在大选、重大抗议和安全管控敏感期前，对达累斯萨拉姆港、坦赞边境、铁路、公路走廊和主要仓储节点进行红线监测。系统需接入当地新闻、社交媒体、港口公告、AIS船舶轨迹、边境通行信息和本地安全情报。当反对派动员、道路封锁、港区聚集、宵禁或断网信号同时出现时，应提前触发港口停摆预警，而不是等港口正式闭库后再响应。",
        "第二，实施货物分层处置。企业应按货值、客户违约风险、冶炼端紧迫程度和替代能力，将货物分为A、B、C三类。A类为高价值、急交付或关键客户订单，可考虑高成本公路、空运或优先清关通道；B类为中等优先级货物，可按比例分流至贝拉港、德班港或沃尔维斯湾；C类为大宗低优先级货物，应暂存在内陆矿区或边境仓库，等待达港恢复，避免盲目涌入替代港口造成二次拥堵。",
        "第三，建立动态路由决策模型。模型应每日更新各港口的通行状态、仓储容量、排队时长、运价、清关风险和预计恢复时间，并输出不同方案的总成本和总时效，而不是简单给出“改道”或“等待”的二元建议。企业可以采用混合策略，例如30%急单分流、20%现货锁舱、50%内陆等待，以平衡交付风险和成本风险。",
        "第四，启动保险理赔与客户沟通存证。企业应自动归集宵禁令、政府公告、港口闭库通知、仓库停运说明、AIS异常、运输合同、客户通知和第三方报告，形成不可抗力和交付延期证明包。该证明包可用于营业中断险、货运延迟险、客户延期说明和内部责任界定。通过统一事实口径，企业可降低客户索赔、减少内部扯皮，并为后续供应链复盘提供依据。",
      ],
    };
  }

  if (selectedCase.id === "zimbabwe-lithium-export-ban-2026") {
    return {
      headline: "津巴布韦锂精矿出口禁令事件咨询报告",
      situation: [
        "2026年2月25日，津巴布韦矿业部突然宣布暂停所有原矿及锂精矿出口，并将原本计划于2027年实施的全面出口禁令大幅提前。更具冲击性的是，本次禁令并非仅适用于未来新增出口，而是覆盖正在运输、等待清关或已抵达港口的在途货物。这一安排使大量企业已经装车、靠近边境或进入港口流程的锂精矿瞬间陷入不确定状态，面临扣押、退运、重新申请许可或被迫参与临时配额谈判的风险。",
        "津巴布韦是非洲重要锂资源国，也是中国锂精矿进口的重要来源之一。随着全球新能源产业扩张，锂被视为支撑电池、电动车和储能产业链的关键资源。过去几年，中资企业通过收购、参股、建设选厂等方式在津巴布韦锂矿领域形成较深布局，相关企业原本基于合同安排和政策过渡期组织采矿、选矿、出口和中国冶炼端排产。然而，突发禁令打破了企业对政策节奏的判断，直接影响矿山现金流、贸易交付、国内锂盐企业原料保障和后续投资决策。",
        "从事件演变看，禁令并非孤立政策动作，而是津巴布韦政府在资源民族主义、财政压力和本土工业化诉求下采取的强干预措施。政府希望改变长期出口原矿和低附加值精矿的模式，通过行政限制倒逼外资企业在本地建设加工能力，增加税收、就业和产业链附加值。4月后配额有所松动，但这并不意味着风险消失，而是说明出口许可已经从常规贸易流程转变为政府与企业之间的产业谈判工具。",
      ],
      causes: [
        "本次事件的直接诱因，是企业对2027年禁令时点的误判以及由此引发的集中抢出口。许多企业认为仍有较长过渡期，因而在禁令正式落地前加快原矿和精矿出口，试图尽可能多地锁定现金流和离岸货权。这种“最后窗口期抢运”行为被政府视为对本国资源的加速外流，也被本土舆论解读为外资企业在政策收紧前进行资源套现，从而加剧了政府提前实施禁令的动机。",
        "深层原因在于津巴布韦政府希望重新分配锂资源收益。与印尼限制镍矿出口、倒逼本土冶炼投资类似，津巴布韦不愿继续处于原料供应国位置。政府认为，仅出口原矿和低级精矿会让外资企业获取主要利润，而本国只能获得有限税收和就业机会。因此，出口禁令既是产业政策，也是谈判工具，目的在于迫使矿企将选矿、冶炼和下游加工能力留在当地。",
        "企业自身的风险管理也存在明显短板。第一，企业过度依赖采矿合同、出口合同和既有许可，认为法律文本足以保护经营安排，却低估了行政命令在资源主权议题上的穿透力。第二，企业对政策信号监测不足，没有将总统、矿业部长、议会辩论、政府公报和本土媒体社论中的高频关键词纳入预警体系。第三，企业缺少实时在途货物台账，一旦禁令覆盖在途货物，就难以第一时间判断哪些货物在矿区、哪些在边境、哪些已抵港，从而错失保全、抢运或申请豁免的窗口。",
      ],
      solutions: [
        "建议企业将津巴布韦锂禁令纳入“资源民族主义与供应链中断”一级响应，建立政策预警、货物保全、替代采购和本地化谈判四线并行机制。",
        "第一，建立政策语义预警体系。企业不应只等待正式政府公报，而应持续监测津巴布韦总统府、矿业部、财政部、议会记录、主流媒体和本地社群。系统应重点识别“禁止原矿出口”“本土化加工”“增加国家收入”“外资资源掠夺”等高风险语义。一旦官方强监管表态与本土舆论热度同时上升，应触发橙色预警，并建议企业暂停新增出口承诺、加速核查在途货物和调整国内冶炼排产。",
        "第二，建立矿区、边境、港口三级在途货物台账。企业需要实时掌握每一批货物的品位、货值、装运状态、许可文件、承运人、边境位置和客户交付期限。对高品位、高货值、靠近清关节点的货物，应在预警期内优先抢运或申请临时许可；对尚未取得完整文件或政策确定性较低的货物，应暂停发运，避免在禁令发布后转化为非法出口风险和额外物流成本。",
        "第三，启动多来源替代采购。中国冶炼端不能等到津巴布韦货物完全受阻后才寻找替代供应。建议同步评估澳大利亚、南美和国内库存资源，按品位、交期和价格建立采购组合。短期可通过国内库存调拨和现货采购稳定生产；中期锁定澳大利亚和南美供应；长期则需要降低对单一非洲资源国的依赖，建立政策风险调整后的采购配额体系。",
        "第四，推进本地化投资谈判和合规证据保全。企业应准备本地选矿、冶炼、就业培训和税收贡献方案，将“被动接受禁令”转化为“以产业承诺换取过渡许可”的谈判。与此同时，法务团队应归集采矿合同、出口许可、纳税记录、装运单据和政府沟通邮件。一旦发生扣押、罚款或合同违约争议，这些材料可用于证明企业善意履约，并支撑豁免申请、赔偿谈判或国际仲裁。",
      ],
    };
  }

  if (selectedCase.id === "drc-rubaya-tantalum-collapse-2026") {
    return {
      headline: "刚果（金）鲁巴亚钶钽矿区塌方事件咨询报告",
      situation: [
        "2026年1月28日，刚果（金）东部北基伍省鲁巴亚钶钽矿区发生特大塌方事故。鲁巴亚矿区是全球钽供应链的重要节点，供应全球超过15%的钽资源，钽又是智能手机、电容器、航空航天和高端电子制造不可替代的关键原料。因此，本次事件并非单纯的矿山安全事故，而是同时具有人员伤亡、人道救援、冲突矿产合规和全球供应链冲击属性的复合型事件。",
        "事故发生前，北基伍省连续遭遇强降雨，矿区地质结构持续软化。塌方发生后，大量矿工被埋，造成重大人员伤亡，其中包括未成年人。由于鲁巴亚矿区自2024年以来长期处于反政府武装M23运动控制之下，刚果（金）政府军难以及时进入，国际人道组织和专业救援队也因安全局势、道路破坏和绑架风险无法快速抵达。黄金救援窗口内，现场主要依赖当地居民和武装人员徒手挖掘，救援效率严重不足，进一步放大了人员损失。",
        "供应链层面，塌方直接破坏矿区作业面，随后矿区采矿和交易活动被迫中断。由于鲁巴亚在全球钽资源中占据关键位置，事故引发钽精矿供应缺口、现货价格波动和下游采购紧张。对于消费电子、航空航天和高端制造企业而言，风险不仅在于原料断供，还在于采购批次可能被贴上“冲突矿产”标签，进而触发客户审计、ESG质疑和法律合规风险。",
      ],
      causes: [
        "本次塌方的直接诱因是强降雨，但根本原因在于武装割据下的治理失效和无序开采。M23控制鲁巴亚矿区后，将矿区视为支撑战争开支的资金来源，而非需要长期经营和安全投入的生产资产。通过向矿工、运输车辆和矿石交易征税，武装组织获得持续现金流。在这种掠夺性治理模式下，矿区安全检查、隧道加固、人数限制和工程规划都被视为影响出矿速度的成本项，难以真正执行。",
        "矿区作业方式也高度危险。在重税盘剥和暴力管控下，大量矿工被迫进入不具备安全条件的矿坑作业。部分矿坑出现超员、无支护、平行隧道开挖等问题，工程结构本身已接近失稳状态。连续降雨导致土层含水量上升，局部滑坡很容易通过密集隧道传导为连环坍塌。因此，强降雨只是触发器，事故实质上是长期工程失序、监管真空和武装经济共同作用后的必然结果。",
        "从供应链角度看，下游产业对鲁巴亚这类高风险产区存在路径依赖。企业通常关注矿石价格、品位和交付周期，但对矿区控制权、武装税费、救援可达性和ESG暴露度缺乏持续监测。一旦核心矿区突然停摆，企业才开始寻找替代来源，此时市场价格已被推高，合规供应商产能也难以快速释放。此外，钽矿存在品位差异，替代采购不能简单按吨数补缺口，而必须折算有效金属含量，否则会低估真实供应缺口。",
      ],
      solutions: [
        "建议下游企业将本事件纳入“冲突矿产关键节点中断”一级响应，建立三条并行处置线。",
        "第一，建立气象-舆情-遥感耦合预警。企业不应等官方停产公告发布后才反应，而应将极端降雨、矿井渗水抱怨、道路中断、卡车停运、夜光遥感下降和SAR卫星道路监测纳入同一风险模型。若系统同时捕捉到“强降雨预警”和本地社群中关于“矿井渗水严重”“土质松软”“道路被冲毁”的讨论，应立即触发红色预警，暂停高风险区域采购，并向外派人员、NGO合作方和供应链伙伴发布避险提示。",
        "第二，启动合规替代采购与库存锁仓。采购部门应立即测算鲁巴亚停产对自身供应的影响，包括月均采购量、当前库存可支撑天数、港口现货量和供应商交付周期。短期内，应优先锁定港口合规现货和巴西等相对近端供应；中期可与澳大利亚等合规矿源签订补充订单；若预计断供超过六个月，则应联合研发部门评估铌或陶瓷材料在非核心部件中的替代可能。所有替代方案都需进行品位折算，确保补充的是有效金属含量，而非表面吨数。",
        "第三，强化ESG溯源与客户沟通。企业应自动归集官方通报、卫星影像、人权组织报告、供应商声明、运输单据和采购批次数据，生成《供应链风险排除报告》。报告需要证明企业在事故发生前已履行合理监测义务，事故后及时暂停高风险来源采购，并未采购来自M23控制或受灾非法区域的矿石。该报告可同步用于客户审计、投资者沟通和内部合规备案，降低“血钽”舆情和法律风险。",
      ],
    };
  }

  return {
    headline: "赞比亚谦比希铜矿尾矿坝决堤事故咨询报告",
    situation: [
      "2025年2月18日，赞比亚铜带省谦比希湿法冶炼厂尾矿坝发生决堤事故，酸性尾矿水外泄并进入姆旺巴希河、卡富埃河等下游水系。事故发生地位于赞比亚铜带省核心矿业区，周边分布有中资矿企、冶炼设施、农田、村镇和依赖河流水源的社区。由于尾矿液具有酸性及潜在重金属污染风险，事故很快从单一工程安全事件演变为环境污染、社区健康、农田损失、政府监管、复工审批和企业声誉多重叠加的综合性危机。",
      "事故发生后，地方政府、社区居民、媒体、环保组织和企业围绕污染范围、下游水质、临时供水、赔偿安排和复工条件形成持续博弈。对当地居民而言，事件直接影响其饮用水安全、农业灌溉、渔业活动和日常生活，对企业而言，则同时冲击生产连续性、政府关系、社区关系和融资声誉。尤其是在事故信息披露不充分、第三方监测结果滞后、修复进度缺少可视化说明的情况下，社区对企业的不信任快速上升，索赔预期和集体行动风险随之增强。",
      "从风险性质看，本次事故不是单纯的“坝体工程问题”，而是工程设施老化、雨季极端天气、矿区安防漏洞和社区情绪管理缺位共同作用的结果。尾矿坝作为高风险矿业基础设施，一旦发生事故，影响会沿水系、农田、社区、政府监管和资本市场层层传导。因此，企业处理本事件时，不能只围绕“堵漏”和“复工”展开，而必须同步处理环境修复、民生救助、事实核验、法律责任和社会信任修复。",
    ],
    causes: [
      "从直接原因看，事故与尾矿坝防渗、排水和坝体稳定性不足有关。事故发生前后，铜带省处于雨季，连续降雨可能抬高尾矿库水位并增加渗流压力。如果坝体排水能力不足，或防渗膜存在破损、盗割、老化等问题，雨水入渗会削弱坝体结构稳定性，并增加尾矿水外泄概率。对于尾矿坝这类设施而言，降雨本身并不必然导致决堤，真正的问题在于设施是否具备足够的冗余能力，以及是否建立了雨季高水位、渗压、位移和巡检异常的联动预警机制。",
      "从管理原因看，企业在尾矿坝安全监测和矿区边缘安防方面存在薄弱环节。一方面，尾矿坝运行需要长期监测水位、渗压、坝体位移、防渗系统状态和排水能力；另一方面，矿区周边人员活动、盗割防渗膜、非法进入等人为风险也会影响坝体安全。如果工程团队、安保团队和社区联络团队之间数据割裂，企业很难在事故前识别“工程异常+人为扰动+强降雨”叠加后的真实风险。",
      "从社会原因看，企业没有充分把社区情绪纳入风险管理框架。当地社区长期关注就业机会、本地收益分配、环境影响和企业信息透明度。尾矿坝事故发生后，原本分散的就业不满、环保担忧和赔偿预期迅速被同一事件串联起来，形成更强的集体表达动力。如果企业只用工程语言解释事故，而没有同步回应居民饮水、健康、农田和补偿问题，社区会倾向于认为企业在回避责任，进而推动抗议、诉讼、媒体曝光和政府高压监管。",
    ],
    solutions: [
      "建议企业将本事件纳入“重大环境与社区关系危机”一级响应，采取“民生兜底、工程透明、赔付分层、复工重建”四线并行策略。",
      "第一，立即启动社区民生兜底。事故发生后的前24小时，企业应优先解决居民最直接的不安全感，而不是急于进行责任辩解。具体措施包括：向下游社区提供临时饮用水，设立健康筛查点，公开受影响农户和居民登记渠道，并邀请村镇代表、地方政府和第三方机构参与信息沟通。该阶段的核心目标是稳定社区预期，避免恐慌、谣言和对抗性动员继续扩散。",
      "第二，建立工程修复透明机制。企业应将尾矿坝封堵、排水、清淤、污染水体隔离、水质监测和复垦工作拆解为可追踪节点，并以周报或看板形式向政府和社区公开。所有关键水体、取水点、农田和沉积物监测应引入第三方检测机构，形成公开、可验证、可追溯的数据链。只有把修复过程从“企业单方面声明”转变为“第三方可验证过程”，才能逐步恢复政府和社区信任。",
      "第三，推动赔付和法律责任分层处理。企业应区分紧急救助、事实核验、经济损失赔偿、长期环境修复和诉讼谈判，不宜在事实不清阶段一次性承诺全部责任，也不宜简单拒绝社区诉求。建议建立受影响主体台账，将农户、渔民、取水点居民、小商户和公共设施分别归类，按影响程度确定救助、补偿和后续评估机制。同时，法务和保险团队应同步核验责任边界、合同保险条款和可能的政府监管处罚。",
      "第四，重建复工前的风险治理体系。复工不应被视为事故处理的终点，而应作为治理升级的条件。企业需在复工前完成独立工程安全评估、雨季预警阈值设定、防渗系统复核、应急演练和社区沟通机制重建。后续应将降雨预报、水位、渗压、坝体位移、视频巡检、社区投诉和安防事件纳入统一监测平台，形成“工程风险+社区风险”的联动预警。只有这样，企业才能从事故善后转向长期韧性运营，降低类似事件再次发生的概率。",
    ],
  };
}

function RecommendedSolutionBoard({ selectedCase }: { selectedCase: CaseItem }) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const report = getCaseSolutionReport(selectedCase);

  return (
    <PanelCard icon={RadioTower} title="推荐解决方案" accent="blue">
      <p className="text-xs leading-5 text-gray-600">
        结合事件态势、根因链条和企业可控资源，生成面向管理层的咨询式处置报告。
      </p>
      <button
        type="button"
        onClick={() => setIsReportOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#005BBB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        生成方案报告
        <ArrowRight className="h-4 w-4" />
      </button>
      {isReportOpen && <SolutionReportModal selectedCase={selectedCase} report={report} onClose={() => setIsReportOpen(false)} />}
    </PanelCard>
  );
}

function SolutionReportModal({
  selectedCase,
  report,
  onClose,
}: {
  selectedCase: CaseItem;
  report: SolutionReport;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 px-6 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#005BBB]">咨询方案报告</span>
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{selectedCase.level}</span>
              <span className="text-xs text-gray-500">{selectedCase.country} · {selectedCase.date}</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-950">{report.headline}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="关闭方案报告"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-4xl space-y-5">
            <ReportSection index="01" title="事件情况" items={report.situation} tone="blue" />
            <ReportSection index="02" title="原因研判" items={report.causes} tone="yellow" />
            <ReportSection index="03" title="处置方案" items={report.solutions} tone="green" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ReportSection({ index, title, items, tone }: { index: string; title: string; items: string[]; tone: "blue" | "yellow" | "green" }) {
  const toneClass = {
    blue: "border-blue-100 bg-blue-50/60 text-[#005BBB]",
    yellow: "border-amber-100 bg-amber-50/60 text-amber-700",
    green: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
  }[tone];

  return (
    <section className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="mb-3">
        <div className="text-[11px] font-semibold">{index}</div>
        <h3 className="text-base font-semibold text-gray-950">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <p key={item} className="text-sm leading-7 text-gray-700">
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function DashboardColumn({
  eyebrow,
  title,
  description,
  prominent = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  prominent?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`min-h-0 overflow-y-auto rounded-lg border p-3 ${prominent ? "border-blue-200 bg-blue-50/60" : "border-gray-200 bg-white"}`}>
      {(eyebrow || title || description) && (
        <div className="mb-3 rounded-lg border border-gray-100 bg-white p-4">
          {eyebrow && <div className={`${title ? "mb-1" : ""} text-base font-semibold text-[#005BBB]`}>{eyebrow}</div>}
          {title && <h2 className="text-lg font-semibold text-gray-950">{title}</h2>}
          {description && <p className="mt-2 text-xs leading-5 text-gray-600">{description}</p>}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function PanelCard({
  icon: Icon,
  title,
  children,
  accent = "blue",
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
  accent?: "blue" | "red" | "yellow" | "green" | "slate";
}) {
  const accentClass = {
    blue: "text-[#005BBB] bg-blue-50 border-blue-100",
    red: "text-red-700 bg-red-50 border-red-100",
    yellow: "text-amber-700 bg-amber-50 border-amber-100",
    green: "text-emerald-700 bg-emerald-50 border-emerald-100",
    slate: "text-slate-700 bg-slate-50 border-slate-100",
  }[accent];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function CauseCouplingBoard({ selectedCase }: { selectedCase: CaseItem }) {
  const humanChain = ["盗割防渗膜", "安防漏洞", "环保不信任 / 就业不满", "社区情绪感知缺位"];
  const naturalChain = ["连续降雨", "雨水渗透增强", "坝体水压抬升"];

  return (
    <PanelCard icon={Siren} title="触发链路" accent="red">
      <div className="grid grid-cols-2 gap-3">
        <FactorChain title="人为因子" subtitle="主导链路" icon={ShieldAlert} items={humanChain} tone="red" />
        <FactorChain title="自然因子" subtitle="放大链路" icon={CloudRain} items={naturalChain} tone="yellow" />
      </div>

      <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
        <div className="text-xs font-semibold text-red-800">共同结果</div>
        <div className="mt-1 text-sm font-semibold text-gray-950">{selectedCase.date} · 尾矿坝决堤</div>
        <p className="mt-2 text-xs leading-5 text-red-900">
          自然降雨是放大器，人为安防和社区关系治理缺口决定了风险是否提前暴露、是否被及时阻断。
        </p>
      </div>
    </PanelCard>
  );
}

function DamMechanismDiagram() {
  return (
    <PanelCard icon={Mountain} title="尾矿坝剖面" accent="slate">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
        <img
          src="/image/tailings-dam-liner-breach-v2.png"
          alt="尾矿坝防渗膜破损剖面示意图"
          className="h-full w-full object-cover"
        />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 56.25" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="overlay-blue-arrow" markerWidth="3" markerHeight="3" refX="2.6" refY="1.5" orient="auto">
              <path d="M0,0 L0,3 L3,1.5 z" fill="#38BDF8" />
            </marker>
            <marker id="overlay-red-arrow" markerWidth="3.4" markerHeight="3.4" refX="3" refY="1.7" orient="auto">
              <path d="M0,0 L0,3.4 L3.4,1.7 z" fill="#EF4444" />
            </marker>
            <filter id="overlay-red-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g opacity="0.88">
            {[20, 31, 44].map((x, index) => (
              <motion.path
                key={x}
                d={`M${x} 5 L${x - 1.4} 20`}
                stroke="#38BDF8"
                strokeWidth="0.45"
                strokeLinecap="round"
                markerEnd="url(#overlay-blue-arrow)"
                animate={{ y: [0, 2.8, 0], opacity: [0.35, 0.9, 0.35] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.22, ease: "easeInOut" }}
              />
            ))}
          </g>

          <path
            d="M0.6 40.3 H28.5 C34.8 40.1 38.8 36.8 41.2 33.4 C42.6 31.3 42.8 30.5 43.5 30.8 C46.9 31.7 50.4 26.2 54.5 21.6 C58.2 17.5 62.8 17.1 67.4 18.8"
            fill="none"
            stroke="#111827"
            strokeOpacity="0.62"
            strokeWidth="1.05"
            strokeLinecap="round"
          />
          <path
            d="M0.6 40.3 H28.5 C34.8 40.1 38.8 36.8 41.2 33.4 C42.6 31.3 42.8 30.5 43.5 30.8 C46.9 31.7 50.4 26.2 54.5 21.6 C58.2 17.5 62.8 17.1 67.4 18.8"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="0.62"
            strokeLinecap="round"
            strokeDasharray="1.8 0.8"
          />

          <motion.path
            d="M43.2 29 C47 33 53 36 61 39 C70 42 78 44 88 47"
            fill="none"
            stroke="#EF4444"
            strokeWidth="0.7"
            strokeLinecap="round"
            strokeDasharray="1.6 1"
            markerEnd="url(#overlay-red-arrow)"
            filter="url(#overlay-red-glow)"
            animate={{ strokeDashoffset: [0, -8] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />

          <motion.circle
            cx="43.2"
            cy="29"
            r="1.7"
            fill="none"
            stroke="#FEE2E2"
            strokeWidth="0.4"
            animate={{ r: [1.2, 2.6, 1.2], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle cx="43.2" cy="29" r="0.95" fill="#EF4444" stroke="#FEE2E2" strokeWidth="0.35" />

          <g>
            <rect x="35" y="21" width="16.5" height="4.4" rx="1.2" fill="#991B1B" fillOpacity="0.92" />
            <text x="43.25" y="23.85" textAnchor="middle" fill="#FFFFFF" fontSize="1.75" fontWeight="700">防渗膜破损</text>
          </g>
          <g>
            <rect x="58" y="37.2" width="13.8" height="4" rx="1.2" fill="#7F1D1D" fillOpacity="0.86" />
            <text x="64.9" y="39.8" textAnchor="middle" fill="#FEE2E2" fontSize="1.6" fontWeight="700">渗流路径</text>
          </g>
        </svg>
      </div>
    </PanelCard>
  );
}

function CommunityPerceptionGapBoard() {
  return (
    <PanelCard icon={Activity} title="社区感知缺口" accent="red">
      <div className="rounded-lg border border-red-100 bg-red-50 p-3">
        <div className="text-xs font-semibold text-red-800">根因收束</div>
        <p className="mt-2 text-sm leading-6 text-red-950">
          企业没有把周边社区情绪视作安全变量，导致盗割风险、环保不信任、就业不满和索赔动员在事故前后快速串联。
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {["社区投诉", "环保担忧", "就业摩擦", "索赔动员"].map((item) => (
          <div key={item} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
            {item}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function FactorChain({
  title,
  subtitle,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  subtitle: string;
  items: string[];
  icon: ComponentType<{ className?: string }>;
  tone: "red" | "yellow";
}) {
  const colorClass = tone === "red" ? "border-red-100 bg-red-50 text-red-700" : "border-amber-100 bg-amber-50 text-amber-700";
  const dotClass = tone === "red" ? "bg-red-600" : "bg-amber-500";
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-950">{title}</div>
          <div className="text-[11px] text-gray-500">{subtitle}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={item}>
            <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-2.5 py-2 text-xs leading-5 text-gray-700">
              <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`} />
              <span className="flex-1">{item}</span>
            </div>
            {index < items.length - 1 && (
              <div className="flex h-5 items-center justify-center text-gray-300">
                <ArrowRight className="h-3.5 w-3.5 rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpatialAssetMap({ selectedCase }: { selectedCase: CaseItem }) {
  const layerOptions = CASE_MAP_LAYERS.zambia;
  const [activeLayerId, setActiveLayerId] = useState<CaseMapLayerId>("admin");
  const activeLayer = layerOptions.find((layer) => layer.id === activeLayerId) ?? layerOptions[0];

  return (
    <PanelCard icon={MapPin} title="空间定位" accent="blue">
      <div className="relative h-[336px] overflow-hidden rounded-lg border border-gray-200 bg-slate-100">
        <LeafletMap
          center={selectedCase.coordinates}
          zoom={8}
          minZoom={5}
          maxZoom={12}
          tileUrl={activeLayer.tileUrl}
          tileAttribution={activeLayer.tileAttribution}
          overlayTileUrl={activeLayer.overlayTileUrl}
          overlayTileAttribution={activeLayer.overlayTileAttribution}
          overlayTileOpacity={activeLayer.overlayTileOpacity}
        >
          <Marker position={toLeafletPoint(selectedCase.coordinates)} icon={CASE_POINT_ICON}>
            <Popup>
              <div className="text-sm font-semibold text-gray-900">{selectedCase.locationName}</div>
              <div className="text-xs text-gray-500">事故点 / 尾矿坝</div>
            </Popup>
          </Marker>
        </LeafletMap>

        <div className="absolute left-3 top-3 z-[500] rounded-lg bg-white/95 px-3 py-2 shadow-sm">
          <div className="text-xs font-semibold text-gray-950">赞比亚 · 铜带省</div>
        </div>
        <CaseMapLayerSwitch layers={layerOptions} activeLayerId={activeLayerId} onChange={setActiveLayerId} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MapBadge label="空间标签" value="中国境外建成早期大型有色金属矿山" />
        <MapBadge label="产能标签" value="年总产能 > 3万吨" />
      </div>
    </PanelCard>
  );
}

function MapBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="mt-0.5 truncate text-xs font-semibold text-gray-950">{value}</div>
    </div>
  );
}

function OwnershipTree() {
  return (
    <PanelCard icon={Building2} title="主体穿透" accent="blue">
      <div className="space-y-3">
        {ownershipNodes.map((node, index) => (
          <div key={node.name}>
            <div className={`rounded-lg border p-3 ${index === 0 ? "border-blue-100 bg-blue-50" : "border-red-100 bg-red-50"}`}>
              <div className="flex items-center gap-2">
                {index === 0 ? <Landmark className="h-4 w-4 text-[#005BBB]" /> : <Factory className="h-4 w-4 text-red-700" />}
                <div className="text-sm font-semibold text-gray-950">{node.name}</div>
              </div>
              <div className="mt-1 text-xs leading-5 text-gray-600">{node.detail}</div>
            </div>
            {index < ownershipNodes.length - 1 && (
              <div className="ml-5 flex h-8 items-center gap-2 border-l border-dashed border-gray-300 pl-4 text-[11px] text-gray-500">
                <ArrowRight className="h-3.5 w-3.5 rotate-90" />
                控股/管理/责任传导链路，股权比例按公开年报持续校验
              </div>
            )}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function FinancialResilienceBoard({ selectedCase }: { selectedCase: CaseItem }) {
  const operatingData = [
    { label: "2025H1收益", value: selectedCase.financials.revenueH1UsdBn, color: "#005BBB" },
    { label: "2025H1净利润", value: selectedCase.financials.profitH1UsdBn, color: "#16A34A" },
  ];

  return (
    <PanelCard icon={BarChart3} title="经营承压" accent="green">
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="2025H1收益" value={`$${selectedCase.financials.revenueH1UsdBn.toFixed(3)}B`} detail="同比 -12.9%" />
        <KpiTile label="2025H1净利润" value={`$${selectedCase.financials.profitH1UsdBn.toFixed(3)}B`} detail="同比 +22.5%" />
        <KpiTile label="经营状态" value="盈利上升" detail="收入承压但利润改善" />
      </div>

      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={operatingData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 2]} tick={{ fontSize: 10 }} tickFormatter={(value) => `$${value}B`} />
            <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={74} />
            <ChartTooltip formatter={(value) => [`$${Number(value).toFixed(3)}B`, "金额"]} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {operatingData.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PanelCard>
  );
}

function KpiTile({ label, value, detail, danger = false }: { label: string; value: string; detail: string; danger?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${danger ? "border-red-100 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${danger ? "text-red-700" : "text-gray-950"}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-gray-500">{detail}</div>
    </div>
  );
}

function EnvironmentalImpactBoard({ selectedCase }: { selectedCase: CaseItem }) {
  const nodes = [
    { label: "尾矿坝", x: 46, y: 122, level: "source", labelY: 146 },
    { label: "姆旺巴希河", x: 126, y: 86, level: "river", labelY: 56 },
    { label: "卡富埃河", x: 210, y: 86, level: "river", labelY: 56 },
    { label: "饮用水", x: 320, y: 76, level: "asset", labelY: 100, labelX: 318 },
    { label: "农田", x: 298, y: 132, level: "asset", labelY: 176 },
    { label: "渔业生态", x: 316, y: 166, level: "asset", labelY: 176, labelX: 246 },
  ];

  return (
    <PanelCard icon={Waves} title="污染扩散" accent="red">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-inner">
        <svg viewBox="0 0 380 238" className="h-56 w-full" role="img" aria-label="水系扩散拓扑图">
          <defs>
            <linearGradient id="watershed-bg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="58%" stopColor="#111827" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="clean-river" x1="0" x2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
            <linearGradient id="pollution-plume" x1="0" x2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.95" />
              <stop offset="52%" stopColor="#F97316" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#FACC15" stopOpacity="0.6" />
            </linearGradient>
            <filter id="water-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="380" height="238" rx="10" fill="url(#watershed-bg)" />
          <path d="M28 44 C72 28 114 42 152 30 C196 16 238 34 280 24 C318 15 344 26 364 22 L364 232 L28 232 Z" fill="#1E293B" opacity="0.42" />
          <path d="M24 186 C76 164 126 176 176 158 C224 142 282 160 356 136 L356 232 L24 232 Z" fill="#334155" opacity="0.34" />

          <text x="24" y="31" fill="#F8FAFC" fontSize="13" fontWeight="700">卡富埃水系污染传导</text>
          <text x="24" y="49" fill="#94A3B8" fontSize="10">尾矿浆外泄后沿支流进入主干水系，并向农业、饮水与生态受体扩散。</text>

          <motion.path
            d="M46 122 C78 105 96 91 126 86 C156 81 182 96 210 86 C248 74 284 72 320 76"
            fill="none"
            stroke="url(#clean-river)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="10 8"
            filter="url(#water-glow)"
            animate={{ strokeDashoffset: [0, -120] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
          />
          <motion.path
            d="M46 122 C88 144 150 150 208 134 C244 124 270 124 298 132 C304 146 310 158 316 166"
            fill="none"
            stroke="url(#pollution-plume)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="9 7"
            filter="url(#water-glow)"
            animate={{ strokeDashoffset: [0, -88] }}
            transition={{ duration: 3.1, repeat: Infinity, ease: "linear" }}
          />

          <path d="M210 86 C246 74 284 72 320 76" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeDasharray="5 7" opacity="0.85" />
          <path d="M210 86 C236 107 264 124 298 132" fill="none" stroke="#F97316" strokeWidth="2.2" strokeDasharray="5 7" opacity="0.88" />
          <path d="M298 132 C304 146 310 158 316 166" fill="none" stroke="#F97316" strokeWidth="2.2" strokeDasharray="5 7" opacity="0.88" />

          {nodes.map((node) => {
            const isSource = node.level === "source";
            const isRiver = node.level === "river";
            return (
              <g key={node.label}>
                {isSource && <circle cx={node.x} cy={node.y} r="24" fill="#DC2626" opacity="0.18" />}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSource ? 15 : isRiver ? 11 : 10}
                  fill={isSource ? "#DC2626" : isRiver ? "#0F172A" : "#1E293B"}
                  stroke={isSource ? "#FEE2E2" : isRiver ? "#67E8F9" : "#FBBF24"}
                  strokeWidth={isSource ? 3 : 2}
                />
                <circle cx={node.x} cy={node.y} r={isSource ? 5 : 3.5} fill={isSource ? "#FEE2E2" : isRiver ? "#67E8F9" : "#FBBF24"} />
                <rect
                  x={(node.labelX ?? node.x) - 34}
                  y={node.labelY}
                  width="68"
                  height="20"
                  rx="6"
                  fill="#0F172A"
                  fillOpacity="0.82"
                  stroke="#334155"
                />
                <text x={node.labelX ?? node.x} y={node.labelY + 14} textAnchor="middle" fill="#E2E8F0" fontSize="9.5" fontWeight="700">
                  {node.label}
                </text>
              </g>
            );
          })}

          <g>
            <rect x="24" y="210" width="98" height="20" rx="7" fill="#7F1D1D" fillOpacity="0.9" stroke="#FCA5A5" strokeOpacity="0.6" />
            <text x="36" y="224" fill="#FEE2E2" fontSize="9.5" fontWeight="700">核心污染源</text>
            <rect x="134" y="210" width="98" height="20" rx="7" fill="#083344" fillOpacity="0.85" stroke="#67E8F9" strokeOpacity="0.55" />
            <text x="146" y="224" fill="#CFFAFE" fontSize="9.5" fontWeight="700">河道传播</text>
            <rect x="244" y="210" width="112" height="20" rx="7" fill="#451A03" fillOpacity="0.85" stroke="#FBBF24" strokeOpacity="0.55" />
            <text x="256" y="224" fill="#FEF3C7" fontSize="9.5" fontWeight="700">下游受体暴露</text>
          </g>
        </svg>
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-600">{selectedCase.impact}</p>
    </PanelCard>
  );
}

function WaterQualitySimulator() {
  return (
    <PanelCard icon={Droplets} title="水质变化" accent="blue">
      <div className="grid grid-cols-3 gap-2">
        {waterQualityTimeline.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border px-3 py-3 ${
              item.tone === "critical"
                ? "border-red-100 bg-red-50"
                : item.tone === "warning"
                  ? "border-amber-100 bg-amber-50"
                  : "border-emerald-100 bg-emerald-50"
            }`}
          >
            <div className="text-[11px] text-gray-500">{item.date}</div>
            <div className="mt-1 text-sm font-semibold text-gray-950">{item.label}</div>
            <div className="mt-3 space-y-1 text-[11px] text-gray-600">
              <div>pH：{item.ph}</div>
              <div>重金属：{item.metal}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <GaugeDial label="pH状态" value="异常 -> 回落" tone="blue" />
        <GaugeDial label="重金属" value="超标 -> 回落" tone="red" />
      </div>
    </PanelCard>
  );
}

function GaugeDial({ label, value, tone }: { label: string; value: string; tone: "blue" | "red" }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>{label}</span>
        <Activity className={`h-3.5 w-3.5 ${tone === "red" ? "text-red-700" : "text-[#005BBB]"}`} />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${tone === "red" ? "w-[72%] bg-red-600" : "w-[54%] bg-[#005BBB]"}`} />
      </div>
      <div className="mt-2 text-xs font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function LegalBlackSwanBoard({ selectedCase }: { selectedCase: CaseItem }) {
  return (
    <PanelCard icon={Gavel} title="赔款压力" accent="red">
      <div className="rounded-lg border border-red-200 bg-red-950 p-4 text-white">
        <div className="flex items-center gap-2 text-xs text-red-100">
          <Scale className="h-4 w-4" />
          居民/农户集体诉讼模块
        </div>
        <div className="mt-3 text-3xl font-semibold tracking-normal">$80B</div>
        <div className="mt-1 text-sm text-red-100">环境修复托管金诉讼请求</div>
        <div className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-xs leading-5 text-red-50">
          追加诉求：紧急救助与评估基金 ${selectedCase.financials.emergencyFundMinUsdMn}M - ${selectedCase.financials.emergencyFundMaxUsdMn}M
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ImpactCompareRow label="半年收益" value="$1.752B" percent={3.8} color="bg-[#005BBB]" />
        <ImpactCompareRow label="半年净利润" value="$0.371B" percent={1.2} color="bg-emerald-600" />
        <ImpactCompareRow label="索赔请求" value="$80B" percent={100} color="bg-red-700" />
      </div>
    </PanelCard>
  );
}

function ImpactCompareRow({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-950">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
