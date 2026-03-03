import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, TrendingUp, Calendar, AlertTriangle, Flame, CloudLightning, Factory, Building2, Zap, ChevronRight, Filter, X, Shield, Globe2, Activity, Gavel, Diamond, AlertCircle } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Marker,
  Popup,
  GeoJSON,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FeatureCollection } from 'geojson';
import { loadMiningData } from '../../utils/loadMiningData';
import { loadTazaraData } from '../../utils/loadTazaraData';
import { mockEvents as allMockEvents } from '../../data/eventsData';

// 大分类颜色配置
const categoryColors: Record<string, string> = {
  "政治-制度": "#005BBB",   // 蓝色
  "社会-环境": "#10B981",   // 绿色
  "安全-技术": "#DC2626",   // 红色
};

// 水滴图标组件
const MapPinIcon = ({ color, size = 14 }: { color: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      fill={color}
    />
    <circle cx="12" cy="10" r="3" fill="#FFFFFF"/>
  </svg>
);

// 根据热度值获取颜色
const getPopularityColor = (popularity: number): string => {
  if (popularity >= 90) return '#DC2626'; // 90-98: 红色（高热度）
  if (popularity >= 85) return '#F59E0B'; // 85-89: 橙色（中高热度）
  if (popularity >= 80) return '#FBBF24'; // 80-84: 黄色（中等热度）
  if (popularity >= 75) return '#34D399'; // 75-79: 浅绿色（中低热度）
  return '#10B981'; // 70-74: 绿色（低热度）
};

// 非洲大陆边界
const AFRICA_BOUNDS: [[number, number], [number, number]] = [
  [-40, -20],
  [42, 52]
];

// 事件类型配置 - 使用标签体系分类
const eventTypeConfig: Record<string, {
  label: string;
  color: string;
  icon: any;
  bgIcon: string;
  category: string;
}> = {
  // 政治-制度维度
  "政治稳定性": {
    label: "政治稳定性",
    color: "#005BBB",
    icon: Globe2,
    bgIcon: "",
    category: "政治-制度"
  },
  "法律法规": {
    label: "法律法规",
    color: "#005BBB",
    icon: Gavel,
    bgIcon: "⚖️",
    category: "政治-制度"
  },
  "双边关系": {
    label: "双边关系",
    color: "#005BBB",
    icon: AlertTriangle,
    bgIcon: "🤝",
    category: "政治-制度"
  },
  "地缘政治": {
    label: "地缘政治",
    color: "#005BBB",
    icon: Globe2,
    bgIcon: "🌐",
    category: "政治-制度"
  },
  // 社会-环境维度
  "经济韧性": {
    label: "经济韧性",
    color: "#005BBB",
    icon: TrendingUp,
    bgIcon: "📈",
    category: "社会-环境"
  },
  "社会治安": {
    label: "社会治安",
    color: "#005BBB",
    icon: Shield,
    bgIcon: "🛡️",
    category: "社会-环境"
  },
  "自然灾害": {
    label: "自然灾害",
    color: "#005BBB",
    icon: CloudLightning,
    bgIcon: "🌊",
    category: "社会-环境"
  },
  "医疗卫生": {
    label: "医疗卫生",
    color: "#005BBB",
    icon: Activity,
    bgIcon: "🏥",
    category: "社会-环境"
  },
  "文化宗教": {
    label: "文化宗教",
    color: "#005BBB",
    icon: Globe2,
    bgIcon: "🌍",
    category: "社会-环境"
  },
  "出行安全": {
    label: "出行安全",
    color: "#005BBB",
    icon: MapPin,
    bgIcon: "✈️",
    category: "社会-环境"
  },
  "应急资源": {
    label: "应急资源",
    color: "#005BBB",
    icon: Activity,
    bgIcon: "🚨",
    category: "社会-环境"
  },
  // 安全-技术维度
  "恐怖主义": {
    label: "恐怖主义",
    color: "#005BBB",
    icon: Flame,
    bgIcon: "🔥",
    category: "安全-技术"
  },
  "网络安全": {
    label: "网络安全",
    color: "#005BBB",
    icon: Shield,
    bgIcon: "🔒",
    category: "安全-技术"
  },
  "供应链安全": {
    label: "供应链安全",
    color: "#005BBB",
    icon: TrendingUp,
    bgIcon: "📦",
    category: "安全-技术"
  },
  "领事保护": {
    label: "领事保护",
    color: "#005BBB",
    icon: Shield,
    bgIcon: "🛂",
    category: "安全-技术"
  },
};

// 坦赞铁路附近的事件数据
const tazaraNearbyEvents = [
  {
    id: "evt-001",
    location: [34.5, -6.5] as [number, number], // 坦桑尼亚中部
    type: "政治稳定性",
    severity: "high" as const,
    title: "坦桑尼亚中部抗议活动升级",
    description: "示威活动阻碍铁路运输",
    date: "2026-02-15",
    impactRadius: 150, // 影响半径（公里）
  },
  {
    id: "evt-002",
    location: [31.5, -9.0] as [number, number], // 坦桑尼亚南部
    type: "社会治安",
    severity: "medium" as const,
    title: "矿区安全事件频发",
    description: "影响矿业生产和运输",
    date: "2026-02-18",
    impactRadius: 120,
  },
  {
    id: "evt-003",
    location: [30.0, -13.0] as [number, number], // 坦赞边境地区
    type: "自然灾害",
    severity: "high" as const,
    title: "强降雨导致铁路路基受损",
    description: "部分路段暂停运营",
    date: "2026-02-20",
    impactRadius: 180,
  },
  {
    id: "evt-004",
    location: [28.5, -14.5] as [number, number], // 赞比亚铜带
    type: "经济韧性",
    severity: "medium" as const,
    title: "赞比亚铜矿工人罢工",
    description: "影响铜矿出口和铁路运输",
    date: "2026-02-22",
    impactRadius: 100,
  },
];

// 坦赞铁路附近的物流枢纽
const tazaraNearbyLogistics = [
  { id: "log-tz-1", name: "姆贝亚货运站", country: "赞比亚", type: "货运站", coordinates: [30.2, -14.5] as [number, number] },
  { id: "log-tz-2", name: "基特韦物流中心", country: "赞比亚", type: "物流中心", coordinates: [28.8, -13.0] as [number, number] },
  { id: "log-tz-3", name: "卡皮里姆波希站", country: "赞比亚", type: "货运站", coordinates: [28.6, -14.3] as [number, number] },
  { id: "log-tz-4", name: "姆林巴站", country: "坦桑尼亚", type: "货运站", coordinates: [35.9, -7.8] as [number, number] },
  { id: "log-tz-5", name: "马坎巴科站", country: "坦桑尼亚", type: "货运站", coordinates: [33.0, -12.5] as [number, number] },
  { id: "log-tz-6", name: "多多马物流园", country: "坦桑尼亚", type: "物流园", coordinates: [36.0, -6.0] as [number, number] },
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

// 将数据中心的事件数据适配为RegionalInsights需要的格式
function adaptEventsForRegionalInsights(allEvents: typeof allMockEvents, startDate: Date, endDate: Date) {
  // 根据热度映射严重程度
  const popularityToSeverity = (popularity: number): 'high' | 'medium' | 'low' => {
    if (popularity >= 90) return 'high';
    if (popularity >= 80) return 'medium';
    return 'low';
  };

  // 根据标签和时间筛选事件
  const filteredEvents = allEvents.filter(event => {
    const eventDate = new Date(event.datetime);
    return eventDate >= startDate && eventDate <= endDate;
  });

  // 转换为新格式，将英文标签ID映射为中文标签名
  return filteredEvents.map(event => {
    const tagId = event.tags[0] || "pol-stability"; // 使用第一个标签ID
    const tagName = tagIdToName[tagId] || "政治稳定性"; // 映射为中文标签名
    const severity = popularityToSeverity(event.popularity);

    return {
      id: event.id,
      location: event.coordinates,
      type: tagName, // 使用中文标签名
      severity,
      label: event.title,
      popularity: event.popularity, // 直接使用热度值
      date: event.datetime.split('T')[0],
      timestamp: new Date(event.datetime).getTime(),
      country: event.country,
      description: event.summary,
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
}

// 物流枢纽数据
const logisticsHubs = [
  { id: "log-1", name: "蒙巴萨港", country: "肯尼亚", type: "港口", coordinates: [39.6, -4.0], capacity: "2500万吨/年" },
  { id: "log-2", name: "达累斯萨拉姆港", country: "坦桑尼亚", type: "港口", coordinates: [39.3, -6.8], capacity: "1400万吨/年" },
  { id: "log-3", name: "吉布提港", country: "吉布提", type: "港口", coordinates: [43.1, 11.8], capacity: "800万吨/年" },
  { id: "log-4", name: "阿比让港", country: "科特迪瓦", type: "港口", coordinates: [-4.0, 5.3], capacity: "2200万吨/年" },
  { id: "log-5", name: "拉各斯港", country: "尼日利亚", type: "港口", coordinates: [3.4, 6.5], capacity: "3000万吨/年" },
  { id: "log-6", name: "开罗国际机场", country: "埃及", type: "机场", coordinates: [31.4, 30.1], capacity: "1500万人次/���" },
  { id: "log-7", name: "亚的斯亚贝巴机场", country: "埃塞俄比亚", type: "机场", coordinates: [38.8, 8.9], capacity: "1200万人次/年" },
  { id: "log-8", name: "乔莫·肯雅塔机场", country: "肯尼亚", type: "机场", coordinates: [36.9, -1.3], capacity: "1000万人次/年" },
  { id: "log-9", name: "奥利弗·坦博机场", country: "南非", type: "机场", coordinates: [28.2, -26.1], capacity: "2100万人次/年" },
  { id: "log-10", name: "卡萨布兰卡港", country: "摩洛哥", type: "港口", coordinates: [7.6, 33.6], capacity: "4000万吨/年" },
  { id: "log-11", name: "德班港", country: "南非", type: "港口", coordinates: [31.0, -29.8], capacity: "5000万吨/年" },
  { id: "log-12", name: "亚历山大港", country: "埃及", type: "港口", coordinates: [29.9, 31.2], capacity: "3500万吨/年" },
];

// 重点项目数据
const keyProjects = {
  // 产业园区改为矿业数据
  industrialParks: [], // 将在组件中动态加载
  // 重点项目包含坦赞铁路
  keyInfrastructure: [
    { id: "ki-1", name: "坦赞铁路", nameEn: "TAZARA Railway", country: "坦桑尼亚-赞比亚", coordinates: [32.9, -8.5], riskIndex: 68, isRailway: true },
    { id: "ki-2", name: "蒙内铁路", nameEn: "SGR", country: "肯尼亚", coordinates: [37.5, -1.5], riskIndex: 49 },
    { id: "ki-3", name: "亚吉铁路", nameEn: "ADB", country: "埃塞俄比亚-吉布提", coordinates: [41.5, 10.5], riskIndex: 72 },
    { id: "ki-4", name: "拉伊铁路", country: "尼日利亚", coordinates: [3.9, 7.4], riskIndex: 77 },
    { id: "ki-5", name: "苏丹港", country: "苏丹", coordinates: [37.2, 19.6], riskIndex: 85 },
    { id: "ki-6", name: "蒙巴萨港", country: "肯尼亚", coordinates: [40.0, -4.0], riskIndex: 55 },
    { id: "ki-7", name: "达累斯萨拉姆港", country: "坦桑尼亚", coordinates: [39.3, -6.8], riskIndex: 52 },
    { id: "ki-8", name: "拉穆港", country: "肯尼亚", coordinates: [40.9, -2.3], riskIndex: 55 },
    { id: "ki-9", name: "阿比让港", country: "科特迪瓦", coordinates: [-4.0, 5.3], riskIndex: 48 },
    { id: "ki-10", name: "的黎波里港", country: "利比亚", coordinates: [13.2, 32.9], riskIndex: 88 },
    { id: "ki-11", name: "开罗国际机场", country: "埃及", coordinates: [31.4, 30.1], riskIndex: 58 },
    { id: "ki-12", name: "亚的斯亚贝巴博莱机场", country: "埃塞俄比亚", coordinates: [38.8, 8.9], riskIndex: 50 },
  ],
  // 经济特区移到第三个位置
  economicZones: [
    { id: "ez-1", name: "吉布提自贸区", country: "吉布提", coordinates: [43.1, 11.8], riskIndex: 38 },
    { id: "ez-2", name: "毛里求斯自贸港", country: "毛里求斯", coordinates: [57.5, -20.2], riskIndex: 25 },
    { id: "ez-3", name: "塞舌尔经济区", country: "塞舌尔", coordinates: [55.4, -4.6], riskIndex: 22 },
    { id: "ez-4", name: "摩洛哥丹吉尔自贸区", country: "摩洛哥", coordinates: [-5.9, 35.7], riskIndex: 35 },
    { id: "ez-5", name: "南非德班工业区", country: "南非", coordinates: [31.0, -29.8], riskIndex: 40 },
  ],
  coreEnterprises: [
    { id: "ce-1", name: "中石油尼日利亚分公司", country: "尼日利亚", type: "能源", coordinates: [7.5, 9.1], riskIndex: 65 },
    { id: "ce-2", name: "中铁建东非总部", country: "肯尼亚", type: "基建", coordinates: [36.8, -1.3], riskIndex: 50 },
    { id: "ce-3", name: "华为南非代表处", country: "南非", type: "科技", coordinates: [28.0, -26.2], riskIndex: 42 },
    { id: "ce-4", name: "中交集团埃及分公司", country: "埃及", type: "基建", coordinates: [31.2, 30.1], riskIndex: 55 },
    { id: "ce-5", name: "中国有色矿业赞比亚项目部", country: "赞比亚", type: "矿业", coordinates: [28.3, -15.4], riskIndex: 58 },
    { id: "ce-6", name: "青建集团埃塞俄比亚办事处", country: "埃塞俄比亚", type: "基建", coordinates: [38.7, 9.0], riskIndex: 52 },
    { id: "ce-7", name: "中国港湾肯尼亚分公司", country: "肯尼亚", type: "基建", coordinates: [37.9, -1.3], riskIndex: 48 },
    { id: "ce-8", name: "中国水电坦桑尼亚项目部", country: "坦桑尼亚", type: "基建", coordinates: [35.7, -6.2], riskIndex: 50 },
    { id: "ce-9", name: "中钢集团南非办事处", country: "南非", type: "矿业", coordinates: [25.7, -25.7], riskIndex: 45 },
    { id: "ce-10", name: "中国铁建莫桑比克分公司", country: "莫桑比克", type: "基建", coordinates: [37.5, -15.4], riskIndex: 55 },
  ],
};

// 计算两点间距离（公里）
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371; // 地球半径（公里）
  const lat1 = coord1[1] * Math.PI / 180;
  const lat2 = coord2[1] * Math.PI / 180;
  const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function RegionalInsights() {
  const [africaGeoJSON, setAfricaGeoJSON] = useState<FeatureCollection | null>(null);
  const [miningData, setMiningData] = useState<any>(null);
  const [tazaraData, setTazaraData] = useState<any>(null);

  // 加载数据
  useEffect(() => {
    fetch('/data/african-countries-only.geojson')
      .then(res => res.json())
      .then(data => setAfricaGeoJSON(data))
      .catch(err => console.error('加载非洲国家边界数据失败:', err));

    loadMiningData().then(data => {
      console.log('矿业数据加载完成:', data);
      setMiningData(data);
    });
    loadTazaraData().then(data => {
      console.log('坦赞铁路数据加载完成:', data);
      setTazaraData(data);
    });
  }, []);

  // 时间选择状态
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  // 筛选状态
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");

  // 右侧标签页
  const [activeTab, setActiveTab] = useState<"industrial" | "infrastructure" | "economic" | "enterprise">("industrial");

  // 矿产数据图层控制
  const [showMiningLayer, setShowMiningLayer] = useState<boolean>(false);

  // 物流枢纽图层控制
  const [showLogisticsLayer, setShowLogisticsLayer] = useState<boolean>(false);

  // 选中的重点项目
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<string | null>(null);

  // 选中的事件（用于显示影响范围）
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // 地图视图控制
  const [mapView, setMapView] = useState<{ center: [number, number]; zoom: number } | null>(null);

  // 生成事件数据
  const events = useMemo(() => adaptEventsForRegionalInsights(allMockEvents, startDate, endDate), [startDate, endDate]);

  // 筛选后的事件
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (selectedEventType && event.type !== selectedEventType) return false;
      if (selectedSeverity && event.severity !== selectedSeverity) return false;
      return true;
    });
  }, [events, selectedEventType, selectedSeverity]);

  // 统计数据 - 按标签维度统计
  const statistics = useMemo(() => {
    return {
      totalEvents: filteredEvents.length,
      politicalEvents: filteredEvents.filter(e => {
        const config = eventTypeConfig[e.type];
        return config && config.category === "政治-制度";
      }).length,
      socialEvents: filteredEvents.filter(e => {
        const config = eventTypeConfig[e.type];
        return config && config.category === "社会-环境";
      }).length,
      securityEvents: filteredEvents.filter(e => {
        const config = eventTypeConfig[e.type];
        return config && config.category === "安全-技术";
      }).length,
      highRiskEvents: filteredEvents.filter(e => e.severity === 'high').length,
      affectedCountries: [...new Set(filteredEvents.map(e => e.country))].length,
    };
  }, [filteredEvents]);

  // 当选中坦赞铁路时，自动调整地图视图
  useEffect(() => {
    if (activeTab === "infrastructure") {
      if (selectedInfrastructure === "ki-1") {
        // 坦赞铁路：放大到铁路区域
        setMapView({ center: [35.0, -12.0], zoom: 6 });
      } else if (selectedInfrastructure) {
        // 其他项目：放大到项目位置
        const project = keyProjects.keyInfrastructure.find(p => p.id === selectedInfrastructure);
        if (project) {
          setMapView({ center: project.coordinates, zoom: 6 });
        }
      } else {
        // 取消选择：恢复默认视图
        setMapView(null);
      }
    } else {
      // 切换标签页：恢复默认视图
      setMapView(null);
    }
  }, [selectedInfrastructure, activeTab]);

  const getEventIcon = (type: string, severity: string) => {
    const config = eventTypeConfig[type];
    const categoryColor = categoryColors[config?.category || "政治-制度"];
    const size = severity === 'high' ? 28 : severity === 'medium' ? 24 : 20;

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.3));">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${categoryColor}" stroke="#FFFFFF" stroke-width="1.5"/>
          <circle cx="12" cy="10" r="2.5" fill="#FFFFFF"/>
        </svg>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });
  };

  const getRiskColor = (index: number) => {
    if (index >= 70) return "#EF4444";
    if (index >= 50) return "#F59E0B";
    return "#10B981";
  };

  // 地图视图控制器
  function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();

    useEffect(() => {
      map.setView([center[1], center[0]], zoom);
    }, [center, zoom, map]);

    return null;
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getTabProjects = () => {
    switch (activeTab) {
      case "industrial":
        return [];
      case "infrastructure":
        return keyProjects.keyInfrastructure;
      case "economic":
        return keyProjects.economicZones;
      case "enterprise":
        return keyProjects.coreEnterprises;
    }
  };

  // 获取选中的项目详情
  const getSelectedProject = () => {
    if (activeTab === "infrastructure" && selectedInfrastructure) {
      return keyProjects.keyInfrastructure.find(p => p.id === selectedInfrastructure);
    }
    return null;
  };

  return (
    <div className="h-[calc(100vh-73px)] bg-[#FAFAFA] relative overflow-hidden">
      {/* 地图 */}
      <div className="absolute inset-0">
        <MapContainer
          center={[20, 0]}
          zoom={3}
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

          {/* 国家边界 */}
          {africaGeoJSON && (
            <GeoJSON
              data={africaGeoJSON}
              style={() => ({
                color: '#D1D5DB',
                weight: 1,
                fillColor: '#F3F4F6',
                fillOpacity: 0.3,
              })}
            />
          )}

          {/* 地图视图控制器 */}
          {mapView && <MapController center={mapView.center} zoom={mapView.zoom} />}

          {/* 风险事件标记 - 缩小图标，密集显示 */}
          {filteredEvents.map((event) => {
            const icon = getEventIcon(event.type, event.severity);
            const popularityColor = getPopularityColor(event.popularity);
            return (
              <Marker
                key={event.id}
                position={[event.location[1], event.location[0]]}
                icon={icon}
              >
                <Popup>
                  <div className="p-2 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{eventTypeConfig[event.type]?.bgIcon || "📌"}</span>
                      <span className="text-sm font-medium text-gray-900">{event.label}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{event.country}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {eventTypeConfig[event.type]?.label || event.type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        event.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : event.severity === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {event.severity === "high" ? "高" : event.severity === "medium" ? "中" : "低"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{event.date}</div>
                    <div className="text-xs font-semibold mt-2" style={{ color: popularityColor }}>
                      热度: {event.popularity}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 矿产数据图层 - 在产业数据标签页或显示坦赞铁路时显示 */}
        {(activeTab === "industrial" || (activeTab === "infrastructure" && selectedInfrastructure === "ki-1")) && showMiningLayer && miningData && (
          <>
            {/* 矿业设施 - 绿色圆形 #0E986F */}
            {miningData.facilities?.map((item: any) => (
              <CircleMarker
                key={`facility-${item.id}`}
                center={[item.coordinates[1], item.coordinates[0]]}
                radius={8}
                pathOptions={{
                  color: '#FFFFFF',
                  weight: 2,
                  fillColor: '#0E986F',
                  fillOpacity: 0.4,
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0E986F', border: '1px solid white' }}></div>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{item.country}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#0E986F20', color: '#0E986F' }}>
                        设施
                      </span>
                      <span className="text-xs text-gray-600">
                        {item.commodity || "未知"}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* 勘探区 - 紫色圆形 #796CAD */}
            {miningData.explorations?.map((item: any) => (
              <CircleMarker
                key={`exploration-${item.id}`}
                center={[item.coordinates[1], item.coordinates[0]]}
                radius={6}
                pathOptions={{
                  color: '#FFFFFF',
                  weight: 2,
                  fillColor: '#796CAD',
                  fillOpacity: 0.3,
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#796CAD', border: '1px solid white' }}></div>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{item.country}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#796CAD20', color: '#796CAD' }}>
                        勘探
                      </span>
                      <span className="text-xs text-gray-600">
                        {item.commodity || "未知"}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* 矿床 - 橙色圆形 #D65813 */}
            {miningData.deposits?.map((item: any) => (
              <CircleMarker
                key={`deposit-${item.id}`}
                center={[item.coordinates[1], item.coordinates[0]]}
                radius={6}
                pathOptions={{
                  color: '#FFFFFF',
                  weight: 2,
                  fillColor: '#D65813',
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#D65813', border: '1px solid white' }}></div>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{item.country}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#D6581320', color: '#D65813' }}>
                        矿床
                      </span>
                      <span className="text-xs text-gray-600">
                        {item.commodity || "未知"}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </>
        )}

        {/* 受影响的矿产高亮 */}
        {(activeTab === "industrial" || (activeTab === "infrastructure" && selectedInfrastructure === "ki-1")) && showMiningLayer && selectedEvent && miningData && (
          <>
            {[...(miningData.facilities || []), ...(miningData.explorations || []), ...(miningData.deposits || [])]
              .filter((item: any) => {
                const distance = calculateDistance(
                  [item.coordinates[0], item.coordinates[1]],
                  selectedEvent.location
                );
                return distance <= selectedEvent.impactRadius;
              })
              .map((item: any) => {
                const getType = (id: string) => {
                  if (miningData.facilities?.find((f: any) => f.id === id)) return { color: '#0E986F', label: '设施' };
                  if (miningData.explorations?.find((e: any) => e.id === id)) return { color: '#796CAD', label: '勘探' };
                  return { color: '#D65813', label: '矿床' };
                };
                const typeInfo = getType(item.id);
                return (
                  <CircleMarker
                    key={`affected-mining-${item.id}`}
                    center={[item.coordinates[1], item.coordinates[0]]}
                    radius={10}
                    pathOptions={{
                      color: '#DC2626',
                      weight: 3,
                      fillColor: typeInfo.color,
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span className="text-xs font-medium text-gray-900">{item.name}</span>
                        </div>
                        <div className="text-xs text-gray-500">{item.country}</div>
                        <div className="text-xs text-red-600 mt-1">受影响 • {typeInfo.label}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
          </>
        )}

        {/* 物流枢纽图层 */}
        {(activeTab === "industrial" || (activeTab === "infrastructure" && selectedInfrastructure === "ki-1")) && showLogisticsLayer && (
          <>
            {[...logisticsHubs, ...tazaraNearbyLogistics].map((hub) => (
              <CircleMarker
                key={hub.id}
                center={[hub.coordinates[1], hub.coordinates[0]]}
                radius={7}
                pathOptions={{
                  color: '#FFFFFF',
                  weight: 2,
                  fillColor: '#1399B2',
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-[#1399B2]" />
                      <span className="text-sm font-medium text-gray-900">{hub.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{hub.country}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1399B220', color: '#1399B2' }}>
                        {hub.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {hub.capacity}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </>
        )}

        {/* 受影响的物流枢纽高亮 */}
        {(activeTab === "industrial" || (activeTab === "infrastructure" && selectedInfrastructure === "ki-1")) && showLogisticsLayer && selectedEvent && (
          <>
            {tazaraNearbyLogistics
              .filter((hub: any) => {
                const distance = calculateDistance(
                  [hub.coordinates[0], hub.coordinates[1]],
                  selectedEvent.location
                );
                return distance <= selectedEvent.impactRadius;
              })
              .map((hub: any) => (
                <CircleMarker
                  key={`affected-logistics-${hub.id}`}
                  center={[hub.coordinates[1], hub.coordinates[0]]}
                  radius={9}
                  pathOptions={{
                    color: '#DC2626',
                    weight: 3,
                    fillColor: '#FEE2E2',
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span className="text-xs font-medium text-gray-900">{hub.name}</span>
                      </div>
                      <div className="text-xs text-gray-500">{hub.country}</div>
                      <div className="text-xs text-red-600 mt-1">受影响</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </>
        )}

        {/* 坦赞铁路图层 - 第三层，在重点项目标签页且选中坦赞铁路时显示 */}
        {activeTab === "infrastructure" && selectedInfrastructure === "ki-1" && tazaraData && (
          <>
            {/* 铁路线路 */}
            {tazaraData.railLines.map((line: any, index: number) => (
              <Polyline
                key={`rail-line-${index}`}
                positions={line.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])}
                pathOptions={{
                  color: line.type === 'tanzania' ? '#000080' : '#B22222',
                  weight: 4,
                  opacity: 0.8,
                  dashArray: line.type === 'tanzania' ? '10, 5' : '5, 5',
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-gray-900">坦赞铁路</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {line.type === 'tanzania' ? '坦桑尼亚段' : '赞比亚段'}
                    </div>
                    <div className="text-xs text-gray-600">
                      全长 {line.type === 'tanzania' ? '970' : '880'} 公里
                    </div>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* 车站标记 */}
            {tazaraData.stations.map((station: any) => (
              <CircleMarker
                key={`station-${station.id || station.name}`}
                center={[station.coordinates[1], station.coordinates[0]]}
                radius={5}
                pathOptions={{
                  color: '#FFFFFF',
                  weight: 2,
                  fillColor: station.type === 'tanzania' ? '#000080' : '#B22222',
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{station.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {station.type === 'tanzania' ? '坦桑尼亚' : '赞比亚'}
                    </div>
                    {station.sequence && (
                      <div className="text-xs text-gray-400 mt-1">
                        站点序号: {station.sequence}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </>
        )}

        {/* 事件影响范围圈 */}
        {activeTab === "infrastructure" && selectedInfrastructure === "ki-1" && selectedEvent && (
          <Circle
            center={[selectedEvent.location[1], selectedEvent.location[0]]}
            radius={selectedEvent.impactRadius * 1000} // 转换为米
            pathOptions={{
              color: '#DC2626',
              weight: 2,
              fillColor: '#DC2626',
              fillOpacity: 0.1,
              dashArray: '10, 10',
            }}
          />
        )}

        {/* 受影响的站点高亮 */}
        {activeTab === "infrastructure" && selectedInfrastructure === "ki-1" && selectedEvent && tazaraData && (
          <>
            {tazaraData.stations
              .filter((station: any) => {
                const distance = calculateDistance(
                  [station.coordinates[0], station.coordinates[1]],
                  selectedEvent.location
                );
                return distance <= selectedEvent.impactRadius;
              })
              .map((station: any) => (
                <CircleMarker
                  key={`affected-station-${station.id || station.name}`}
                  center={[station.coordinates[1], station.coordinates[0]]}
                  radius={8}
                  pathOptions={{
                    color: '#DC2626',
                    weight: 3,
                    fillColor: '#FEE2E2',
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span className="text-xs font-medium text-gray-900">{station.name}</span>
                      </div>
                      <div className="text-xs text-red-600">受影响</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </>
        )}

        {/* 坦赞铁路附近的事件 - 只在显示坦赞铁路时显示 */}
        {activeTab === "infrastructure" && selectedInfrastructure === "ki-1" && (
          <>
            {tazaraNearbyEvents.map((event) => {
              const eventConfig = eventTypeConfig[event.type];
              const iconColor = categoryColors[eventConfig?.category || "政治-制度"];
              const isSelected = selectedEvent?.id === event.id;

              // 创建��定义地图标记图标
              const mapPinIcon = L.divIcon({
                html: `
                  <div style="
                    position: relative;
                    width: ${isSelected ? '32px' : '28px'};
                    height: ${isSelected ? '32px' : '28px'};
                  ">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="
                      width: 100%;
                      height: 100%;
                      filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.3));
                    ">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${iconColor}" stroke="${isSelected ? iconColor : '#FFFFFF'}" stroke-width="2"/>
                      <circle cx="12" cy="10" r="3" fill="#FFFFFF"/>
                    </svg>
                  </div>
                `,
                className: 'custom-map-pin-icon',
                iconSize: [isSelected ? 32 : 28, isSelected ? 32 : 28],
                iconAnchor: [isSelected ? 16 : 14, isSelected ? 32 : 28],
                popupAnchor: [0, -isSelected ? 32 : -28],
              });

              return (
                <Marker
                  key={event.id}
                  position={[event.location[1], event.location[0]]}
                  icon={mapPinIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedEvent(selectedEvent?.id === event.id ? null : event);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[220px]">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-gray-900">{event.title}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{eventTypeConfig[event.type]?.label || event.type}</div>
                    <div className={`text-xs px-2 py-0.5 rounded inline-block mb-2 ${
                      event.severity === 'high'
                        ? 'bg-red-100 text-red-700'
                        : event.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {event.severity === 'high' ? '高风险' : event.severity === 'medium' ? '中风险' : '低风险'}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                    <div className="text-xs text-gray-400">{event.date}</div>
                    <div className="text-xs text-[#005BBB] mt-2">影响半径: {event.impactRadius}公里</div>
                    <div className="text-xs text-gray-500 mt-1">点击查看影响范围</div>
                  </div>
                </Popup>
                </Marker>
              );
            })}
          </>
        )}
        </MapContainer>
      </div>

      {/* 左侧面板 - 时间选择、事件列表、统计 */}
      <div className="absolute top-6 left-6 bottom-6 w-80 flex flex-col z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden">
          {/* 时间选择器 */}
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-[#005BBB]" />
              <h2 className="text-lg font-bold text-gray-900">重点监控项目</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">开始日期</label>
                <input
                  type="date"
                  value={formatDate(startDate)}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005BBB] focus:border-transparent"
                  max={formatDate(endDate)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">结束日期</label>
                <input
                  type="date"
                  value={formatDate(endDate)}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005BBB] focus:border-transparent"
                  min={formatDate(startDate)}
                />
              </div>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="px-5 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">事件筛选</span>
            </div>
            <div className="space-y-2">
              {/* 按维度分组 */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-gray-500 font-medium px-1">政治-制度</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedEventType("")}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      selectedEventType === ""
                        ? "bg-[#005BBB] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    全部
                  </button>
                  {Object.entries(eventTypeConfig)
                    .filter(([_, config]) => config.category === "政治-制度")
                    .map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedEventType(key)}
                        className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${
                          selectedEventType === key
                            ? "bg-[#005BBB] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <MapPinIcon color={categoryColors[config.category]} size={12} />
                        <span>{config.label}</span>
                      </button>
                    ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] text-gray-500 font-medium px-1">社会-环境</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(eventTypeConfig)
                    .filter(([_, config]) => config.category === "社会-环境")
                    .map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedEventType(key)}
                        className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${
                          selectedEventType === key
                            ? "bg-[#10B981] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <MapPinIcon color={categoryColors[config.category]} size={12} />
                        <span>{config.label}</span>
                      </button>
                    ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] text-gray-500 font-medium px-1">安全-技术</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(eventTypeConfig)
                    .filter(([_, config]) => config.category === "安全-技术")
                    .map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedEventType(key)}
                        className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${
                          selectedEventType === key
                            ? "bg-[#DC2626] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <MapPinIcon color={categoryColors[config.category]} size={12} />
                        <span>{config.label}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 严重程度筛选 */}
              <div className="flex gap-1 pt-1">
                <button
                  onClick={() => setSelectedSeverity("")}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    selectedSeverity === ""
                      ? "bg-[#005BBB] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  全部严重程度
                </button>
                <button
                  onClick={() => setSelectedSeverity("high")}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    selectedSeverity === "high"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  高风险
                </button>
                <button
                  onClick={() => setSelectedSeverity("medium")}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    selectedSeverity === "medium"
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  中风险
                </button>
                <button
                  onClick={() => setSelectedSeverity("low")}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    selectedSeverity === "low"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  低风险
                </button>
              </div>
            </div>
          </div>

          {/* 事件列表 - 密集显示 */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">风险事件</span>
              <span className="text-xs text-gray-500">{filteredEvents.length} 条</span>
            </div>
            <div className="space-y-1.5">
              {filteredEvents.slice(0, 100).map((event, index) => {
                const config = eventTypeConfig[event.type];
                const categoryColor = categoryColors[config?.category || "政治-制度"];
                const popularityColor = getPopularityColor(event.popularity);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.005 }}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-xs"
                  >
                    <span className="flex-shrink-0">
                      <MapPinIcon color={categoryColor} size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{event.label}</div>
                      <div className="text-gray-500 text-[10px] truncate">{config?.label || event.type} · {event.country} · {event.date}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] flex-shrink-0`} style={{
                      backgroundColor: `${popularityColor}15`,
                      color: popularityColor,
                      fontWeight: '600'
                    }}>
                      {event.popularity}
                    </span>
                  </motion.div>
                );
              })}
              {filteredEvents.length > 100 && (
                <div className="text-center py-2 text-xs text-gray-500">
                  还有 {filteredEvents.length - 100} 条事件...
                </div>
              )}
            </div>
          </div>

          {/* 统计栏 */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{statistics.totalEvents}</div>
                <div className="text-[10px] text-gray-600">总事件数</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[#005BBB]">{statistics.affectedCountries}</div>
                <div className="text-[10px] text-gray-600">受影响国家</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{statistics.highRiskEvents}</div>
                <div className="text-[10px] text-gray-600">高风险事件</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                  <span>🏛️</span>
                  <span>{statistics.politicalEvents}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                  <span>🌍</span>
                  <span>{statistics.socialEvents}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                  <span>🔒</span>
                  <span>{statistics.securityEvents}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧面板 - 项目分类 */}
      <div className="absolute top-6 right-6 w-80 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          {/* 标签页导航 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("industrial")}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-all ${
                activeTab === "industrial"
                  ? "bg-[#005BBB] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              产业数据
            </button>
            <button
              onClick={() => setActiveTab("infrastructure")}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-all ${
                activeTab === "infrastructure"
                  ? "bg-[#005BBB] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              重点项目
            </button>
            <button
              onClick={() => setActiveTab("economic")}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-all ${
                activeTab === "economic"
                  ? "bg-[#005BBB] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              经济特区
            </button>
            <button
              onClick={() => setActiveTab("enterprise")}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-all ${
                activeTab === "enterprise"
                  ? "bg-[#005BBB] text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              核心企业
            </button>
          </div>

          {/* 内容区域 */}
          <div className="max-h-[calc(100vh-73px-12rem)] overflow-y-auto p-4">
            {/* 产业数据标签页 - 显示矿产数据按钮 */}
            {activeTab === "industrial" && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowMiningLayer(!showMiningLayer)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    showMiningLayer
                      ? "bg-[#005BBB] text-white shadow-lg"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold">矿产数据</div>
                    <div className="text-xs opacity-80">
                      {showMiningLayer ? "点击隐藏图层" : "点击显示图层"}
                    </div>
                  </div>
                </button>

                {/* 矿产数据统计 */}
                {showMiningLayer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-gray-50 rounded-xl p-4"
                  >
                    <div className="text-xs font-medium text-gray-700 mb-3">矿产数据统计</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0E986F' }}></div>
                          <span className="text-xs text-gray-600">矿业设施</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {miningData?.facilities?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#796CAD' }}></div>
                          <span className="text-xs text-gray-600">勘探区域</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {miningData?.explorations?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D65813' }}></div>
                          <span className="text-xs text-gray-600">矿床</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {miningData?.deposits?.length || 0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* 工业数据标签页 - 显示物流枢钮按钮 */}
            {activeTab === "industrial" && (
              <div className="space-y-3">
                {/* 物流枢钮按钮 */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowLogisticsLayer(!showLogisticsLayer)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      showLogisticsLayer
                        ? "bg-[#1399B2] text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold">物流枢纽</div>
                      <div className="text-xs opacity-80">
                        {showLogisticsLayer ? "点击隐藏图层" : "点击显示图层"}
                      </div>
                    </div>
                  </button>

                  {showLogisticsLayer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-gray-50 rounded-xl p-4 mt-3"
                    >
                      <div className="text-xs font-medium text-gray-700 mb-3">物流枢纽统计</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1399B2' }}></div>
                            <span className="text-xs text-gray-600">港口</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900">
                            {logisticsHubs.filter(h => h.type === '港口').length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1399B2' }}></div>
                            <span className="text-xs text-gray-600">机场</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900">
                            {logisticsHubs.filter(h => h.type === '机场').length}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* 其他标签页 - 显示项目列表 */}
            {activeTab !== "industrial" && (
              <div className="space-y-3">
                {/* 当显示坦赞铁路时，显示简介模块 */}
                {activeTab === "infrastructure" && selectedInfrastructure === "ki-1" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900">坦赞铁路简介</h3>
                    </div>
                    <div className="text-xs text-gray-700 space-y-2">
                      <div>
                        <div className="font-medium text-gray-800 mb-1">基本情况：</div>
                        <ul className="space-y-1.5 pl-3">
                          <li className="flex gap-2">
                            <span className="text-blue-600">•</span>
                            <span>全长1860公里，连接坦桑尼亚达累斯萨拉姆港与赞比亚卡皮里姆波希</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600">•</span>
                            <span>1970年代由中国援建，至今仍由中坦赞三方共管</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-600">•</span>
                            <span>承担赞比亚70%以上进出口货运，是内陆国家生命线</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 当显示坦赞铁路时，显示矿产数据按钮 */}
                {activeTab === "infrastructure" && selectedInfrastructure === "ki-1" && (
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <button
                      onClick={() => setShowMiningLayer(!showMiningLayer)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        showMiningLayer
                          ? "bg-[#005BBB] text-white shadow-lg"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold">矿产数据</div>
                        <div className="text-xs opacity-80">
                          {showMiningLayer ? "点击隐藏图层" : "点击显示图层"}
                        </div>
                      </div>
                    </button>

                    {/* 矿产数据统计 */}
                    {showMiningLayer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-gray-50 rounded-xl p-4 mt-3"
                      >
                        <div className="text-xs font-medium text-gray-700 mb-3">矿产数据统计</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0E986F' }}></div>
                              <span className="text-xs text-gray-600">矿业设施</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">
                              {miningData?.facilities?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#796CAD' }}></div>
                              <span className="text-xs text-gray-600">勘探区域</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">
                              {miningData?.explorations?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D65813' }}></div>
                              <span className="text-xs text-gray-600">矿床</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">
                              {miningData?.deposits?.length || 0}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 物流枢纽按钮 */}
                {activeTab === "infrastructure" && selectedInfrastructure === "ki-1" && (
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <button
                      onClick={() => setShowLogisticsLayer(!showLogisticsLayer)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        showLogisticsLayer
                          ? "bg-[#1399B2] text-white shadow-lg"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold">物流枢纽</div>
                        <div className="text-xs opacity-80">
                          {showLogisticsLayer ? "点击隐藏图层" : "点击显示图层"}
                        </div>
                      </div>
                    </button>

                    {showLogisticsLayer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-gray-50 rounded-xl p-4 mt-3"
                      >
                        <div className="text-xs font-medium text-gray-700 mb-3">物流枢纽统计</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1399B2' }}></div>
                              <span className="text-xs text-gray-600">港口</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">
                              {logisticsHubs.filter(h => h.type === '港口').length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1399B2' }}></div>
                              <span className="text-xs text-gray-600">机场</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">
                              {logisticsHubs.filter(h => h.type === '机场').length}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 项目列表 */}
                <div className="space-y-2">
                {getTabProjects().map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      if (activeTab === "infrastructure" && project.isRailway) {
                        // 坦赞铁路：切换显示
                        setSelectedInfrastructure(selectedInfrastructure === project.id ? null : project.id);
                      } else {
                        setSelectedInfrastructure(project.id);
                      }
                    }}
                    className={`p-3 rounded-xl transition-all cursor-pointer ${
                      selectedInfrastructure === project.id
                        ? "bg-[#005BBB] text-white shadow-lg"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${
                            selectedInfrastructure === project.id ? "text-white" : "text-gray-900"
                          }`}>
                            {project.name}
                          </span>
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          selectedInfrastructure === project.id ? "text-white/80" : "text-gray-500"
                        }`}>
                          {project.country}
                        </div>
                        {project.type && (
                          <div className={`text-xs mt-0.5 ${
                            selectedInfrastructure === project.id ? "text-white/90" : "text-[#005BBB]"
                          }`}>
                            {project.type}
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedInfrastructure === project.id
                          ? "bg-white/20 text-white"
                          : project.riskIndex >= 70
                            ? "bg-red-100 text-red-700"
                            : project.riskIndex >= 50
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                      }`}>
                        {project.riskIndex}
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${
                      selectedInfrastructure === project.id ? "text-white/70" : "text-gray-500"
                    }`}>
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">
                        {project.coordinates[0].toFixed(1)}°E, {project.coordinates[1].toFixed(1)}°N
                      </span>
                    </div>
                  </motion.div>
                ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
