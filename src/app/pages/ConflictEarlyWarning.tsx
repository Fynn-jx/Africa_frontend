import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, MapPin, Clock, TrendingUp, Satellite, BarChart3, CheckCircle, XCircle, HelpCircle, Filter } from "lucide-react";

interface Alert {
  id: string;
  timestamp: string;
  location: string;
  country: string;
  summary: string;
  severity: "critical" | "warning" | "info";
  confidence: number;
  evidence: {
    type: string;
    description: string;
    icon: any;
  }[];
  details: string;
  affectedPopulation: number;
  prediction: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    timestamp: "2026-02-28 08:45",
    location: "拉各斯，拉各斯州",
    country: "尼日利亚",
    summary: "拉各斯大陆区抗议活动突增，预计规模扩大",
    severity: "critical",
    confidence: 87,
    evidence: [
      { type: "社交媒体", description: "Twitter/X话题热度激增420%", icon: TrendingUp },
      { type: "卫星监测", description: "人群聚集红外异常检测", icon: Satellite },
      { type: "预测模型", description: "Prophet模型预测斜率>8.2%", icon: BarChart3 },
    ],
    details: "基于多源情报综合分析，拉各斯Ikeja和Surulere地区出现大规模人群聚集迹象。社交媒体监测显示抗议相关话题在过去6小时内热度激增420%，主要诉求为燃料价格上涨和生活成本。卫星红外图像显示Ikeja工业区附近人群密度异常。时间序列预测模型显示未来24-48小时内抗议规模有82%概率进一步扩大。",
    affectedPopulation: 125000,
    prediction: "基于历史数据和当前态势，预计抗议活动将在未来12-24小时内达到峰值，可能波及周边商业区和交通枢纽。建议相关方采取预防措施。",
  },
  {
    id: "2",
    timestamp: "2026-02-28 06:20",
    location: "开罗，开罗省",
    country: "埃及",
    summary: "解放广场周边区域安全警戒级别提升",
    severity: "warning",
    confidence: 72,
    evidence: [
      { type: "情报来源", description: "当地安全机构发布预警", icon: AlertTriangle },
      { type: "交通监测", description: "道路封锁指数上升65%", icon: MapPin },
      { type: "历史模式", description: "与2025年同期事件相似度78%", icon: Clock },
    ],
    details: "开罗解放广场周边区域出现安全警戒级别提升迹象。当地安全部门已在关键路口部署额外警力，多条主要道路实施交通管制。情报分析显示当前态势与2025年2月类似事件存在较高相似度。虽然尚未出现明显的大规模聚集，但社交媒体情绪指数呈上升趋势。",
    affectedPopulation: 45000,
    prediction: "预计该区域将维持高警戒状态48-72小时。建议避免非必要前往，密切关注官方通告。",
  },
  {
    id: "3",
    timestamp: "2026-02-27 22:15",
    location: "内罗毕，内罗毕县",
    country: "肯尼亚",
    summary: "Kibera贫民窟紧张局势监测",
    severity: "warning",
    confidence: 68,
    evidence: [
      { type: "社区监测", description: "社区冲突风险指数上升", icon: AlertTriangle },
      { type: "经济指标", description: "当地食品价格周涨幅12%", icon: TrendingUp },
      { type: "情绪分析", description: "负面情绪占比达58%", icon: BarChart3 },
    ],
    details: "Kibera地区最近一周出现食品价格快速上涨，引发居民不满情绪。社区层面的紧张氛围有所加剧，虽然暂未发生大规模冲突，但多个信息源显示潜在风险正在积累。经济压力和民生问题可能成为引发更大规模事件的导火索。",
    affectedPopulation: 28000,
    prediction: "建议持续监测该区域，特别关注周末和夜间时段。如食品价格继续上涨，冲突风险将显著增加。",
  },
  {
    id: "4",
    timestamp: "2026-02-27 18:30",
    location: "约翰内斯堡，豪登省",
    country: "南非",
    summary: "Soweto地区能源危机引发社区不安",
    severity: "info",
    confidence: 61,
    evidence: [
      { type: "基础设施", description: "持续限电超过72小时", icon: AlertTriangle },
      { type: "舆情监测", description: "投诉量增加3倍", icon: TrendingUp },
      { type: "预警等级", description: "系统自动升级至黄色", icon: BarChart3 },
    ],
    details: "Soweto地区因电力供应不足已持续限电超过72小时，影响数万居民日常生活。虽然目前仅出现零星抗议和投诉，但不满情绪正在积累。能源危机如果持续，可能演变为更大规模的社会问题。",
    affectedPopulation: 67000,
    prediction: "短期风险可控，但需密切关注电力恢复进度。如限电持续超过一周，风险等级可能升级。",
  },
];

