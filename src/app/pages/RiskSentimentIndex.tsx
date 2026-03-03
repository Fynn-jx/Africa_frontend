import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, Layers, MapPin, ChevronLeft, ChevronRight, Filter, Globe2, Gavel, Shield, Factory, Building2, Zap, AlertTriangle, Flame, CloudLightning, Activity, Diamond, Calendar } from "lucide-react";
import MapboxMap, { Marker, Popup } from "../components/MapboxMap";
import HeatmapLayer from "../components/HeatmapLayer";
import CountryDetailsSidebar from "../components/CountryDetailsSidebar";
import { africanCountriesData } from "../../data/africanCountriesData";
import { mockEvents as allMockEvents } from "../../data/eventsData";
import L from 'leaflet';

// 大分类颜色配置
const categoryColors: Record<string, string> = {
  "政治-制度": "#005BBB",
  "社会-环境": "#10B981",
  "安全-技术": "#DC2626",
};

// 事件类型配置 - 15种事件类型
const eventTypeConfig: Record<string, {
  label: string;
  color: string;
  icon: any;
  bgIcon: string;
  category: string;
}> = {
  "政治稳定性": {
    label: "政治稳定性",
    color: "#005BBB",
    icon: Globe2,
    bgIcon: "🌍",
    category: "政治-制度"
  },
  "经济韧性": {
    label: "经济韧性",
    color: "#005BBB",
    icon: TrendingUp,
    bgIcon: "📈",
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
    icon: Shield,
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
  "社会治安": {
    label: "社会治安",
    color: "#10B981",
    icon: Shield,
    bgIcon: "🛡️",
    category: "社会-环境"
  },
  "恐怖主义": {
    label: "恐怖主义",
    color: "#10B981",
    icon: AlertTriangle,
    bgIcon: "💣",
    category: "社会-环境"
  },
  "自然灾害": {
    label: "自然灾害",
    color: "#10B981",
    icon: CloudLightning,
    bgIcon: "🌪️",
    category: "社会-环境"
  },
  "医疗卫生": {
    label: "医疗卫生",
    color: "#10B981",
    icon: Activity,
    bgIcon: "🏥",
    category: "社会-环境"
  },
  "文化宗教": {
    label: "文化宗教",
    color: "#10B981",
    icon: Flame,
    bgIcon: "🔥",
    category: "社会-环境"
  },
  "出行安全": {
    label: "出行安全",
    color: "#10B981",
    icon: Shield,
    bgIcon: "✈️",
    category: "社会-环境"
  },
  "应急资源": {
    label: "应急资源",
    color: "#10B981",
    icon: Building2,
    bgIcon: "🏢",
    category: "社会-环境"
  },
  "网络安全": {
    label: "网络安全",
    color: "#DC2626",
    icon: Shield,
    bgIcon: "🔒",
    category: "安全-技术"
  },
  "供应链安全": {
    label: "供应链安全",
    color: "#DC2626",
    icon: Factory,
    bgIcon: "🏭",
    category: "安全-技术"
  },
  "领事保护": {
    label: "领事保护",
    color: "#DC2626",
    icon: Shield,
    bgIcon: "🛡️",
    category: "安全-技术"
  },
};

// 英文标签ID到中文标签的映射
const tagIdToName: Record<string, string> = {
  "pol-stability": "政治稳定性",
  "economic-resilience": "经济韧性",
  "public-security": "社会治安",
  "natural-disasters": "自然灾害",
  "health": "医疗卫生",
  "terrorism": "恐怖主义",
  "laws-regulations": "法律法规",
  "bilateral-relations": "双边关系",
  "geopolitics": "地缘政治",
  "cybersecurity": "网络安全",
  "supply-chain": "供应链安全",
  "consular-protection": "领事保护",
  "culture-religion": "文化宗教",
  "travel-safety": "出行安全",
  "emergency-resources": "应急资源",
};

// 根据热度值获取颜色
const getPopularityColor = (popularity: number): string => {
  if (popularity >= 90) return '#DC2626';
  if (popularity >= 85) return '#F59E0B';
  if (popularity >= 80) return '#FBBF24';
  if (popularity >= 75) return '#34D399';
  return '#10B981';
};

// 将数据中心的事件数据适配为需要的格式（完全复制RegionalInsights的逻辑）
function adaptEventsForRiskIndex(allEvents: typeof allMockEvents) {
  // 根据热度映射严重程度
  const popularityToSeverity = (popularity: number): 'high' | 'medium' | 'low' => {
    if (popularity >= 90) return 'high';
    if (popularity >= 80) return 'medium';
    return 'low';
  };

  // 转换为新格式，将英文标签ID映射为中文标签名
  return allEvents.map(event => {
    const tagId = event.tags[0] || "pol-stability";
    const tagName = tagIdToName[tagId] || "政治稳定性";
    const severity = popularityToSeverity(event.popularity);

    return {
      id: event.id,
      location: event.coordinates, // [lng, lat]
      type: tagName,
      severity,
      label: event.title,
      popularity: event.popularity,
      date: event.datetime.split('T')[0],
      timestamp: new Date(event.datetime).getTime(),
      country: event.country,
      description: event.summary,
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
}

// 获取事件图标（完全复制RegionalInsights的逻辑）
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

export default function RiskSentimentIndex() {
  const [selectedCountry, setSelectedCountry] = useState<typeof africanCountriesData[0] | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showRanking, setShowRanking] = useState(true);

  // 事件图层状态
  const [eventLayerFilterType, setEventLayerFilterType] = useState<string>("");
  const [eventLayerFilterSeverity, setEventLayerFilterSeverity] = useState<string>("");

  // 适配后的事件数据
  const events = useMemo(() => adaptEventsForRiskIndex(allMockEvents), []);

  // 筛选后的事件
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (eventLayerFilterType && event.type !== eventLayerFilterType) return false;
      if (eventLayerFilterSeverity && event.severity !== eventLayerFilterSeverity) return false;
      return true;
    });
  }, [events, eventLayerFilterType, eventLayerFilterSeverity]);

  // 按分数从高到低排序的所有国家
  const sortedCountries = [...africanCountriesData]
    .filter(c => c.hasData)
    .sort((a, b) => b.score - a.score);

  // 前5个高风险国家（得分最高）
  const topRiskCountries = sortedCountries.slice(0, 5);

  return (
    <div className="relative h-[calc(100vh-73px)] bg-[#FAFAFA] overflow-hidden">
      {/* 顶部控制栏 */}
      <div className="absolute top-6 left-8 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">平台状态</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-900">实时监控中</span>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div>
            <div className="text-xs text-gray-500 mb-1">覆盖国家</div>
            <div className="text-sm tabular-nums text-gray-900">
              {africanCountriesData.filter(c => c.hasData).length}/54
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div>
            <div className="text-xs text-gray-500 mb-1">更新时间</div>
            <div className="text-sm text-gray-900">2026-02-28 09:30</div>
          </div>
        </div>
      </div>

      {/* 图层控制 */}
      <div className="absolute top-6 right-8 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs
              ${showHeatmap ? "bg-[#005BBB] text-white" : "text-gray-600 hover:bg-gray-50"}
            `}
          >
            <Layers className="w-3 h-3" />
            <span>热力图</span>
          </button>
          <button
            onClick={() => setShowEvents(!showEvents)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs
              ${showEvents ? "bg-[#005BBB] text-white" : "text-gray-600 hover:bg-gray-50"}
            `}
          >
            <MapPin className="w-3 h-3" />
            <span>事件</span>
          </button>
        </div>
      </div>

      {/* 事件类型筛选面板 */}
      {showEvents && (
        <div className="absolute top-24 right-8 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#005BBB]" />
              <span className="text-sm font-semibold text-gray-900">事件筛选</span>
            </div>
          </div>

          {/* 按类型筛选 */}
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-2">按类型</div>
            <div className="grid grid-cols-3 gap-1">
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
              {Object.entries(eventTypeConfig).map(([key, config]) => (
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

          {/* 按严重程度筛选 */}
          <div>
            <div className="text-xs text-gray-500 mb-2">按严重程度</div>
            <div className="flex gap-1">
              <button
                onClick={() => setEventLayerFilterSeverity("")}
                className={`flex-1 px-2 py-1 rounded text-xs transition-all ${
                  eventLayerFilterSeverity === ""
                    ? "bg-[#005BBB] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setEventLayerFilterSeverity("high")}
                className={`flex-1 px-2 py-1 rounded text-xs transition-all ${
                  eventLayerFilterSeverity === "high"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                高
              </button>
              <button
                onClick={() => setEventLayerFilterSeverity("medium")}
                className={`flex-1 px-2 py-1 rounded text-xs transition-all ${
                  eventLayerFilterSeverity === "medium"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                中
              </button>
              <button
                onClick={() => setEventLayerFilterSeverity("low")}
                className={`flex-1 px-2 py-1 rounded text-xs transition-all ${
                  eventLayerFilterSeverity === "low"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                低
              </button>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">显示 {filteredEvents.length} 个事件</div>
          </div>
        </div>
      )}

      {/* 颜色图例 */}
      <div className="absolute bottom-8 left-8 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="text-xs text-gray-500 mb-3">风险等级（PORI指数）</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#60A5FA] opacity-60"></div>
            <span className="text-xs text-gray-600">低风险 (&lt;50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#FBBF24] opacity-60"></div>
            <span className="text-xs text-gray-600">中风险 (50-70)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#F87171] opacity-60"></div>
            <span className="text-xs text-gray-600">高风险 (&gt;70)</span>
          </div>
        </div>
      </div>

      {/* 事件类型图例 */}
      {showEvents && (
        <div className="absolute bottom-8 left-8 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)]" style={{ marginLeft: '200px' }}>
          <div className="text-xs text-gray-500 mb-3">事件分类</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: categoryColors["政治-制度"] }}></div>
              <span className="text-xs text-gray-600">政治-制度</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: categoryColors["社会-环境"] }}></div>
              <span className="text-xs text-gray-600">社会-环境</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: categoryColors["安全-技术"] }}></div>
              <span className="text-xs text-gray-600">安全-技术</span>
            </div>
          </div>
        </div>
      )}

      {/* 地图容器 */}
      <div className="absolute inset-0">
        <MapboxMap center={[20, 0]} zoom={4}>
          {/* 热力图层 */}
          <HeatmapLayer
            countries={africanCountriesData}
            events={[]}
            onCountryClick={setSelectedCountry}
            selectedCountry={selectedCountry}
            showHeatmap={showHeatmap}
            showEvents={false}
          />

          {/* 事件图层 - 使用和RegionalInsights相同的逻辑 */}
          {showEvents && filteredEvents.map((event) => {
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
        </MapboxMap>
      </div>

      {/* 指数排行榜 */}
      <AnimatePresence>
        {showRanking && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-6 left-8 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden"
            style={{ width: '320px', maxHeight: 'calc(100vh - 140px)' }}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">风险指数排行榜</div>
                  <div className="text-xs text-gray-500 mt-0.5">按PORI指数从高到低排序</div>
                </div>
                <button
                  onClick={() => setShowRanking(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
              {sortedCountries.map((country, index) => (
                <motion.button
                  key={country.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => setSelectedCountry(country)}
                  className={`w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    selectedCountry?.id === country.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index < 3 ? 'bg-red-100 text-red-700' :
                    index < 10 ? 'bg-orange-50 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-base">{country.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">{country.name}</div>
                    <div className={`text-xs font-semibold ${
                      country.score >= 70 ? 'text-red-600' :
                      country.score >= 50 ? 'text-amber-600' :
                      'text-blue-600'
                    }`}>
                      {country.score}分
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    country.trend > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {country.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{Math.abs(country.trend)}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 排行榜切换按钮（隐藏时显示） */}
      {!showRanking && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowRanking(true)}
          className="absolute top-32 left-8 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] px-4 py-3 hover:shadow-[0_8px_30px rgba(0,0,0,0.12)] transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </motion.button>
      )}

      {/* 快速数据卡片 - 前5名 */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-3">
        {topRiskCountries.map((country, index) => (
          <motion.button
            key={country.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}
            onClick={() => setSelectedCountry(country)}
            className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px rgba(239,68,68,0.15)] transition-all duration-300 text-left group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-red-500 text-white' :
                index === 1 ? 'bg-orange-500 text-white' :
                index === 2 ? 'bg-amber-500 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className="text-lg">{country.flag}</span>
              <span className="text-sm text-gray-900">{country.name}</span>
            </div>
            <div className="flex items-center gap-2 ml-8">
              <span className="text-lg tabular-nums text-red-600">{country.score}</span>
              <div className={`flex items-center gap-1 text-xs ${country.trend > 0 ? "text-red-500" : "text-green-500"}`}>
                {country.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(country.trend)}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* 详情侧边栏 */}
      <AnimatePresence>
        {selectedCountry && (
          <CountryDetailsSidebar
            country={selectedCountry}
            onClose={() => setSelectedCountry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
