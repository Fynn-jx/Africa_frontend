import { useState } from "react";
import { motion } from "motion/react";
import { X, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, Label } from "recharts";

interface CountryData {
  id: string;
  name: string;
  code: string;
  flag: string;
  score: number;
  trend: number;
  hasData: boolean;
  lat: number;
  lng: number;
  riskLevel: "low" | "medium" | "high" | "unknown";
}

interface CountryDetailsSidebarProps {
  country: CountryData;
  onClose: () => void;
}

// 模拟90天趋势数据 - 添加事件标注
const generateTrendData = (score: number) => {
  const data = [];
  let currentScore = score - 15;
  for (let i = 0; i < 90; i++) {
    currentScore += (Math.random() - 0.45) * 3;
    currentScore = Math.max(30, Math.min(100, currentScore));
    
    // 添加风险等级分类
    let riskLevel: 'low' | 'medium' | 'high';
    if (currentScore >= 70) riskLevel = 'high';
    else if (currentScore >= 50) riskLevel = 'medium';
    else riskLevel = 'low';
    
    data.push({
      day: i + 1,
      score: parseFloat(currentScore.toFixed(1)),
      riskLevel,
    });
  }
  return data;
};

// 重要事件标注
const importantEvents = [
  { day: 25, label: "首都抗议", type: "protest" },
  { day: 50, label: "边境冲突", type: "conflict" },
  { day: 75, label: "通胀飙升", type: "economic" },
];

// 15维度雷达图数据
const radarData = [
  { dimension: "政权政策", fullName: "政权更迭与政策连续性风险", value: 65, fullMark: 100, category: "core" },
  { dimension: "军事冲突", fullName: "地缘军事冲突与战争风险", value: 72, fullMark: 100, category: "core" },
  { dimension: "恐怖极端", fullName: "恐怖主义与极端主义风险", value: 78, fullMark: 100, category: "core" },
  { dimension: "制裁孤立", fullName: "国际制裁与外交孤立风险", value: 58, fullMark: 100, category: "core" },
  { dimension: "意识形态脱钩", fullName: "意识形态与民族主义脱钩风险", value: 62, fullMark: 100, category: "core" },
  { dimension: "供应链矿产", fullName: "供应链与关键矿产卡脖子风险", value: 69, fullMark: 100, category: "geoEconomic" },
  { dimension: "能源价格", fullName: "能源安全与价格剧烈波动风险", value: 61, fullMark: 100, category: "geoEconomic" },
  { dimension: "金融管制", fullName: "跨境金融与资本管制风险", value: 54, fullMark: 100, category: "geoEconomic" },
  { dimension: "贸易保护", fullName: "关税壁垒与贸易保护主义风险", value: 57, fullMark: 100, category: "geoEconomic" },
  { dimension: "技术壁垒", fullName: "技术冷战与知识产权壁垒风险", value: 64, fullMark: 100, category: "geoEconomic" },
  { dimension: "国有化征收", fullName: "国有化与资产征收风险", value: 52, fullMark: 100, category: "governance" },
  { dimension: "长臂管辖", fullName: "监管法律“武器化”与长臂管辖风险", value: 56, fullMark: 100, category: "governance" },
  { dimension: "数字对抗", fullName: "网络主权与数字化对抗风险", value: 48, fullMark: 100, category: "governance" },
  { dimension: "绿色壁垒", fullName: "气候政策与绿色壁垒风险", value: 45, fullMark: 100, category: "governance" },
  { dimension: "社会ESG舆情", fullName: "社会动荡与ESG负面舆情风险", value: 67, fullMark: 100, category: "governance" },
];

// 子类别雷达图数据
const coreRadarData = radarData.filter(d => d.category === "core");
const geoEconomicRadarData = radarData.filter(d => d.category === "geoEconomic");
const governanceRadarData = radarData.filter(d => d.category === "governance");

// 风险类别配置
const riskCategories = [
  { id: "all", name: "综合评估", color: "#005BBB" },
  { id: "core", name: "核心政治", color: "#DC2626" },
  { id: "geoEconomic", name: "经贸资源", color: "#F59E0B" },
  { id: "governance", name: "治理合规", color: "#7C3AED" },
];