export default function ConflictEarlyWarning() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(mockAlerts[0]);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const filteredAlerts = filterSeverity === "all" 
    ? mockAlerts 
    : mockAlerts.filter(alert => alert.severity === filterSeverity);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-l-red-400 bg-red-50/30";
      case "warning":
        return "border-l-amber-400 bg-amber-50/30";
      case "info":
        return "border-l-blue-400 bg-blue-50/30";
      default:
        return "border-l-gray-400";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">严重</span>;
      case "warning":
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">警告</span>;
      case "info":
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">信息</span>;
    }
  };

  return (
    <div className="h-[calc(100vh-73px)] bg-[#FAFAFA] flex">
      {/* 左侧列表 */}
      <div className="w-[420px] bg-white/95 backdrop-blur-sm border-r border-gray-100 flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-gray-900">冲突预警</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-sm text-gray-600 border-none bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">全部</option>
                <option value="critical">严重</option>
                <option value="warning">警告</option>
                <option value="info">信息</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-gray-600">{mockAlerts.filter(a => a.severity === "critical").length} 严重</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span className="text-gray-600">{mockAlerts.filter(a => a.severity === "warning").length} 警告</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-600">{mockAlerts.filter(a => a.severity === "info").length} 信息</span>
            </div>
          </div>
        </div>

        {/* 预警列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredAlerts.map((alert) => (
            <motion.button
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`
                w-full text-left px-6 py-4 border-l-4 border-b border-gray-50
                transition-all duration-300 hover:bg-gray-50
                ${getSeverityColor(alert.severity)}
                ${selectedAlert?.id === alert.id ? "bg-gray-50" : "bg-white"}
              `}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{alert.timestamp}</span>
                </div>
                {getSeverityBadge(alert.severity)}
              </div>
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-900">{alert.location}</div>
                  <div className="text-xs text-gray-500">{alert.country}</div>
                </div>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{alert.summary}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${alert.confidence}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      alert.confidence > 80
                        ? "bg-green-400"
                        : alert.confidence > 60
                        ? "bg-amber-400"
                        : "bg-red-400"
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-500 tabular-nums">{alert.confidence}%</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 右侧详情 */}
      <div className="flex-1 overflow-y-auto">
        {selectedAlert ? (
          <div className="max-w-4xl mx-auto px-12 py-10">
            {/* 标题区 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                {getSeverityBadge(selectedAlert.severity)}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{selectedAlert.timestamp}</span>
                </div>
              </div>
              <h1 className="text-2xl text-gray-900 mb-3 leading-snug">
                {selectedAlert.summary}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{selectedAlert.location}, {selectedAlert.country}</span>
              </div>
            </motion.div>

            {/* 置信度 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8 p-6 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">模型置信度</span>
                <span className="text-2xl tabular-nums text-gray-900">{selectedAlert.confidence}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedAlert.confidence}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    selectedAlert.confidence > 80
                      ? "bg-green-400"
                      : selectedAlert.confidence > 60
                      ? "bg-amber-400"
                      : "bg-red-400"
                  }`}
                />
              </div>
            </motion.div>

            {/* 证据链 */}
            <div className="mb-8">
              <h2 className="text-sm text-gray-500 mb-4">支撑证据</h2>
              <div className="grid grid-cols-3 gap-4">
                {selectedAlert.evidence.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                      className="p-4 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-[#005BBB]/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-[#005BBB]" />
                        </div>
                        <span className="text-xs text-gray-500">{item.type}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 详细分析 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-sm text-gray-500 mb-4">详细分析</h2>
              <div className="p-6 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedAlert.details}
                </p>
              </div>
            </motion.div>

            {/* 影响评估 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-sm text-gray-500 mb-4">影响评估</h2>
              <div className="p-6 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl tabular-nums text-gray-900">
                    {selectedAlert.affectedPopulation.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">预计受影响人口</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedAlert.prediction}
                </p>
              </div>
            </motion.div>

            {/* 人工研判 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="mb-8"
            >
              <h2 className="text-sm text-gray-500 mb-4">人工研判</h2>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 text-sm shadow-sm hover:shadow-md">
                  <CheckCircle className="w-4 h-4" />
                  确认预警
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm shadow-sm hover:shadow-md">
                  <XCircle className="w-4 h-4" />
                  标记误报
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm shadow-sm hover:shadow-md">
                  <HelpCircle className="w-4 h-4" />
                  申请更多数据
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>选择左侧预警以查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}