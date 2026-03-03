import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Users, Building2, AlertCircle, AlertTriangle, Target, ArrowLeft, FileText, TrendingUp, Shield, X, ChevronRight, Calendar, Filter, Clock, Flame, CloudLightning, Globe2, Activity, Gavel, Diamond } from "lucide-react";
import { MapContainer, TileLayer, Marker, Circle, Popup, GeoJSON, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { FeatureCollection } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { mockEvents as allMockEvents } from '../../data/eventsData';
import KnowledgeBaseSelector from '../../components/KnowledgeBaseSelector';
import { KnowledgeItem } from '../../data/knowledgeBase';

// 非洲大陆边界
const AFRICA_BOUNDS: [[number, number], [number, number]] = [
  [-40, -20],
  [42, 52]
];

// 从真实事件数据中筛选并适配为影响模拟器需要的格式
const filterAndAdaptEvents = (
  countryIds: string[],
  countryNames: string[],
  timeRangeDays: number
) => {
  const now = new Date();
  const startDate = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);

  // 根据热度映射严重程度
  const popularityToSeverity = (popularity: number): 'high' | 'medium' | 'low' => {
    if (popularity >= 90) return 'high';
    if (popularity >= 80) return 'medium';
    return 'low';
  };

  // 筛选事件：根据国家名称和时间范围
  return allMockEvents
    .filter(event => {
      const eventDate = new Date(event.datetime);
      const isInTimeRange = eventDate >= startDate && eventDate <= now;
      const isInCountry = countryNames.includes(event.country);
      return isInTimeRange && isInCountry;
    })
    .map(event => {
      const tagId = event.tags[0] || "pol-stability";
      const tagName = tagIdToName[tagId] || "政治稳定性";
      const severity = popularityToSeverity(event.popularity);

      return {
        id: event.id,
        type: tagName, // 使用中文标签名
        severity,
        label: event.title,
        location: event.coordinates,
        country: event.country,
        date: event.datetime.split('T')[0],
        affectedPopulation: Math.floor(Math.random() * 500000) + 10000, // 保留此字段用于影响分析
        description: event.summary,
        popularity: event.popularity,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// 事件图层配置 - 使用标签体系分类（与重点项目一致）
const eventLayerTypeConfig: Record<string, {
  label: string;
  color: string;
  icon: any;
  category: string;
}> = {
  // 政治-制度维度
  "政治稳定性": {
    label: "政治稳定性",
    color: "#005BBB",
    icon: Globe2,
    category: "政治-制度"
  },
  "法律法规": {
    label: "法律法规",
    color: "#005BBB",
    icon: Gavel,
    category: "政治-制度"
  },
  "双边关系": {
    label: "双边关系",
    color: "#005BBB",
    icon: AlertTriangle,
    category: "政治-制度"
  },
  "地缘政治": {
    label: "地缘政治",
    color: "#005BBB",
    icon: Globe2,
    category: "政治-制度"
  },
  // 社会-环境维度
  "经济韧性": {
    label: "经济韧性",
    color: "#10B981",
    icon: TrendingUp,
    category: "社会-环境"
  },
  "社会治安": {
    label: "社会治安",
    color: "#10B981",
    icon: Shield,
    category: "社会-环境"
  },
  "自然灾害": {
    label: "自然灾害",
    color: "#10B981",
    icon: CloudLightning,
    category: "社会-环境"
  },
  "医疗卫生": {
    label: "医疗卫生",
    color: "#10B981",
    icon: Activity,
    category: "社会-环境"
  },
  "文化宗教": {
    label: "文化宗教",
    color: "#10B981",
    icon: Globe2,
    category: "社会-环境"
  },
  "出行安全": {
    label: "出行安全",
    color: "#10B981",
    icon: MapPin,
    category: "社会-环境"
  },
  "应急资源": {
    label: "应急资源",
    color: "#10B981",
    icon: Activity,
    category: "社会-环境"
  },
  // 安全-技术维度
  "恐怖主义": {
    label: "恐怖主义",
    color: "#DC2626",
    icon: Flame,
    category: "安全-技术"
  },
  "网络安全": {
    label: "网络安全",
    color: "#DC2626",
    icon: Shield,
    category: "安全-技术"
  },
  "供应链安全": {
    label: "供应链安全",
    color: "#DC2626",
    icon: TrendingUp,
    category: "安全-技术"
  },
  "领事保护": {
    label: "领事保护",
    color: "#DC2626",
    icon: Shield,
    category: "安全-技术"
  },
};

// 根据热度值获取颜色
const getPopularityColor = (popularity: number): string => {
  if (popularity >= 90) return '#DC2626'; // 90-98: 红色（高热度）
  if (popularity >= 85) return '#F59E0B'; // 85-89: 橙色（中高热度）
  if (popularity >= 80) return '#FBBF24'; // 80-84: 黄色（中等热度）
  if (popularity >= 75) return '#34D399'; // 75-79: 浅绿色（中低热度）
  return '#10B981'; // 70-74: 绿色（低热度）
};

// 时间选项
const timeOptions = [
  { id: "week-1", label: "近1周", days: 7 },
  { id: "week-2", label: "近2周", days: 14 },
  { id: "month-1", label: "近1月", days: 30 },
  { id: "quarter-1", label: "近1季度", days: 90 },
];

// 非洲54个国家和5个地区
const africanCountries = [
  // 北非地区
  { id: "egypt", name: "埃及", nameEn: "Egypt", region: "北非", center: [30, 26] as [number, number], bounds: [[25, 35], [22, 37]] as [[number, number], [number, number]] },
  { id: "libya", name: "利比亚", nameEn: "Libya", region: "北非", center: [17, 25] as [number, number], bounds: [[20, 10], [25, 38]] as [[number, number], [number, number]] },
  { id: "tunisia", name: "突尼斯", nameEn: "Tunisia", region: "北非", center: [9, 34] as [number, number], bounds: [[7, 12], [30, 38]] as [[number, number], [number, number]] },
  { id: "algeria", name: "阿尔及利亚", nameEn: "Algeria", region: "北非", center: [2, 28] as [number, number], bounds: [[-9, 12], [18, 38]] as [[number, number], [number, number]] },
  { id: "morocco", name: "摩洛哥", nameEn: "Morocco", region: "北非", center: [-8, 32] as [number, number], bounds: [[-18, -2], [21, 36]] as [[number, number], [number, number]] },
  { id: "sudan", name: "苏丹", nameEn: "Sudan", region: "北非", center: [30, 15] as [number, number], bounds: [[22, 39], [3, 23]] as [[number, number], [number, number]] },

  // 西非地区
  { id: "nigeria", name: "尼日利亚", nameEn: "Nigeria", region: "西非", center: [8, 10] as [number, number], bounds: [[2, 15], [4, 14]] as [[number, number], [number, number]] },
  { id: "ghana", name: "加纳", nameEn: "Ghana", region: "西非", center: [-2, 8] as [number, number], bounds: [[-3, 2], [4, 12]] as [[number, number], [number, number]] },
  { id: "senegal", name: "塞内加尔", nameEn: "Senegal", region: "西非", center: [-15, 14] as [number, number], bounds: [[-18, -11], [12, 17]] as [[number, number], [number, number]] },
  { id: "mali", name: "马里", nameEn: "Mali", region: "西非", center: [-3, 17] as [number, number], bounds: [[-13, 5], [10, 25]] as [[number, number], [number, number]] },
  { id: "ivory-coast", name: "科特迪瓦", nameEn: "Côte d'Ivoire", region: "西非", center: [-5, 8] as [number, number], bounds: [[-9, -2], [4, 11]] as [[number, number], [number, number]] },

  // 东非地区
  { id: "kenya", name: "肯尼亚", nameEn: "Kenya", region: "东非", center: [38, -1] as [number, number], bounds: [[33, 42], [-5, 6]] as [[number, number], [number, number]] },
  { id: "ethiopia", name: "埃塞俄比亚", nameEn: "Ethiopia", region: "东非", center: [40, 10] as [number, number], bounds: [[33, 48], [3, 15]] as [[number, number], [number, number]] },
  { id: "tanzania", name: "坦桑尼亚", nameEn: "Tanzania", region: "东非", center: [35, -6] as [number, number], bounds: [[29, 41], [-12, 0]] as [[number, number], [number, number]] },
  { id: "uganda", name: "乌干达", nameEn: "Uganda", region: "东非", center: [33, 1] as [number, number], bounds: [[29, 36], [-2, 5]] as [[number, number], [number, number]] },
  { id: "somalia", name: "索马里", nameEn: "Somalia", region: "东非", center: [48, 6] as [number, number], bounds: [[40, 52], [-5, 12]] as [[number, number], [number, number]] },
  { id: "mozambique", name: "莫桑比克", nameEn: "Mozambique", region: "东非", center: [36, -18] as [number, number], bounds: [[30, 41], [-27, -10]] as [[number, number], [number, number]] },

  // 中非地区
  { id: "drc", name: "刚果(金)", nameEn: "DRC", region: "中非", center: [23, -4] as [number, number], bounds: [[12, 32], [-14, 6]] as [[number, number], [number, number]] },
  { id: "cameroon", name: "喀麦隆", nameEn: "Cameroon", region: "中非", center: [12, 5] as [number, number], bounds: [[8, 17], [1, 13]] as [[number, number], [number, number]] },
  { id: "chad", name: "乍得", nameEn: "Chad", region: "中非", center: [19, 15] as [number, number], bounds: [[13, 25], [7, 24]] as [[number, number], [number, number]] },
  { id: "car", name: "中非共和国", nameEn: "Central African Republic", region: "中非", center: [21, 7] as [number, number], bounds: [[14, 28], [2, 12]] as [[number, number], [number, number]] },

  // 南非地区
  { id: "south-africa", name: "南非", nameEn: "South Africa", region: "南非", center: [24, -29] as [number, number], bounds: [[16, 33], [-35, -22]] as [[number, number], [number, number]] },
  { id: "zimbabwe", name: "津巴布韦", nameEn: "Zimbabwe", region: "南非", center: [30, -19] as [number, number], bounds: [[25, 34], [-23, -15]] as [[number, number], [number, number]] },
  { id: "zambia", name: "赞比亚", nameEn: "Zambia", region: "南非", center: [28, -13] as [number, number], bounds: [[21, 34], [-19, -8]] as [[number, number], [number, number]] },
  { id: "botswana", name: "博茨瓦纳", nameEn: "Botswana", region: "南非", center: [25, -22] as [number, number], bounds: [[19, 30], [-27, -17]] as [[number, number], [number, number]] },
];

// 地区列表
const regions = [
  { id: "north-africa", name: "北非地区", countries: ["埃及", "利比亚", "突尼斯", "阿尔及利亚", "摩洛哥", "苏丹"], center: [10, 25] as [number, number] },
  { id: "west-africa", name: "西非地区", countries: ["尼日利亚", "加纳", "塞内加尔", "马里", "科特迪瓦"], center: [-5, 12] as [number, number] },
  { id: "east-africa", name: "东非地区", countries: ["肯尼亚", "埃塞俄比亚", "坦桑尼亚", "乌干达", "索马里", "莫桑比克"], center: [38, 0] as [number, number] },
  { id: "central-africa", name: "中非地区", countries: ["刚果(金)", "喀麦隆", "乍得", "中非共和国"], center: [20, 0] as [number, number] },
  { id: "southern-africa", name: "南非地区", countries: ["南非", "津巴布韦", "赞比亚", "博茨瓦纳"], center: [26, -22] as [number, number] },
];

// 英文标签ID到中文标签名的映射
const tagIdToName: Record<string, string> = {
  "pol-stability": "政治稳定性",
  "economic-resilience": "经济韧性",
  "public-security": "社会治安",
  "natural-disasters": "自然灾害",
  "health": "医疗卫生",
  "terrorism": "恐怖主义",
  "laws-regulations": "法律法规",
  "culture-religion": "文化宗教",
  "bilateral-relations": "双边关系",
  "geopolitics": "地缘政治",
  "cybersecurity": "网络安全",
  "supply-chain": "供应链安全",
  "travel-safety": "出行安全",
  "consular-protection": "领事保护",
  "emergency-resources": "应急资源",
};

// 大分类颜色配置（与重点项目保持一致）
const categoryColors: Record<string, string> = {
  "政治-制度": "#005BBB",   // 蓝色
  "社会-环境": "#10B981",   // 绿色
  "安全-技术": "#DC2626",   // 红色
};

// 根据事件类型获取分类颜色
const getEventCategoryColor = (type: string): string => {
  const config = eventLayerTypeConfig[type];
  return categoryColors[config?.category || "政治-制度"];
};


// 将事件数据适配为影响模拟器需要的格式
function adaptEventsForSimulator(allEvents: typeof allMockEvents) {
  // 根据热度映射严重程度
  const popularityToSeverity = (popularity: number): 'high' | 'medium' | 'low' => {
    if (popularity >= 90) return 'high';
    if (popularity >= 80) return 'medium';
    return 'low';
  };

  // 转换为新格式，将英文标签ID映射为中文标签名
  return allEvents.map(event => {
    const tagId = event.tags[0] || "pol-stability"; // 使用第一个标签ID
    const tagName = tagIdToName[tagId] || "政治稳定性"; // 映射为中文标签名
    const severity = popularityToSeverity(event.popularity);

    return {
      id: event.id,
      location: event.coordinates,
      type: tagName, // 使用中文标签名
      severity,
      label: event.title,
      popularity: event.popularity,
      country: event.country,
      date: event.datetime.split('T')[0],
      description: event.summary,
      source: event.source,
      link: event.link,
    };
  });
}

// ���建事件图层图标（水滴形状）- 按分类颜色显示
const createEventLayerIcon = (type: string, popularity: number) => {
  // 获取事件配置
  const config = eventLayerTypeConfig[type];
  // 根据事件类型的分类获取颜色（与重点项目保持一致）
  const categoryColors: Record<string, string> = {
    "政治-制度": "#005BBB",   // 蓝色
    "社会-环境": "#10B981",   // 绿色
    "安全-技术": "#DC2626",   // 红色
  };
  const categoryColor = categoryColors[config?.category || "政治-制度"];

  const size = popularity >= 90 ? 16 : popularity >= 80 ? 14 : 12;

  const svgString = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.3));">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${categoryColor}" stroke="#FFFFFF" stroke-width="1.5"/>
      <circle cx="12" cy="10" r="2.5" fill="#FFFFFF"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-event-marker',
    html: `<div style="width:${size}px;height:${size}px;background-image:url(data:image/svg+xml;base64,${btoa(svgString)});background-size:contain;background-repeat:no-repeat;"/>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// 影响路径数据类型
interface ImpactPath {
  step: number;
  stage: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
}

// 应对措施数据类型
interface ResponseMeasure {
  category: string;
  priority: "immediate" | "short-term" | "long-term";
  measures: string[];
}

interface ImpactZone {
  type: "protest" | "attack" | "conflict" | "disaster";
  location: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  affectedPopulation: number;
  criticalInfrastructure: {
    type: string;
    name: string;
    distance: number;
    impactPath: ImpactPath[];
  }[];
  chineseAssets: {
    type: string;
    name: string;
    distance: number;
    risk: "high" | "medium" | "low";
    impactPath: ImpactPath[];
  }[];
  impactPath: ImpactPath[];
  responseMeasures: ResponseMeasure[];
}

// 模拟的中资资产数据
const chineseAssetsByRegion = {
  "north-africa": [
    { id: "na-1", name: "开罗办事处", type: "企业", risk: "medium" },
    { id: "na-2", name: "苏丹港物流中心", type: "物流", risk: "high" },
  ],
  "west-africa": [
    { id: "wa-1", name: "拉各斯中国商城", type: "商业", risk: "high" },
    { id: "wa-2", name: "阿比让办事处", type: "企业", risk: "low" },
    { id: "wa-3", name: "阿克拉物流中心", type: "物流", risk: "medium" },
  ],
  "east-africa": [
    { id: "ea-1", name: "亚的斯亚贝巴办事处", type: "企业", risk: "low" },
    { id: "ea-2", name: "吉布提港仓储中心", type: "物流", risk: "medium" },
    { id: "ea-3", name: "蒙巴萨经济特区", type: "园区", risk: "high" },
    { id: "ea-4", name: "内罗毕商城", type: "商业", risk: "medium" },
  ],
  "central-africa": [
    { id: "ca-1", name: "金沙萨办事处", type: "企业", risk: "high" },
    { id: "ca-2", name: "雅温得物流中心", type: "物流", risk: "medium" },
  ],
  "southern-africa": [
    { id: "sa-1", name: "达累斯萨拉姆港代表处", type: "企业", risk: "low" },
    { id: "sa-2", name: "卢萨卡建材市场", type: "商业", risk: "medium" },
    { id: "sa-3", name: "哈拉雷工业园", type: "园区", risk: "high" },
  ],
};

export default function ImpactSimulator() {
  const [view, setView] = useState<"selector" | "analysis">("selector");
  const [selectedTime, setSelectedTime] = useState(timeOptions[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [impactZone, setImpactZone] = useState<ImpactZone | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [expandedInfra, setExpandedInfra] = useState<Set<string>>(new Set());
  const [africaGeoJSON, setAfricaGeoJSON] = useState<FeatureCollection | null>(null);

  // 知识库选择状态
  const [selectedKnowledgeItems, setSelectedKnowledgeItems] = useState<KnowledgeItem[]>([]);

  // 事件图层相关状态
  const [showEventsLayer, setShowEventsLayer] = useState<boolean>(false);
  const [eventLayerFilterType, setEventLayerFilterType] = useState<string>("");
  const [eventLayerFilterSeverity, setEventLayerFilterSeverity] = useState<string>("");

  // 加载并适配真实事件数据
  const realEvents = useMemo(() => adaptEventsForSimulator(allMockEvents), []);

  // 筛选后的事件图层事件
  const filteredEventLayerEvents = useMemo(() => {
    return realEvents.filter(event => {
      if (eventLayerFilterType && event.type !== eventLayerFilterType) return false;
      if (eventLayerFilterSeverity && event.severity !== eventLayerFilterSeverity) return false;
      return true;
    });
  }, [realEvents, eventLayerFilterType, eventLayerFilterSeverity]);

  // 加载非洲国家边界数据
  useEffect(() => {
    fetch('/data/african-countries-only.geojson')
      .then(res => res.json())
      .then(data => setAfricaGeoJSON(data))
      .catch(err => console.error('加载非洲国家边界数据失败:', err));
  }, []);

  // 处理地区选择
  const handleRegionSelect = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedCountry("");
    const region = regions.find(r => r.id === regionId);
    if (region) {
      const regionCountries = africanCountries.filter(c => region.countries.includes(c.name));
      const countryIds = regionCountries.map(c => c.id);
      const countryNames = region.countries;
      const events = filterAndAdaptEvents(countryIds, countryNames, selectedTime.days);
      setFilteredEvents(events);
    }
  };

  // 处理国家选择
  const handleCountrySelect = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedRegion("");
    const country = africanCountries.find(c => c.id === countryId);
    if (country) {
      const events = filterAndAdaptEvents([countryId], [country.name], selectedTime.days);
      setFilteredEvents(events);
    }
  };

  // 处理事件类型筛选
  const handleEventTypeFilter = (type: string) => {
    setSelectedEventType(type);
  };

  // 获取筛选后的事件
  const getDisplayEvents = () => {
    if (!selectedEventType) return filteredEvents;
    return filteredEvents.filter(e => e.type === selectedEventType);
  };

  // 生成影响路径
  const generateImpactPath = (eventType: string): ImpactPath[] => {
    const paths: Record<string, ImpactPath[]> = {
      // 法律法规事件的影响路径（针对埃及通过新投资法）
      "法律法规": [
        { step: 1, stage: "政策解读", description: "新投资法通过，需深入研读法律条款，评估对现有业务的影响", severity: "medium" },
        { step: 2, stage: "合规审查", description: "对照新法律要求，审查现有投资合同和业务模式是否符合规定", severity: "high" },
        { step: 3, stage: "机遇评估", description: "评估特殊经济区税收优惠和土地政策带来的商业机会", severity: "medium" },
        { step: 4, stage: "战略调整", description: "考虑在特殊经济区设立分支机构或搬迁现有业务", severity: "low" },
      ],
      protest: [
        { step: 1, stage: "直接冲击", description: "抗议活动导致交通中断，影响员工通勤", severity: "high" },
        { step: 2, stage: "供应链影响", description: "物流延迟导致原材料短缺，生产进度放缓", severity: "high" },
        { step: 3, stage: "商业运营", description: "门店营业时间受限，客流量下降30%", severity: "medium" },
        { step: 4, stage: "声誉风险", description: "社交媒体负面传播，品牌形象受损", severity: "low" },
      ],
      conflict: [
        { step: 1, stage: "安全威胁", description: "冲突导致安全环境恶化，存在武装袭击风险", severity: "critical" },
        { step: 2, stage: "人员撤离", description: "必要人员紧急撤离，仅保留最小团队", severity: "high" },
        { step: 3, stage: "资产风险", description: "资产可能成为袭击目标，存在抢夺风险", severity: "critical" },
        { step: 4, stage: "供应链断裂", description: "运输路线受阻，供应链完全中断", severity: "high" },
      ],
      attack: [
        { step: 1, stage: "直接冲击", description: "袭击事件造成设施损坏和人员伤亡", severity: "critical" },
        { step: 2, stage: "运营中断", description: "生产活动全面暂停，需要时间恢复", severity: "high" },
        { step: 3, stage: "安全升级", description: "安保成本激增，需要加强防护措施", severity: "medium" },
        { step: 4, stage: "心理影响", description: "员工心理压力增大，工作效率下降", severity: "medium" },
      ],
      disaster: [
        { step: 1, stage: "设施损毁", description: "灾害导致基础设施严重受损", severity: "critical" },
        { step: 2, stage: "人员伤亡", description: "造成人员伤亡，需要紧急救治", severity: "critical" },
        { step: 3, stage: "供应链中断", description: "物流网络瘫痪，物资运输受阻", severity: "high" },
        { step: 4, stage: "恢复周期", description: "恢复周期长，经济损失严重", severity: "high" },
      ],
    };

    // 如果是其他15种事件类型，根据分类返回相应的路径
    if (paths[eventType]) {
      return paths[eventType];
    }

    // 根据事件分类返回默认路径
    const config = eventLayerTypeConfig[eventType];
    const category = config?.category || "政治-制度";

    if (category === "政治-制度") {
      return paths["法律法规"];
    } else if (category === "安全-技术") {
      return paths["attack"];
    } else {
      return paths["protest"];
    }
  };

  // 生成应对措施
  const generateResponseMeasures = (eventType: string): ResponseMeasure[] => {
    // 法律法规事件的专门应对措施
    if (eventType === "法律法规") {
      return [
        {
          category: "政策研究",
          priority: "immediate",
          measures: [
            "组织法律团队研读新投资法全部条款",
            "咨询当地律师事务所以及中国驻埃及使领馆商务处",
            "对比新旧法律差异，重点关注投资者保护条款",
            "评估新法对现有投资结构和业务模式的影响",
          ],
        },
        {
          category: "合规审查",
          priority: "immediate",
          measures: [
            "全面审查现有投资合同的法律有效性",
            "确认公司注册地址是否在特殊经济区范围内",
            "检查是否符合享受税收优惠的条件",
            "评估需要调整的业务流程和合规要求",
          ],
        },
        {
          category: "机遇把握",
          priority: "short-term",
          measures: [
            "评估在苏伊士运河走廊设立分支机构的可行性",
            "研究特殊经济区的土地优惠和税收减免政策",
            "联系埃及投资局获取具体的投资指导",
            "考虑将现有业务迁入特殊经济区以享受政策红利",
          ],
        },
        {
          category: "战略规划",
          priority: "long-term",
          measures: [
            "制定长期投资战略，充分利用新法优惠政策",
            "加强与埃及政府部门的沟通，建立良好关系",
            "关注配套实施细则的出台",
            "考虑与其他中资企业联合投资，降低风险",
          ],
        },
      ];
    }

    // 其他事件的通用应对措施
    return [
      {
        category: "应急响应",
        priority: "immediate",
        measures: [
          "立即启动应急预案，成立应急指挥小组",
          "联系中国驻当地使领馆，寻求领事保护",
          "确保所有中方人员安全，建立位置追踪机制",
        ],
      },
      {
        category: "安全保障",
        priority: "immediate",
        measures: [
          "提升安保级别，增加安保人员数量",
          "检查并加固园区围墙和门窗",
          "与当地警方保持密切联系，请求加强巡逻",
        ],
      },
      {
        category: "业务连续性",
        priority: "short-term",
        measures: [
          "启用远程办公方案，维持核心业务运营",
          "联系供应商，调整物流配送时间",
          "与客户沟通，说明情况并争取理解",
        ],
      },
    ];
  };

  // 生成资产影响路径
  const generateAssetImpactPath = (assetType: string, eventType: string): ImpactPath[] => {
    // 法律法规事件对资产的影响
    if (eventType === "法律法规") {
      return [
        { step: 1, stage: "合规性审查", description: `需审查${assetType}是否符合新法律要求，可能需要调整运营模式`, severity: "high" },
        { step: 2, stage: "政策红利", description: `如位于特殊经济区，${assetType}可享受税收减免等优惠政策`, severity: "medium" },
        { step: 3, stage: "战略机遇", description: `新法提供了更好的投资者保护，有利于${assetType}长期发展`, severity: "low" },
      ];
    }

    // 其他事件的通用影响路径
    return [
      { step: 1, stage: "直接风险", description: `外部环境变化导致${assetType}运营受阻`, severity: "high" },
      { step: 2, stage: "人员安全", description: "员工安全受到威胁，部分人员无法到岗", severity: "high" },
      { step: 3, stage: "资产保护", description: "需要加强安保措施，保护资产安全", severity: "medium" },
    ];
  };

  // 获取国家边界样式
  const getCountryStyle = (feature: any) => {
    const props = feature.properties || {};
    const countryCode = props['ISO3166-1-Alpha-2'] || props.iso_a2 || props.ISO_A2;
    const countryName = props.name || props.NAME || props.admin;

    // 检查是否在选择的国家中
    const country = africanCountries.find(c => c.name === countryName || c.nameEn === countryName);
    const isCountrySelected = selectedCountry && country?.id === selectedCountry;

    // 检查是否在选择的地区中
    let isRegionSelected = false;
    if (selectedRegion && country) {
      const region = regions.find(r => r.id === selectedRegion);
      isRegionSelected = region?.countries.includes(country.name) || false;
    }

    if (isCountrySelected || isRegionSelected) {
      return {
        color: '#005BBB',
        weight: 3,
        fillColor: 'rgba(0, 91, 187, 0.2)',
        fillOpacity: 0.4,
      };
    }

    return {
      color: '#CBD5E1',
      weight: 1,
      fillColor: '#F3F4F6',
      fillOpacity: 0.3,
    };
  };

  // 国家边界交互事件
  const onEachCountry = (feature: any, layer: any) => {
    const props = feature.properties || {};
    const countryName = props.name || props.NAME || props.admin;

    layer.on({
      mouseover: (e: any) => {
        const target = e.target;
        const country = africanCountries.find(c => c.name === countryName || c.nameEn === countryName);
        const isCountrySelected = selectedCountry && country?.id === selectedCountry;

        let isRegionSelected = false;
        if (selectedRegion && country) {
          const region = regions.find(r => r.id === selectedRegion);
          isRegionSelected = region?.countries.includes(country.name) || false;
        }

        if (!isCountrySelected && !isRegionSelected) {
          target.setStyle({
            weight: 2,
            color: '#005BBB',
            fillOpacity: 0.4,
          });
        }

        layer.bindTooltip(
          `<div style="
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
          ">
            ${countryName}
          </div>`,
          {
            permanent: false,
            direction: 'top',
            offset: [0, -5],
          }
        );
      },
      mouseout: (e: any) => {
        const target = e.target;
        const country = africanCountries.find(c => c.name === countryName || c.nameEn === countryName);
        const isCountrySelected = selectedCountry && country?.id === selectedCountry;

        let isRegionSelected = false;
        if (selectedRegion && country) {
          const region = regions.find(r => r.id === selectedRegion);
          isRegionSelected = region?.countries.includes(country.name) || false;
        }

        if (!isCountrySelected && !isRegionSelected) {
          const style = getCountryStyle(feature);
          target.setStyle({
            weight: style.weight,
            color: style.color,
            fillOpacity: style.fillOpacity,
          });
        }

        layer.unbindTooltip();
      },
      click: () => {
        const country = africanCountries.find(c => c.name === countryName || c.nameEn === countryName);
        if (country) {
          handleCountrySelect(country.id);
        }
      },
    });
  };

  // 选择事件进行分析
  const handleEventSelect = (event: any) => {
    setSelectedEvent(event);

    // 找到所属地区
    const country = africanCountries.find(c => c.name === event.country);
    const region = regions.find(r => r.countries.includes(event.country));

    if (!country) return;

    // 生成影响区域数据
    const regionAssets = chineseAssetsByRegion[region?.id || "east-africa"] || [];

    const criticalInfrastructure = [
      { type: "医院", name: "中心医院", distance: 1.2, impactPath: generateAssetImpactPath("医院", event.type) },
      { type: "学校", name: "国际学校", distance: 0.8, impactPath: generateAssetImpactPath("学校", event.type) },
      { type: "电站", name: "主要配电站", distance: 1.5, impactPath: generateAssetImpactPath("电站", event.type) },
    ];

    const chineseAssets = regionAssets.map(asset => ({
      type: asset.type,
      name: asset.name,
      distance: Math.floor(Math.random() * 50) + 5,
      risk: asset.risk as "high" | "medium" | "low",
      impactPath: generateAssetImpactPath(asset.type, event.type),
    }));

    const mockImpactZone: ImpactZone = {
      type: event.type,
      location: event.country,
      coordinates: { lat: event.location[1], lng: event.location[0] },
      radius: event.type === "conflict" || event.type === "恐怖主义" ? 50
              : event.type === "disaster" || event.type === "自然灾害" ? 100
              : event.type === "法律法规" ? 30  // 法律法规事件影响范围适中
              : 20,
      affectedPopulation: event.affectedPopulation,
      criticalInfrastructure,
      chineseAssets,
      impactPath: generateImpactPath(event.type),
      responseMeasures: generateResponseMeasures(event.type),
    };

    setImpactZone(mockImpactZone);
    setView("analysis");
  };

  const getEventColor = (type: string) => {
    return getEventCategoryColor(type);
  };

  const getEventLabel = (type: string) => {
    return eventLayerTypeConfig[type]?.label || "事件";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "#DC2626";
      case "high": return "#EF4444";
      case "medium": return "#F59E0B";
      case "low": return "#10B981";
      default: return "#6B7280";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "#EF4444";
      case "medium": return "#F59E0B";
      case "low": return "#10B981";
      default: return "#6B7280";
    }
  };

  const handleBack = () => {
    setView("selector");
    setSelectedEvent(null);
    setImpactZone(null);
    setShowReport(false);
  };

  // 生成报告内容
  const generateReportContent = () => {
    if (!impactZone || !selectedEvent) return null;

    const currentDate = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 根据事件类型生成详细的事件背景
    const getEventBackground = () => {
      const backgrounds: Record<string, { title: string; content: string[] }> = {
        // 法律法规事件的背景分析（针对埃及通过新投资法）
        "法律法规": {
          title: "法律法规政策背景分析",
          content: [
            `${selectedEvent.date}，${impactZone.location}议会正式通过了具有里程碑意义的新投资法。该法案的通过是埃及政府深化经济改革、优化营商环境的重要举措，标志着埃及在吸引外资和促进经济发展方面迈出了关键一步。`,
            `根据法案内容，新投资法将在苏伊士运河走廊、红海沿岸等战略位置设立3个特殊经济区。这些区域将享受税收减免、土地使用优惠和审批程序简化等政策红利。同时，法律首次引入了国际仲裁机制，显著加强了对投资者权益的保护，解决了长期以来外国投资者对埃及法律体系的担忧。`,
            `从立法过程看，该法案在议会获得了压倒性支持，反映了各政治派对经济改革的共识。法案起草过程中，埃及政府广泛征求了国际商会、各国使领馆和跨国企业的意见，体现了开放和务实的态度。预计总统将在近日签署正式生效。`,
            `从地缘政治视角分析，此次立法具有深远的战略意义。埃及作为连接非洲和阿拉伯世界的重要枢纽，其投资环境的改善将产生示范效应，可能带动周边国家竞相完善投资法律体系。对于中国"一带一路"倡议在非洲的推进，这一新法律提供了更有利的制度保障。`,
          ],
        },
        protest: {
          title: "抗议活动事件背景分析",
          content: [
            `根据最新监测数据，${impactZone.location}于${selectedEvent.date}爆发大规模抗议活动。事件起因可追溯到当地长期积累的社会经济矛盾，包括高失业率、物价上涨和政治代表性不足等结构性问题。`,
            `抗议活动初期以和平示威形式开始，参与者主要来自城市中产阶级和工会组织。随着事态发展，抗议规模迅速扩大，参与人数从最初的数千人增长至数万人，并蔓延至全国多个主要城市。`,
            `当地政府对抗议活动的应对措施经历了从温和对话到强力镇压的转变，进一步激化了矛盾。国际社会对此次事件高度关注，多个国家和国际组织呼吁双方保持克制，通过对话解决分歧。`,
            `从地缘政治角度看，此次抗议活动可能对地区稳定产生深远影响。邻国已加强边境管控，防止事件外溢效应。同时，国际投资者对${impactZone.location}的政治风险评估正在重新审视，可能导致短期资本外流。`,
          ],
        },
        conflict: {
          title: "武装冲突事件背景分析",
          content: [
            `${impactZone.location}爆发的武装冲突已持续多日，是近年来该国最严重的安全危机之一。冲突双方分别为政府军和反政府武装组织，双方在多个地区爆发激烈交火。`,
            `根据情报分析，此次冲突的直接导火索是${selectedEvent.date}发生的一起袭击事件，造成多人伤亡。随后，反政府武装组织宣布对事件负责，并发动大规模报复性攻击。政府军随即展开军事反击，冲突迅速升级。`,
            `冲突已造成严重的人道主义危机。据联合国估计，已有数千人流离失所，其中包括大量妇女和儿童。当地医疗系统濒临崩溃，食品和饮用水供应紧张。国际救援组织正在紧急调集资源，准备提供人道主义援助。`,
            `从战略角度分析，此次武装冲突具有明显的地缘政治特征。冲突地区毗邻重要的国际贸易通道和国际运输走廊，可能对区域经济产生连锁反应。此外，外部势力的介入可能使局势更加复杂化。`,
          ],
        },
        attack: {
          title: "袭击事件背景分析",
          content: [
            `${selectedEvent.date}，${impactZone.location}发生严重的袭击事件，目标针对关键基础设施和人员密集场所。这是该国近三年来遭遇的最严重的恐怖袭击事件，引起国际社会强烈谴责。`,
            `根据初步调查，袭击由极端组织策划实施，袭击者使用爆炸装置和自动武器，造成大量人员伤亡。袭击发生后，多个极端组织宣布对事件负责，但责任归属尚需进一步核实。`,
            `此次袭击事件暴露出${impactZone.location}在安全防范方面存在的严重漏洞。分析认为，情报共享机制不畅、安保力量不足、应急响应迟缓等因素共同导致了袭击的成功实施。`,
            `事件发生后，当地政府立即启动最高级别安全警戒，在全国范围内展开大规模搜捕行动。同时，多国已发布旅行警告，建议公民谨慎前往${impactZone.location}。此次事件可能对当地旅游业和外国投资造成长期负面影响。`,
          ],
        },
        disaster: {
          title: "自然灾害事件背景分析",
          content: [
            `${impactZone.location}遭受严重自然灾害袭击，这是该国近几十年来遇到的最严重的自然灾害之一。灾害类型为${selectedEvent.label}，影响范围广泛，造成重大人员伤亡和财产损失。`,
            `根据气象部门数据，此次灾害的成因是极端气候条件与该地区特殊的地理环境相互作用的结果。灾害发生前，气象部门已发布预警，但预警信息的传递和应急准备仍存在改进空间。`,
            `灾害对当地基础设施造成严重破坏。道路交通中断，电力供应受损，通讯网络部分瘫痪。多个城镇和村庄与外界失去联系，灾情评估工作面临巨大挑战。救援队伍正在克服重重困难，努力向受灾最严重的地区推进。`,
            `从长远看，此次灾害可能对${impactZone.location}的经济发展产生深远影响。农业、旅游业等支柱产业受到重创，灾后重建预计需要数年时间。同时，灾害也暴露出城市规划和基础设施建设中存在的问题，需要进行深刻反思和改革。`,
          ],
        },
      };

      // 如果是其他15种事件类型，根据分类返回相应的背景
      if (backgrounds[impactZone.type]) {
        return backgrounds[impactZone.type];
      }

      // 根据事件分类返回默认背景
      const config = eventLayerTypeConfig[impactZone.type];
      const category = config?.category || "政治-制度";

      if (category === "政治-制度") {
        return backgrounds["法律法规"];
      } else if (category === "安全-技术") {
        return backgrounds["attack"];
      } else {
        return backgrounds["protest"];
      }
    };

    // 生成详细的影响评估
    const getImpactAssessment = () => {
      const highRiskAssets = impactZone.chineseAssets.filter(a => a.risk === "high").length;
      const estimatedLoss = impactZone.chineseAssets.length * 5000 + impactZone.affectedPopulation * 0.1;

      // 法律法规事件的专属评估
      if (impactZone.type === "法律法规") {
        return {
          demographic: {
            title: "政策覆盖人群评估",
            content: `新投资法将直接影响在${impactZone.location}投资兴业的外国企业及个人，覆盖约${Math.floor(impactZone.affectedPopulation * 0.5).toLocaleString()}名相关从业人员。其中，在特殊经济区规划的产业园区内预计将创造${Math.floor(impactZone.affectedPopulation * 0.2).toLocaleString()}个就业岗位，为当地居民提供大量工作机会。同时，法律改善将提升整体营商环境，间接惠及${Math.floor(impactZone.affectedPopulation * 0.8).toLocaleString()}居民。`,
          },
          infrastructure: {
            title: "基础设施配套影响评估",
            content: `新投资法明确提出将在苏伊士运河走廊、红海沿岸建设现代化基础设施，包括港口、公路、电力和通讯设施。预计未来3年内基础设施投资将增加${Math.floor(estimatedLoss * 0.05).toLocaleString()}万美元。特殊经济区内的基础设施标准将达到国际先进水平，为企业运营提供有力保障。同时，法律简化了审批程序，基础设施建设项目落地周期预计缩短40%以上。`,
          },
          economic: {
            title: "经济发展机遇评估",
            content: `从经济发展角度分析，新投资法的通过将为${impactZone.location}带来重大的积极影响。税收优惠政策和投资者保护机制将显著提升外国投资信心，预计未来5年外资流入将增加${Math.floor(estimatedLoss * 0.1).toLocaleString()}亿美元。特殊经济区的设立将重点发展制造业、物流业和金融服务业，预计年经济增长率将提升2-3个百分点。同时，新法律将创造大量就业机会，降低失业率，促进社会稳定。`,
          },
          chinese: {
            title: "中资资产战略机遇评估",
            content: `${impactZone.chineseAssets.length}处中资资产面临重大战略调整机遇，其中${highRiskAssets}处可优先享受政策红利。受影响的资产类型包括企业办事处、物流中心、商业设施等。对于中资企业而言，这是扩大投资规模、优化产业布局的战略窗口期。预计通过合理规划，中资企业可节省${Math.floor(estimatedLoss * 0.2).toLocaleString()}万美元的运营成本，并获得更完善的法律保护。建议优先考虑在苏伊士运河走廊特殊经济区设立区域总部。`,
          },
        };
      }

      // 其他事件的通用评估
      return {
        demographic: {
          title: "人口影响评估",
          content: `本次事件直接和间接影响约${impactZone.affectedPopulation.toLocaleString()}人，其中${Math.floor(impactZone.affectedPopulation * 0.3).toLocaleString()}人处于核心影响区域，面临严重的安全风险。受影响人口主要包括当地居民、外籍工作人员、跨国企业员工等群体。根据人口流动趋势分析，预计${Math.floor(impactZone.affectedPopulation * 0.15).toLocaleString()}人可能被迫离开家园，成为内部流离失所者。`,
        },
        infrastructure: {
          title: "基础设施影响评估",
          content: `事件对${impactZone.location}的基础设施造成不同程度的影响。交通基础设施首当其冲，主要道路和铁路运输受阻，影响范围达${impactZone.radius * 2}公里。电力设施受损导致部分区域停电，影响工商业活动和居民生活。通讯基础设施受到干扰，信息传递效率下降。此外，医疗设施承受巨大压力，部分医院已达到接收能力上限。`,
        },
        economic: {
          title: "经济影响评估",
          content: `从经济角度看，本次事件对${impactZone.location}的经济活动产生短期和长期双重影响。短期内，商业活动中断，消费需求下降，预计每日经济损失约${Math.floor(estimatedLoss * 0.01).toLocaleString()}万美元。中长期来看，投资者信心受挫，外资流入可能放缓，影响经济增长动力。受影响的主要行业包括采矿业、建筑业、零售业和旅游业。`,
        },
        chinese: {
          title: "中资资产影响评估",
          content: `${impactZone.chineseAssets.length}处中资资产受到不同程度影响，其中${highRiskAssets}处面临高风险。受影响的资产类型包括企业办事处、物流中心、经济特区、商业设施等。风险评估显示，高风险资产主要集中在核心影响区域，面临安全威胁、运营中断、供应链断裂等多重挑战。预计直接经济损失约${Math.floor(estimatedLoss * 0.1).toLocaleString()}万美元，间接损失难以估量。`,
        },
      };
    };

    const background = getEventBackground();
    const assessment = getImpactAssessment();

    return (
      <div className="space-y-8">
        {/* 报告头部 */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">地缘政治风险影响分析报告</h1>
              <p className="text-sm text-gray-500 mt-2">基于大数据和AI技术的智能分析</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getEventColor(impactZone.type) }} />
              <span className="text-sm font-medium text-gray-700">{getEventLabel(impactZone.type)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="text-gray-500">生成时间：</span>
              {currentDate}
            </div>
            <div>
              <span className="text-gray-500">报告编号：</span>
              IMP-{Date.now().toString().slice(-8)}
            </div>
            <div>
              <span className="text-gray-500">数据来源：</span>
              非洲出海安全官大数据平台
            </div>
          </div>
        </div>

        {/* 第一部分：事件背景 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#005BBB] text-white rounded-lg flex items-center justify-center text-sm">1</span>
            事件背景
          </h2>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getEventColor(impactZone.type) }} />
              <span className="font-semibold text-gray-900">{selectedEvent.label}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">{impactZone.location}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">{selectedEvent.date}</span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">{background.title}</h3>
            <div className="space-y-3">
              {background.content.map((paragraph, index) => (
                <p key={index} className="text-sm text-gray-700 leading-relaxed text-justify">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="bg-white rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-2">影响半径</div>
                <div className="text-2xl font-bold text-gray-900">{impactZone.radius} 公里</div>
                <div className="text-xs text-gray-600 mt-1">核心影响区域</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-2">受影响人口</div>
                <div className="text-2xl font-bold text-gray-900">{(impactZone.affectedPopulation / 10000).toFixed(1)} 万</div>
                <div className="text-xs text-gray-600 mt-1">直接和间接影响</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-2">波及中资资产</div>
                <div className="text-2xl font-bold text-gray-900">{impactZone.chineseAssets.length} 处</div>
                <div className="text-xs text-gray-600 mt-1">需要重点关注</div>
              </div>
            </div>
          </div>
        </div>

        {/* 第二部分：影响评估 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#005BBB] text-white rounded-lg flex items-center justify-center text-sm">2</span>
            影响评估
          </h2>

          <div className="space-y-4">
            {/* 人口影响 */}
            <div className="bg-blue-50 rounded-xl p-5">
              <h3 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {assessment.demographic.title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{assessment.demographic.content}</p>
            </div>

            {/* 基础设施影响 */}
            <div className="bg-orange-50 rounded-xl p-5">
              <h3 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                {assessment.infrastructure.title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{assessment.infrastructure.content}</p>
            </div>

            {/* 经济影响 */}
            <div className="bg-yellow-50 rounded-xl p-5">
              <h3 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                {assessment.economic.title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{assessment.economic.content}</p>
            </div>

            {/* 中资资产影响 */}
            <div className="bg-red-50 rounded-xl p-5">
              <h3 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" />
                {assessment.chinese.title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{assessment.chinese.content}</p>

              <div className="mt-4 pt-4 border-t border-red-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">受影响资产详情</h4>
                <div className="space-y-2">
                  {impactZone.chineseAssets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#005BBB]" />
                        <span className="text-sm text-gray-900">{asset.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{asset.type}</span>
                        <span className="text-xs text-gray-500">{asset.distance} km</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          asset.risk === "high"
                            ? "bg-red-100 text-red-700"
                            : asset.risk === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {asset.risk === "high" ? "高风险" : asset.risk === "medium" ? "中风险" : "低风险"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 影响路径分析 */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-md font-semibold text-gray-900 mb-4">影响路径传导机制</h3>
              <div className="space-y-4">
                {impactZone.impactPath.map((path, index) => (
                  <div key={index} className="relative pl-8 pb-4 border-l-2 border-gray-300 last:pb-0">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: getSeverityColor(path.severity) }} />
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">{path.stage}</div>
                        <p className="text-xs text-gray-600 leading-relaxed">{path.description}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{
                        backgroundColor: `${getSeverityColor(path.severity)}20`,
                        color: getSeverityColor(path.severity)
                      }}>
                        {path.severity === "critical" ? "危急" : path.severity === "high" ? "高" : path.severity === "medium" ? "中" : "低"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 第三部分：应对方案 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#005BBB] text-white rounded-lg flex items-center justify-center text-sm">3</span>
            应对方案
          </h2>

          <div className="space-y-4">
            {impactZone.responseMeasures.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#005BBB]" />
                    <span className="font-semibold text-gray-900">{category.category}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium" style={{
                    backgroundColor: category.priority === "immediate" ? "#FEE2E2" :
                                     category.priority === "short-term" ? "#FEF3C7" : "#DBEAFE",
                    color: category.priority === "immediate" ? "#DC2626" :
                           category.priority === "short-term" ? "#D97706" : "#2563EB"
                  }}>
                    {category.priority === "immediate" ? "立即执行" : category.priority === "short-term" ? "短期计划" : "长期规划"}
                  </span>
                </div>
                <div className="p-5">
                  <ul className="space-y-3">
                    {category.measures.map((measure, mIndex) => (
                      <li key={mIndex} className="flex items-start gap-3 text-sm text-gray-700">
                        <ChevronRight className="w-5 h-5 text-[#005BBB] mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{measure}</span>
                      </li>
                    ))}
                  </ul>

                  {category.priority === "immediate" && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-red-800">
                            <strong>紧急提示：</strong>以上措施需要在24小时内启动执行，请相关责任人立即落实。
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 第四部分：综合建议 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#005BBB] text-white rounded-lg flex items-center justify-center text-sm">4</span>
            综合建议与风险提示
          </h2>

          <div className="bg-blue-50 border-l-4 border-[#005BBB] rounded-r-xl p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">总体评估</h3>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>
                本次{getEventLabel(impactZone.type)}发生在{impactZone.location}，影响半径达{impactZone.radius}公里，
                受影响人口约{(impactZone.affectedPopulation / 10000).toFixed(1)}万人。
                事件波及{impactZone.chineseAssets.length}处中资资产，其中{impactZone.chineseAssets.filter(a => a.risk === "high").length}处面临高风险。
              </p>
              <p>
                基于多维度分析，建议相关企业立即启动应急响应机制，重点做好以下工作：第一，建立24小时应急指挥体系，确保信息畅通；第二，全面排查安全隐患，强化安保措施；第三，加强与当地政府、使领馆的沟通协调，寻求支持和保护；第四，做好人员撤离预案，确保生命安全；第五，评估供应链影响，制定业务连续性计划。
              </p>
              <p>
                从长远来看，此次事件暴露出在{impactZone.location}投资运营的潜在风险。建议企业重新审视在该国的投资策略，适当降低风险敞口，加强政治风险保险投保力度，同时考虑投资多元化战略，避免过度依赖单一市场。
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong>风险提示：</strong>本次事件可能对区域稳定产生连锁反应，建议密切关注周边国家的安全形势变化，及时调整安保策略。
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-green-900 leading-relaxed">
                  <strong>建议：</strong>加强与当地社区的合作关系，积极履行社会责任，提升企业形象，为长期发展奠定良好基础。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 第五部分：历史案例借鉴 */}
        {selectedKnowledgeItems.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#10B981] text-white rounded-lg flex items-center justify-center text-sm">5</span>
              类似事件历史经验借鉴
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-[#005BBB] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[#005BBB] leading-relaxed">
                  <strong>分析说明：</strong>
                  基于知识库中类似法律法规变更事件的历史案例分析，我们总结了以下具有借鉴价值的处置经验和最佳实践，可为当前应对埃及新投资法提供参考。
                </div>
              </div>
            </div>

            {/* 埃塞俄比亚2019年投资法改革案例 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
              <div className="bg-gradient-to-r from-[#005BBB] to-[#004090] px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">1</span>
                  <h3 className="text-base font-semibold text-white">埃塞俄比亚2019年投资法改革</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">事件背景</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    2019年，埃塞俄比亚颁布新《投资法》，开放了大量此前禁止外资进入的领域，包括电信、航空、电力等战略行业。同时设立了包括埃塞俄比亚投资委员会（EIC）作为一站式服务机构，大幅简化审批流程。
                  </p>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#10B981]" />
                    中资企业应对措施
                  </h4>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2 text-xs text-gray-700">
                      <ChevronRight className="w-4 h-4 text-[#005BBB] mt-0.5 flex-shrink-0" />
                      <span><strong>快速响应：</strong>某中资电信企业在法律生效后3个月内即与EIC建立联系，获得首个外资电信牌照试点的预审资格</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-gray-700">
                      <ChevronRight className="w-4 h-4 text-[#005BBB] mt-0.5 flex-shrink-0" />
                      <span><strong>合资策略：</strong>多家中资企业选择与当地知名企业合资，满足外资持股限制要求，同时获得本地化支持</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-gray-700">
                      <ChevronRight className="w-4 h-4 text-[#005BBB] mt-0.5 flex-shrink-0" />
                      <span><strong>政府关系：</strong>积极与埃塞俄比亚投资局沟通，参与政策解读会，及时掌握实施细则</span>
                    </li>
                  </ul>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#005BBB]" />
                    取得成效
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    先发企业获得市场先机，审批时间缩短60%，运营成本降低约25%。通过合资模式，成功规避了政策风险，本地化程度显著提升。
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#005BBB]" />
                    经验启示
                  </h4>
                  <div className="bg-amber-50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <strong>对当前事件的启示：</strong>埃及新投资法生效后，应立即启动政策研究，与埃及投资总局建立联系。建议采用合资合作模式，利用特殊经济区政策红利，优先布局制造业和物流业。重点关注国际仲裁条款，完善法律风险防范机制。
                    </p>
                  </div>
                </div>

                {/* 数据来源 */}
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span>数据来源：非洲多语种术语数据中心、中资企业非洲投资风险评估中心</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 肯尼亚2020年经济特区法案例 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
              <div className="bg-gradient-to-r from-[#10B981] to-[#059669] px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">2</span>
                  <h3 className="text-base font-semibold text-white">肯尼亚2020年特殊经济区政策</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">事件背景</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    2020年，肯尼亚政府颁布《特殊经济区（修订）条例》，在蒙巴萨、基苏木等地设立多个经济特区。政策提供10年免税期、土地租赁优惠、一站式审批服务等激励措施，重点吸引纺织、制药、电子产品组装等劳动密集型产业。
                  </p>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#10B981]" />
                    中资企业应对措施
                  </h4>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2 text-xs text-gray-700">
                      <ChevronRight className="w-4 h-4 text-[#005BBB] mt-0.5 flex-shrink-0" />
                      <span><strong>区位选择：</strong>某中资纺织企业综合评估后选择蒙巴萨特区，利用港口物流优势降低运输成本</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-gray-700">
                      <ChevronRight className="w-4 h-4 text-[#005BBB] mt-0.5 flex-shrink-0" />
                      <span><strong>产业集聚：</strong>多家相关产业链企业集中入驻，形成上下游协同效应</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-gray-700">
                      <ChevronRight className="w-4 h-4 text-[#005BBB] mt-0.5 flex-shrink-0" />
                      <span><strong>合规先行：</strong>聘请当地律师全程参与，确保完全符合特区准入要求和环保标准</span>
                    </li>
                  </ul>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#005BBB]" />
                    取得成效
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    入驻企业享受税收优惠，前三年税负降低约70%。产业集群效应显著，原材料采购成本下降15-20%。一站式审批使项目落地周期从18个月缩短至8个月。
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#005BBB]" />
                    经验启示
                  </h4>
                  <div className="bg-amber-50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <strong>对当前事件的启示：</strong>埃及苏伊士运河经济区具有类似优势，建议中资企业优先考虑该区域。应关注上下游产业链协同，推动产业集群式发展。在享受税收优惠的同时，务必重视合规审查，确保长期经营安全。
                    </p>
                  </div>
                </div>

                {/* 数据来源 */}
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span>数据来源：海外利益影响分析实验室、中资企业非洲投资风险评估中心</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 摩洛哥2021年投资激励法案案例 */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">3</span>
                  <h3 className="text-base font-semibold text-white">摩洛哥2021年投资激励法案</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">事件背景</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    2021年，摩洛哥通过《投资激励法案》，设立"国家投资优先清单"，对清单内行业提供最高5%的投资额补贴。法案首次引入投资者-国家争端解决机制（ISDS），允许国际仲裁。同时加强本地含量要求，规定外资企业需逐步提升本地采购比例。
                  </p>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#10B981]" />
                    中资企业应对措施
                  </h4>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2 text-xs text-gray-700">
                      <ChevronRight className="w-4 h-4 text-[#005BBB] mt-0.5 flex-shrink-0" />
                      <span><strong>政策解读：</strong>组织专门团队深入研究法案全文，识别符合自身业务的激励条款</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-gray-700">
                      <ChevronRight className="w-4 h-4 text-[#005BBB] mt-0.5 flex-shrink-0" />
                      <span><strong>本地化策略：</strong>制定5年本地化路线图，逐步提升本地员工比例和本地采购份额</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-gray-700">
                      <ChevronRight className="w-4 h-4 text-[#005BBB] mt-0.5 flex-shrink-0" />
                      <span><strong>法律保障：</strong>充分利用ISDS机制，在投资协议中明确仲裁条款，降低政治风险</span>
                    </li>
                  </ul>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#005BBB]" />
                    取得成效
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    符合条件企业获得政府补贴，平均投资回报率提升3-5个百分点。通过本地化策略，社区关系改善，政府支持度提升。ISDS机制为企业提供了额外法律保障，投资者信心显著增强。
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#005BBB]" />
                    经验启示
                  </h4>
                  <div className="bg-amber-50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <strong>对当前事件的启示：</strong>埃及新投资法引入的国际仲裁机制是重大利好，应在所有投资合同中充分利用。同时要关注可能出现的本地含量要求，提前布局本地供应链。建议制定长期投资规划，确保持续符合政策要求以享受激励措施。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 报告尾部 */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div>
              <p>报告生成：非洲出海安全官智能分析系统</p>
              <p>数据来源：多源数据融合与AI分析</p>
            </div>
            <div className="text-right">
              <p>第一届数字经济实践大赛</p>
              <p>参赛作品 · 仅供演示参考</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>免责声明：</strong>本报告基于当前可获得的信息、历史数据和AI模型生成，旨在提供风险参考和分析思路。
              由于地缘政治环境的复杂性和不确定性，实际情况可能与预测存在较大差异。
              本报告不构成任何投资建议或决策依据，具体决策请结合专业机构评估、实地调研和最新情报。
              本平台不对因使用本报告而造成的任何损失承担法律责任。
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-73px)] bg-[#FAFAFA] relative">
      <AnimatePresence mode="wait">
        {/* 选择器视图 */}
        {view === "selector" && (
          <motion.div
            key="selector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {/* 地图背景 */}
            <div className="w-full h-full">
              <MapContainer
                center={[0, 20]}
                zoom={4}
                className="w-full h-full z-0"
                zoomControl={false}
                minZoom={3}
                maxZoom={10}
                maxBounds={AFRICA_BOUNDS}
                maxBoundsViscosity={1.0}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* 显示所有国家边界（使用真�� GeoJSON 数据） */}
                {africaGeoJSON && (
                  <GeoJSON
                    data={africaGeoJSON}
                    style={getCountryStyle}
                    onEachFeature={onEachCountry}
                  />
                )}

                {/* 事件图层 - 显示真实事件数据 */}
                {showEventsLayer && filteredEventLayerEvents.map((event) => (
                  <Marker
                    key={`event-layer-${event.id}`}
                    position={[event.location[1], event.location[0]]}
                    icon={createEventLayerIcon(event.type, event.popularity)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getEventCategoryColor(event.type) }}
                          />
                          <span className="text-xs font-medium text-gray-700">{event.type}</span>
                          <span className="text-xs text-gray-500">{event.date}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{event.label}</h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>📍 {event.country}</span>
                          <span>热度: {event.popularity}</span>
                        </div>
                        {event.link && (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#005BBB] hover:underline mt-2 block"
                          >
                            查看详情 →
                          </a>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* 左上角流程选择框 */}
            <div className="absolute top-6 left-6 z-10 w-80">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 space-y-5"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <Target className="w-5 h-5 text-[#005BBB]" />
                  <h2 className="text-lg font-bold text-gray-900">影响模拟器</h2>
                </div>

                {/* 事件图层控制 */}
                <div>
                  <button
                    onClick={() => setShowEventsLayer(!showEventsLayer)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      showEventsLayer
                        ? "bg-[#005BBB] text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <AlertCircle className="w-5 h-5" />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold">事件图层</div>
                      <div className="text-xs opacity-80">
                        {showEventsLayer ? "点击隐藏图层" : "点击显示图层"}
                      </div>
                    </div>
                    {showEventsLayer && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </button>

                  {/* 事件图层筛选器 */}
                  {showEventsLayer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 pt-3 border-t border-gray-200 space-y-3"
                    >
                      {/* 统计信息 */}
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>显示事件数：<strong>{filteredEventLayerEvents.length}</strong></span>
                        <span>总事件数：<strong>{realEvents.length}</strong></span>
                      </div>

                      {/* 类型筛选 */}
                      <div>
                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <Filter className="w-3 h-3" />
                          按类型筛选
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => setEventLayerFilterType("")}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              eventLayerFilterType === ""
                                ? "bg-[#005BBB] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            全部
                          </button>
                          {Object.entries(eventLayerTypeConfig).map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => setEventLayerFilterType(key)}
                              className={`px-2 py-1 rounded text-xs transition-all ${
                                eventLayerFilterType === key
                                  ? "bg-[#005BBB] text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 严重程度筛选 */}
                      <div>
                        <div className="text-xs text-gray-500 mb-2">按严重程度筛选</div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEventLayerFilterSeverity("")}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              eventLayerFilterSeverity === ""
                                ? "bg-[#005BBB] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            全部
                          </button>
                          <button
                            onClick={() => setEventLayerFilterSeverity("high")}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              eventLayerFilterSeverity === "high"
                                ? "bg-red-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            高
                          </button>
                          <button
                            onClick={() => setEventLayerFilterSeverity("medium")}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              eventLayerFilterSeverity === "medium"
                                ? "bg-amber-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            中
                          </button>
                          <button
                            onClick={() => setEventLayerFilterSeverity("low")}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              eventLayerFilterSeverity === "low"
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            低
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 分隔线 */}
                <div className="border-t border-gray-200"></div>

                {/* 步骤1: 选择时间 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-[#005BBB] text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <span className="text-sm font-medium text-gray-900">选择时间范围</span>
                  </div>
                  <div className="ml-8 space-y-2">
                    {timeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedTime(option)}
                        className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedTime.id === option.id
                            ? "bg-[#005BBB] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 步骤2: 选择地区 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-[#005BBB] text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <span className="text-sm font-medium text-gray-900">选择地区</span>
                  </div>
                  <div className="ml-8 space-y-3">
                    {/* 地区选择 */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">按地区</div>
                      <div className="grid grid-cols-2 gap-1">
                        {regions.map((region) => (
                          <button
                            key={region.id}
                            onClick={() => handleRegionSelect(region.id)}
                            className={`px-2 py-1.5 rounded text-xs transition-all ${
                              selectedRegion === region.id
                                ? "bg-[#005BBB] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {region.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 国家选择 */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">按国家</div>
                      <select
                        value={selectedCountry}
                        onChange={(e) => handleCountrySelect(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        <option value="">选择国家...</option>
                        {africanCountries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 步骤3: 事件列表 */}
                {(selectedRegion || selectedCountry) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-[#005BBB] text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <span className="text-sm font-medium text-gray-900">选择事件</span>
                    </div>

                    {/* 事件类型筛选 */}
                    <div className="ml-8 mb-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => handleEventTypeFilter("")}
                          className={`px-2 py-1 rounded text-xs transition-all ${
                            selectedEventType === ""
                              ? "bg-[#005BBB] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          全部
                        </button>
                        {Object.entries(eventLayerTypeConfig).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={() => handleEventTypeFilter(key)}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              selectedEventType === key
                                ? "bg-[#005BBB] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {config.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 事件列表 */}
                    <div className="ml-8 max-h-64 overflow-y-auto space-y-2 pr-1">
                      {getDisplayEvents().length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          该地区暂无事件
                        </div>
                      ) : (
                        getDisplayEvents().map((event) => (
                          <motion.button
                            key={event.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleEventSelect(event)}
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl hover:border-[#005BBB] transition-all text-left"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getEventColor(event.type) }}
                                />
                                <span className="text-sm font-medium text-gray-900 line-clamp-1">
                                  {event.label}
                                </span>
                              </div>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  event.severity === "high"
                                    ? "bg-red-100 text-red-700"
                                    : event.severity === "medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {event.severity === "high" ? "高" : event.severity === "medium" ? "中" : "低"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{getEventLabel(event.type)}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.date}
                              </span>
                            </div>
                          </motion.button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* 分析视图 */}
        {view === "analysis" && impactZone && selectedEvent && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {/* 返回按钮 */}
            <button
              onClick={handleBack}
              className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-900">返回</span>
            </button>

            {/* 事件信息显示 */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg flex items-center gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getEventColor(impactZone.type) }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{selectedEvent.label}</div>
                  <div className="text-xs text-gray-500">{impactZone.location} | {selectedEvent.date}</div>
                </div>
              </motion.div>
            </div>

            {/* 地图 */}
            <MapContainer
              center={[impactZone.coordinates.lat, impactZone.coordinates.lng]}
              zoom={8}
              className="w-full h-full z-0"
              zoomControl={false}
              minZoom={3}
              maxZoom={12}
              maxBounds={AFRICA_BOUNDS}
              maxBoundsViscosity={1.0}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {/* 影响范围圆圈 */}
              <Circle
                center={[impactZone.coordinates.lat, impactZone.coordinates.lng]}
                radius={impactZone.radius * 1000 * 1.2}
                pathOptions={{
                  color: getEventColor(impactZone.type),
                  fillColor: getEventColor(impactZone.type),
                  fillOpacity: 0.05,
                  weight: 1,
                  opacity: 0.3,
                }}
              />
              <Circle
                center={[impactZone.coordinates.lat, impactZone.coordinates.lng]}
                radius={impactZone.radius * 1000 * 0.7}
                pathOptions={{
                  color: getEventColor(impactZone.type),
                  fillColor: getEventColor(impactZone.type),
                  fillOpacity: 0.1,
                  weight: 1.5,
                  opacity: 0.5,
                }}
              />
              <Circle
                center={[impactZone.coordinates.lat, impactZone.coordinates.lng]}
                radius={impactZone.radius * 1000 * 0.4}
                pathOptions={{
                  color: getEventColor(impactZone.type),
                  fillColor: getEventColor(impactZone.type),
                  fillOpacity: 0.15,
                  weight: 2,
                  opacity: 0.8,
                }}
              />

              {/* 中资资产标记 */}
              {impactZone.chineseAssets.map((asset, index) => {
                const angle = (index * Math.PI * 2) / impactZone.chineseAssets.length;
                const distance = asset.distance / 111;
                const lng = impactZone.coordinates.lng + Math.cos(angle) * distance;
                const lat = impactZone.coordinates.lat + Math.sin(angle) * distance;

                const assetColor = getRiskColor(asset.risk);

                return (
                  <Circle
                    key={index}
                    center={[lat, lng]}
                    radius={7}
                    fillColor={assetColor}
                    color="#FFFFFF"
                    weight={2.5}
                    opacity={0.95}
                    fillOpacity={0.85}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#005BBB]" />
                            <span className="text-sm text-gray-900">{asset.name}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              asset.risk === "high"
                                ? "bg-red-100 text-red-700"
                                : asset.risk === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {asset.risk === "high" ? "高风险" : asset.risk === "medium" ? "中风险" : "低风险"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{asset.type}</span>
                          <span className="text-gray-500">{asset.distance} km</span>
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                );
              })}

              {/* 关键基础设施 */}
              {impactZone.criticalInfrastructure.map((infra, index) => {
                const angle = (index * Math.PI * 2 + Math.PI) / impactZone.criticalInfrastructure.length;
                const distance = infra.distance / 111;
                const lng = impactZone.coordinates.lng + Math.cos(angle) * distance;
                const lat = impactZone.coordinates.lat + Math.sin(angle) * distance;

                return (
                  <Circle
                    key={index}
                    center={[lat, lng]}
                    radius={5}
                    fillColor="#6B7280"
                    color="#FFFFFF"
                    weight={2}
                    opacity={0.8}
                    fillOpacity={0.7}
                  >
                    <Popup>
                      <div className="p-2 min-w-[150px]">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-gray-900">{infra.name}</span>
                        </div>
                        <div className="text-xs text-gray-500">{infra.type}</div>
                      </div>
                    </Popup>
                  </Circle>
                );
              })}
            </MapContainer>

            {/* 右侧分析面板 */}
            <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-white/95 backdrop-blur-sm shadow-[-4px_0_20px_rgba(0,0,0,0.08)] overflow-y-auto">
              <div className="p-6">
                {/* 标题 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getEventColor(impactZone.type) }} />
                    <h2 className="text-lg text-gray-900">{getEventLabel(impactZone.type)}</h2>
                  </div>
                  <p className="text-sm text-gray-600">{impactZone.location}</p>
                </div>

                {/* 影响半径 */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">影响半径</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl tabular-nums text-gray-900">{impactZone.radius}</span>
                    <span className="text-sm text-gray-500">公里</span>
                  </div>
                </div>

                {/* 受影响人口 */}
                <div className="mb-6">
                  <h3 className="text-sm text-gray-500 mb-3">影响评估</h3>
                  <div className="p-4 bg-white border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3 mb-1">
                      <Users className="w-5 h-5 text-[#005BBB]" />
                      <span className="text-xs text-gray-500">受影响总人口</span>
                    </div>
                    <div className="text-3xl tabular-nums text-gray-900 ml-8">
                      {impactZone.affectedPopulation.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 影响路径 */}
                <div className="mb-6">
                  <h3 className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    影响路径分析
                  </h3>
                  <div className="space-y-3">
                    {impactZone.impactPath.map((path, index) => (
                      <div key={index} className="relative pl-6 pb-3 border-l-2 border-gray-200 last:pb-0">
                        <div className="absolute left-[-7px] top-0 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: getSeverityColor(path.severity) }} />
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-medium text-gray-900">{path.stage}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{
                            backgroundColor: `${getSeverityColor(path.severity)}20`,
                            color: getSeverityColor(path.severity)
                          }}>
                            {path.severity === "critical" ? "危急" : path.severity === "high" ? "高" : path.severity === "medium" ? "中" : "低"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{path.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 应对措施 */}
                <div className="mb-6">
                  <h3 className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    应对措施建议
                  </h3>
                  <div className="space-y-2">
                    {impactZone.responseMeasures.slice(0, 2).map((category, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-900">{category.category}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{
                            backgroundColor: category.priority === "immediate" ? "#FEE2E2" :
                                             category.priority === "short-term" ? "#FEF3C7" : "#DBEAFE",
                            color: category.priority === "immediate" ? "#DC2626" :
                                   category.priority === "short-term" ? "#D97706" : "#2563EB"
                          }}>
                            {category.priority === "immediate" ? "立即执行" : category.priority === "short-term" ? "短期计划" : "长期规划"}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {category.measures.slice(0, 2).map((measure, mIndex) => (
                            <li key={mIndex} className="flex items-start gap-2 text-xs text-gray-600">
                              <ChevronRight className="w-3 h-3 text-[#005BBB] mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{measure}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 中资资产 */}
                <div className="mb-6">
                  <h3 className="text-sm text-gray-500 mb-3">波及中资资产 ({impactZone.chineseAssets.length})</h3>
                  <div className="space-y-2">
                    {impactZone.chineseAssets.map((asset, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div
                          className="p-3 bg-white border border-gray-100 rounded-lg hover:border-[#005BBB] transition-colors cursor-pointer"
                          onClick={() => {
                            const newExpanded = new Set(expandedAssets);
                            if (newExpanded.has(asset.name)) {
                              newExpanded.delete(asset.name);
                            } else {
                              newExpanded.add(asset.name);
                            }
                            setExpandedAssets(newExpanded);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#005BBB]" />
                              <span className="text-sm text-gray-900">{asset.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  asset.risk === "high"
                                    ? "bg-red-100 text-red-700"
                                    : asset.risk === "medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {asset.risk === "high" ? "高" : asset.risk === "medium" ? "中" : "低"}
                              </span>
                              <ChevronRight
                                className={`w-4 h-4 text-gray-400 transition-transform ${
                                  expandedAssets.has(asset.name) ? 'rotate-90' : ''
                                }`}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{asset.distance} km</div>
                        </div>
                        <AnimatePresence>
                          {expandedAssets.has(asset.name) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-blue-50 border-t border-blue-100 mt-1 rounded-b-lg">
                                <div className="text-xs text-[#005BBB] font-medium mb-2">影响路径</div>
                                <div className="space-y-2">
                                  {asset.impactPath.map((path, pIndex) => (
                                    <div key={pIndex} className="relative pl-4 pb-2 border-l-2 border-blue-200 last:pb-0">
                                      <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full border-2 border-white" style={{ backgroundColor: getSeverityColor(path.severity) }} />
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-900">{path.stage}</span>
                                        <span className="text-xs px-1 py-0.5 rounded" style={{
                                          backgroundColor: `${getSeverityColor(path.severity)}20`,
                                          color: getSeverityColor(path.severity)
                                        }}>
                                          {path.severity === "critical" ? "危急" : path.severity === "high" ? "高" : path.severity === "medium" ? "中" : "低"}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600 leading-relaxed">{path.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 知识库选择器 */}
                <KnowledgeBaseSelector
                  eventType={impactZone.type}
                  country={impactZone.location}
                  selectedItems={selectedKnowledgeItems}
                  onSelectionChange={setSelectedKnowledgeItems}
                />

                {/* 生成报告按钮 */}
                <button
                  onClick={() => setShowReport(true)}
                  className="w-full bg-[#005BBB] text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 hover:bg-[#004494] transition-colors shadow-lg"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">生成详细报告</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 报告弹窗 */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowReport(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 报告头部 */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#005BBB]" />
                  <h2 className="text-xl font-bold text-gray-900">地缘政治风险影响分析报告</h2>
                </div>
                <button
                  onClick={() => setShowReport(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 报告内容 */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
                {generateReportContent()}
              </div>

              {/* 报告底部操作 */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowReport(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-6 py-2 bg-[#005BBB] text-white rounded-lg text-sm font-medium hover:bg-[#004494] transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  导出/打印报告
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
