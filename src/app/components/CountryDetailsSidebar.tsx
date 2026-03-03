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
  { dimension: "政治稳定性", value: 65, fullMark: 100, category: "political" },
  { dimension: "法律法规", value: 58, fullMark: 100, category: "political" },
  { dimension: "双边关系", value: 72, fullMark: 100, category: "political" },
  { dimension: "地缘政治", value: 68, fullMark: 100, category: "political" },
  { dimension: "经济韧性", value: 55, fullMark: 100, category: "social" },
  { dimension: "社会治安", value: 62, fullMark: 100, category: "social" },
  { dimension: "自然灾害", value: 48, fullMark: 100, category: "social" },
  { dimension: "医疗卫生", value: 70, fullMark: 100, category: "social" },
  { dimension: "文化宗教", value: 52, fullMark: 100, category: "social" },
  { dimension: "出行安全", value: 58, fullMark: 100, category: "social" },
  { dimension: "应急资源", value: 45, fullMark: 100, category: "social" },
  { dimension: "恐怖主义", value: 38, fullMark: 100, category: "security" },
  { dimension: "网络安全", value: 42, fullMark: 100, category: "security" },
  { dimension: "供应链安全", value: 55, fullMark: 100, category: "security" },
  { dimension: "领事保护", value: 60, fullMark: 100, category: "security" },
];

// 子类别雷达图数据
const politicalRadarData = radarData.filter(d => d.category === "political");
const socialRadarData = radarData.filter(d => d.category === "social");
const securityRadarData = radarData.filter(d => d.category === "security");

// 风险类别配置
const riskCategories = [
  { id: "all", name: "综合评估", color: "#005BBB" },
  { id: "political", name: "政治-制度", color: "#DC2626" },
  { id: "social", name: "社会-环境", color: "#F59E0B" },
  { id: "security", name: "安全-技术", color: "#7C3AED" },
];

export default function CountryDetailsSidebar({ country, onClose }: CountryDetailsSidebarProps) {
  const trendData = generateTrendData(country.score);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 根据选中的类别获取对应的雷达图数据
  const getCurrentRadarData = () => {
    switch (selectedCategory) {
      case "political":
        return politicalRadarData;
      case "social":
        return socialRadarData;
      case "security":
        return securityRadarData;
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
          <div className="flex items-center gap-2 mb-4">
            {riskCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
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
                  tick={{ fill: '#6B7280', fontSize: currentRadarData.length > 5 ? 9 : 10 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF', fontSize: 9 }}
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
                {selectedCategory === "all" && "包含所有15个维度的综合评估"}
                {selectedCategory === "political" && "政治与制度层面的4项核心指标"}
                {selectedCategory === "social" && "社会与环境韧性的7项关键指标"}
                {selectedCategory === "security" && "安全与技术威胁的4项风险指标"}
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