export default function CountryDetailsSidebar({ country, onClose }: CountryDetailsSidebarProps) {
  const trendData = generateTrendData(country.score);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 根据选中的类别获取对应的雷达图数据
  const getCurrentRadarData = () => {
    switch (selectedCategory) {
      case "core":
        return coreRadarData;
      case "geoEconomic":
        return geoEconomicRadarData;
      case "governance":
        return governanceRadarData;
      default:
        return radarData;
    }
  };

  // 获取当前类别的颜色
  const getCurrentColor = () => {
    return riskCategories.find(c => c.id === selectedCategory)?.color || "#005BBB";
  };

  const currentRadarData = getCurrentRadarData();
  const currentColor = getCurrentColor();
  const renderRadarTick = ({ payload, x, y, textAnchor }: any) => {
    const lines = String(payload.value).split("\n");

    return (
      <text x={x} y={y} textAnchor={textAnchor} fill="#6B7280" fontSize={currentRadarData.length > 5 ? 8 : 9}>
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : 11}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-[73px] bottom-0 w-[480px] bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.1)] z-40 overflow-y-auto"
    >
      {/* 头部 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{country.flag}</span>
            <div>
              <h2 className="text-xl text-gray-900">{country.name}</h2>
              <div className="text-sm text-gray-500">{country.code}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 当前得分 */}
        <div className="flex items-baseline gap-3">
          <div className="text-4xl tabular-nums text-gray-900">{country.score}</div>
          <div className={`flex items-center gap-1 text-sm ${country.trend > 0 ? "text-red-500" : "text-green-500"}`}>
            {country.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(country.trend)}%</span>
            <span className="text-gray-400 ml-1">vs 上周</span>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="px-8 py-6 space-y-8">
        {/* 90天趋势 */}
        <div>
          <h3 className="text-sm text-gray-500 mb-4">过去90天趋势</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                
                {/* 风险区域分界线 */}
                <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5}>
                  <Label value="高风险" position="right" fill="#EF4444" fontSize={10} />
                </ReferenceLine>
                <ReferenceLine y={50} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.5}>
                  <Label value="中风险" position="right" fill="#F59E0B" fontSize={10} />
                </ReferenceLine>
                
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  interval={29}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  domain={[30, 100]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const event = importantEvents.find(e => e.day === data.day);
                      return (
                        <div className="bg-white rounded-lg shadow-lg px-3 py-2 border border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">第 {data.day} 天</div>
                          <div className="text-sm text-gray-900 mb-1">指数: {data.score}</div>
                          <div className="text-xs px-2 py-0.5 rounded inline-block"
                            style={{
                              backgroundColor: data.riskLevel === 'high' ? '#FEE2E2' :
                                data.riskLevel === 'medium' ? '#FEF3C7' : '#DBEAFE',
                              color: data.riskLevel === 'high' ? '#991B1B' :
                                data.riskLevel === 'medium' ? '#92400E' : '#1E3A8A',
                            }}
                          >
                            {data.riskLevel === 'high' ? '高风险' :
                             data.riskLevel === 'medium' ? '中风险' : '低风险'}
                          </div>
                          {event && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1 text-xs text-amber-600">
                                <AlertCircle className="w-3 h-3" />
                                <span>{event.label}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* 主折线 - 根据风险等级分段着色 */}
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#005BBB"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#005BBB' }}
                />
                
                {/* 事件标记点 */}
                {importantEvents.map((event) => {
                  const dataPoint = trendData[event.day - 1];
                  if (!dataPoint) return null;
                  return (
                    <g key={event.day}>
                      <circle
                        cx={`${(event.day / 90) * 100}%`}
                        cy={`${100 - ((dataPoint.score - 30) / 70) * 100}%`}
                        r="4"
                        fill="#F59E0B"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* 事件说明 */}
          <div className="mt-4 space-y-2">
            {importantEvents.map((event) => (
              <div key={event.day} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-gray-600">第{event.day}天: {event.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 15维度雷达图 - 可切换风险评估 */}
        <div>
          <h3 className="text-sm text-gray-500 mb-4">15维度风险评估</h3>

          {/* 类别选择按钮 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {riskCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-3 py-2 min-h-[44px] rounded-lg text-xs font-medium leading-tight transition-all duration-200
                  ${
                    selectedCategory === category.id
                      ? "text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* 雷达图 */}
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={currentRadarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={renderRadarTick}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF', fontSize: 9 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}/100`, "风险值"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
                />
                <Radar
                  name="风险值"
                  dataKey="value"
                  stroke={currentColor}
                  fill={currentColor}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 类别说明 */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-900">当前视图：</span>
              <span style={{ color: currentColor }}>
                {riskCategories.find(c => c.id === selectedCategory)?.name}
              </span>
              <span className="ml-2">
                {selectedCategory === "all" && "包含三大维度下所有15项风险指标的综合评估"}
                {selectedCategory === "core" && "评估国家内部政局稳定性，以及传统政治、军事和意识形态对抗强度"}
                {selectedCategory === "geoEconomic" && "聚焦经济、金融、技术和资源被地缘政治工具化带来的风险"}
                {selectedCategory === "governance" && "关注法律监管、社会治理和虚拟空间压力对经济主体的影响"}
              </span>
            </div>
          </div>
        </div>

        {/* 关键指标 */}
        <div>
          <h3 className="text-sm text-gray-500 mb-4">关键风险指标</h3>
          <div className="space-y-3">
            {[
              { label: "政治不稳定指数", value: 65, change: 2.3 },
              { label: "社会冲突概率", value: 45, change: -1.2 },
              { label: "经济脆弱性", value: 58, change: 0.8 },
              { label: "安全威胁等级", value: 72, change: 4.1 },
            ].map((indicator) => (
              <div key={indicator.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">{indicator.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        indicator.value > 70
                          ? "bg-red-400"
                          : indicator.value > 50
                          ? "bg-amber-400"
                          : "bg-blue-400"
                      }`}
                      style={{ width: `${indicator.value}%` }}
                    />
                  </div>
                  <span className="text-sm tabular-nums text-gray-900 w-8 text-right">
                    {indicator.value}
                  </span>
                  <span
                    className={`text-xs w-12 text-right ${
                      indicator.change > 0 ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {indicator.change > 0 ? "+" : ""}
                    {indicator.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近事件 */}
        <div>
          <h3 className="text-sm text-gray-500 mb-4">最近重要事件</h3>
          <div className="space-y-3">
            {[
              {
                date: "2026-02-25",
                event: "首都地区大规模抗议活动",
                severity: "high",
              },
              {
                date: "2026-02-20",
                event: "通货膨胀率突破8%",
                severity: "medium",
              },
              {
                date: "2026-02-15",
                event: "边境冲突升级",
                severity: "high",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-3 py-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-2 ${
                    item.severity === "high" ? "bg-red-400" : "bg-amber-400"
                  }`}
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{item.event}</div>
                  <div className="text-xs text-gray-400 mt-1">{item.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
