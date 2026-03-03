import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  Globe,
  ExternalLink,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Tag,
  MapPin,
  Search,
  Globe2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { mockEvents as generatedEvents, type EventItem } from "../../data/eventsData";

// 新闻媒体数据接口
interface NewsMedia {
  id: string;
  url: string;
  nameEn: string;
  nameCn: string;
  description: string;
  year: string;
  country: string;
  marks: string;
}

// 标签体系
interface Tag {
  id: string;
  name: string;
  parentId: string | null;
}

interface TagCategory {
  id: string;
  name: string;
  icon: any;
  children: Tag[];
}

// 知识库项目
interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  lastUpdate: string;
}

// 事件数据接口
interface EventItem {
  id: string;
  datetime: string; // 事件发生时间
  country: string; // 国家
  tags: string[]; // 标签
  title: string; // 标题
  summary: string; // 摘要
  source: string; // 来源
  coordinates: [number, number]; // [经度, 纬度]
  link: string; // 链接
  popularity: number; // 热度
}

// 标签层级数据
const tagCategories: TagCategory[] = [
  {
    id: "political",
    name: "政治-制度",
    icon: "🏛️",
    children: [
      { id: "pol-stability", name: "政治稳定性", parentId: "political" },
      { id: "laws-regulations", name: "法律法规", parentId: "political" },
      { id: "bilateral-relations", name: "双边关系", parentId: "political" },
      { id: "geopolitics", name: "地缘政治", parentId: "political" },
    ],
  },
  {
    id: "social",
    name: "社会-环境",
    icon: "🌍",
    children: [
      { id: "economic-resilience", name: "经济韧性", parentId: "social" },
      { id: "public-security", name: "社会治安", parentId: "social" },
      { id: "natural-disasters", name: "自然灾害", parentId: "social" },
      { id: "health", name: "医疗卫生", parentId: "social" },
      { id: "culture-religion", name: "文化宗教", parentId: "social" },
      { id: "travel-safety", name: "出行安全", parentId: "social" },
      { id: "emergency-resources", name: "应急资源", parentId: "social" },
    ],
  },
  {
    id: "security-tech",
    name: "安全-技术",
    icon: "🔒",
    children: [
      { id: "terrorism", name: "恐怖主义", parentId: "security-tech" },
      { id: "cybersecurity", name: "网络安全", parentId: "security-tech" },
      { id: "supply-chain", name: "供应链安全", parentId: "security-tech" },
      { id: "consular-protection", name: "领事保护", parentId: "security-tech" },
    ],
  },
];

// 三级标签数据
// 二级标签名称到id的映射
const tagNameToId: Record<string, string> = {
  "政治稳定性": "pol-stability",
  "经济韧性": "economic-resilience",
  "社会治安": "public-security",
  "自然灾害": "natural-disasters",
  "医疗卫生": "health",
  "恐怖主义": "terrorism",
  "法律法规": "laws-regulations",
  "文化宗教": "culture-religion",
  "双边关系": "bilateral-relations",
  "地缘政治": "geopolitics",
  "网络安全": "cybersecurity",
  "供应链安全": "supply-chain",
  "出行安全": "travel-safety",
  "领事保护": "consular-protection",
  "应急资源": "emergency-resources",
};

// 三级标签数据（使用id作为key）
const subTags: Record<string, string[]> = {
  "pol-stability": [
    "政权更迭与选举动荡",
    "大规模示威游行",
    "政变未遂与军警介入政治",
    "罢工与关键行业停摆",
    "地方自治/分离主义活动",
    "政治暴力与冲突升级",
    "国家紧急状态/戒严",
    "重大政策转向引发不稳",
  ],
  "economic-resilience": [
    "通货膨胀失控与物价暴涨",
    "汇率剧烈波动与资本管制",
    "银行流动性危机/挤兑",
    "主权债务风险与违约",
    "能源价格冲击与短缺",
    "就业恶化与失业潮",
    "产业/金融制裁冲击",
    "重大税制与补贴调整冲击",
  ],
  "public-security": [
    "抢劫盗窃高发",
    "绑架勒索与人质事件",
    "有组织犯罪活动",
    "枪击/刀刺等暴力犯罪",
    "性侵与性骚扰风险",
    "针对外籍人员犯罪",
    "群体性骚乱与打砸抢",
    "夜间出行高危区域",
  ],
  "natural-disasters": [
    "地震与余震",
    "台风/飓风与风暴潮",
    "洪水与城市内涝",
    "干旱与水资源短缺",
    "森林火灾与烟霾",
    "火山喷发与火山灰",
    "极端高温/寒潮",
    "山体滑坡/泥石流",
    "海啸预警事件",
  ],
  "health": [
    "传染病暴发与扩散",
    "食源性疾病与饮水污染",
    "医疗资源挤兑（床位/急诊）",
    "疫苗/药品短缺",
    "医疗罢工与服务中断",
    "医疗质量与误诊风险",
    "抗生素耐药与院感",
    "入境检疫与健康申报升级",
  ],
  "terrorism": [
    "爆炸袭击（含简易爆炸装置）",
    "枪击/车辆冲撞袭击",
    "机场/车站等软目标袭击",
    "人质劫持与谈判事件",
    "自杀式袭击风险",
    "极端组织威胁声明",
    "可疑包裹与排爆处置",
    "反恐行动升级与封控",
  ],
  "laws-regulations": [
    "签证/入境政策突变",
    "外国人居留与登记执法",
    "数据合规与跨境传输限制",
    "税务稽查与合规调查",
    "外汇监管与资金汇出限制",
    "劳动用工法规调整",
    "行业许可/审批准入变化",
    "环保/安全生产执法加严",
    "罚款制裁与黑名单机制",
  ],
  "culture-religion": [
    "宗教节庆期间风险提升",
    "禁忌行为引发冲突",
    "着装与礼仪违规风险",
    "性别互动规范冲突",
    "酒精/饮食禁忌相关事件",
    "冒犯性言论与仇恨事件",
    "宗教场所周边敏感区",
    "民族矛盾与排外情绪",
    "媒体舆情与文化误读",
  ],
  "bilateral-relations": [
    "双边外交摩擦升级",
    "互相制裁与反制措施",
    "领事通道受限/暂停",
    "航班/签证互限",
    "企业投资审查趋严",
    "技术/出口管制升级",
    "海关通关强化与查验",
    "公民案件引发关系紧张",
  ],
  "geopolitics": [
    "区域武装冲突外溢",
    "边境紧张与对峙升级",
    "海上争端与航运风险",
    "国际联盟对抗与站队压力",
    "军演增多与误判风险",
    "难民潮与跨境人道危机",
    "战略通道封锁/管控",
    "能源通道与管线安全事件",
  ],
  "cybersecurity": [
    "勒索软件攻击",
    "钓鱼邮件与社工欺诈",
    "账号盗用与权限滥用",
    "数据泄露与隐私外泄",
    "DDoS 攻击与业务中断",
    "供应链软件漏洞利用",
    "关键基础设施网络入侵",
    "移动设备丢失与信息泄露",
    "虚假信息/深度伪造欺骗",
  ],
  "supply-chain": [
    "港口拥堵与清关延误",
    "运输中断（海运/空运/陆运）",
    "原材料短缺与价格飙升",
    "关键零部件断供",
    "仓储火灾/事故与损毁",
    "盗抢与货损货差",
    "质量事件与批次召回",
    "供应商破产/停产",
    "制裁导致替代采购受限",
  ],
  "travel-safety": [
    "交通事故高发路段",
    "公共交通罢运/停运",
    "机场关闭与航班大面积取消",
    "护照/行李遗失与诈骗",
    "路检/执法盘查风险",
    "旅游景区踩踏与拥挤事故",
    "酒店安全（火灾/安保薄弱）",
    "自驾风险（路况/治安/导航误导）",
    "夜间出行限制与宵禁",
  ],
  "consular-protection": [
    "公民被拘押/调查",
    "失联人员协查",
    "重大伤亡事件处置",
    "证件补发与旅行证办理",
    "大规模撤离与转移安置",
    "领事通知权与探视受限",
    "受害者救助与法律援助对接",
    "集体性劳务纠纷处置",
    "重大舆情与媒体协同",
  ],
  "emergency-resources": [
    "紧急医疗转运与救护车资源",
    "应急避难所与临时安置点",
    "应急物资储备（食物/水/药品）",
    "发电与燃料保障资源",
    "通信保障与卫星电话资源",
    "搜救力量（消防/山地/水域）",
    "应急交通与专用通道",
    "语言翻译与心理支持资源",
    "安全护卫与现场秩序维护资源",
    "灾后重建与保险理赔支持",
  ],
};

// 辅助函数：根据标签获取层级信息
function getTagHierarchy(tag: string): { level1: string; level2: string; level3?: string } {
  // 查找二级标签所属的一级分类
  for (const category of tagCategories) {
    for (const child of category.children) {
      if (child.name === tag) {
        return {
          level1: category.name,
          level2: child.name,
        };
      }
    }
  }

  // 如果是三级标签
  for (const [level2Id, level3List] of Object.entries(subTags)) {
    if (level3List.includes(tag)) {
      // 找到对应的二级标签
      const level2Tag = tagCategories
        .flatMap(cat => cat.children)
        .find(child => child.id === level2Id);

      if (level2Tag) {
        const level1Category = tagCategories.find(cat => cat.id === level2Tag.parentId);
        return {
          level1: level1Category?.name || "",
          level2: level2Tag.name,
          level3: tag,
        };
      }
    }
  }

  // 默认返回
  return {
    level1: "其他",
    level2: tag,
  };
}

// 辅助函数：根据标签数组获取层级信息
function getTagsHierarchy(tags: string[]): { level1: string; level2: string; level3?: string } {
  if (!tags || tags.length === 0) {
    return {
      level1: "其他",
      level2: "未分类",
    };
  }

  const level2Tag = tags[0]; // 第一个标签是二级标签id
  const level3Tag = tags[1]; // 第二个标签是三级标签（如果存在）

  // 查找二级标签所属的一级分类（使用id匹配）
  for (const category of tagCategories) {
    for (const child of category.children) {
      if (child.id === level2Tag) {
        return {
          level1: category.name,
          level2: child.name,  // 返回中文名称
          level3: level3Tag,
        };
      }
    }
  }

  // 默认返回
  return {
    level1: "其他",
    level2: level2Tag,
    level3: level3Tag,
  };
}

// 虚拟知识库数据
const knowledgeItems: KnowledgeItem[] = [
  {
    id: "kb-1",
    title: "非洲风险事件标签与样本知识库",
    category: "风险事件数据智能标注分类",
    tags: ["政治稳定性", "经济韧性", "社会治安", "恐怖主义"],
    summary: "收录非洲地区各类风险事件的标准化标签体系和历史标注样本，支持机器学习模型的训练与优化",
    content: "详细内容...",
    lastUpdate: "2025-01-15",
  },
  {
    id: "kb-2",
    title: "风险事件多语分类词表库",
    category: "风险事件数据智能标注分类",
    tags: ["法律法规", "文化宗教", "语言翻译"],
    summary: "包含英、法、阿、葡等多语种的风险事件专业术语库，支持跨语言事件识别与分类",
    content: "详细内容...",
    lastUpdate: "2025-01-12",
  },
  {
    id: "kb-3",
    title: "风险事件要素抽取与标注规则库",
    category: "风险事件数据智能标注分类",
    tags: ["数据合规", "网络攻击", "数据泄露"],
    summary: "定义风险事件的时间、地点、参与者、影响范围等关键要素抽取规则和标注规范",
    content: "详细内容...",
    lastUpdate: "2025-01-10",
  },
  {
    id: "kb-4",
    title: "海外利益影响路径知识图谱库",
    category: "识别风险事件对海外利益的潜在影响路径",
    tags: ["双边关系", "地缘政治", "供应链安全"],
    summary: "构建风险事件与海外利益实体之间的关系图谱，可视化展现影响传导路径",
    content: "详细内容...",
    lastUpdate: "2025-01-14",
  },
  {
    id: "kb-5",
    title: "风险—机制—后果因果链模板库",
    category: "识别风险事件对海外利益的潜在影响路径",
    tags: ["政治稳定性", "经济韧性", "自然灾害"],
    summary: "预定义典型风险事件的触发机制、传导路径和潜在后果的因果链模板",
    content: "详细内容...",
    lastUpdate: "2025-01-11",
  },
  {
    id: "kb-6",
    title: "行业场景化影响评估指标库",
    category: "识别风险事件对海外利益的潜在影响路径",
    tags: ["供应链安全", "出行安全", "应急资源"],
    summary: "针对基建、能源、矿业、制造等不同行业场景，提供差异化的影响评估指标体系",
    content: "详细内容...",
    lastUpdate: "2025-01-09",
  },
  {
    id: "kb-7",
    title: "海外利益风险应对措施与预案库",
    category: "根据影响评估提出政策建议",
    tags: ["领事保护", "应急资源", "出行安全"],
    summary: "汇集各类风险事件的标准化应对措施、应急预案和最佳实践案例",
    content: "详细内容...",
    lastUpdate: "2025-01-13",
  },
  {
    id: "kb-8",
    title: "领保协同与应急处置策略库",
    category: "根据影响评估提出政策建议",
    tags: ["领事保护", "医疗卫生", "社会治安"],
    summary: "整合外交部、商务部、地方政府和企业多方力量的协同处置策略和流程",
    content: "详细内容...",
    lastUpdate: "2025-01-08",
  },
  {
    id: "kb-9",
    title: "国别合规与政策建议依据库",
    category: "根据影响评估提出政策建议",
    tags: ["法律法规", "双边关系", "文化宗教"],
    summary: "提供各国法律法规、政策环境和合规要求的最新信息，支撑政策建议制定",
    content: "详细内容...",
    lastUpdate: "2025-01-07",
  },
];

// 数据类型配置
const typeConfig = {
  government: {
    label: "政府机构",
    color: "#005BBB",
    bgColor: "#DBEAFE",
  },
  ngo: {
    label: "非政府组织",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
  research: {
    label: "研究机构",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
  },
  commercial: {
    label: "商业数据",
    color: "#EC4899",
    bgColor: "#FCE7F3",
  },
  "news-international": {
    label: "国际新闻媒体",
    color: "#3B82F6",
    bgColor: "#DBEAFE",
  },
  "news-african": {
    label: "非洲本地媒体",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
};

// 可靠性配置
const reliabilityConfig = {
  high: { label: "高", color: "#10B981" },
  medium: { label: "中", color: "#F59E0B" },
  low: { label: "低", color: "#EF4444" },
};

// 使用动态生成的事件数据
const mockEvents: EventItem[] = generatedEvents;

export default function DataSources() {
  const [activeTab, setActiveTab] = useState<"sources" | "tags" | "knowledge">("sources");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // 事件相关状态
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [eventPage, setEventPage] = useState(1);
  const eventItemsPerPage = 10;

  // 事件时间筛选状态
  const [eventStartDate, setEventStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [eventEndDate, setEventEndDate] = useState<Date>(new Date());

  // 新闻媒体数据状态
  const [newsMediaData, setNewsMediaData] = useState<{ international: NewsMedia[]; african: NewsMedia[] } | null>(null);

  // 传统数据源状态
  const [traditionalData, setTraditionalData] = useState<{ government: NewsMedia[]; ngo: NewsMedia[]; research: NewsMedia[]; commercial: NewsMedia[] } | null>(null);

  // 加载和错误状态
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 加载新闻媒体数据和传统数据源
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    Promise.all([
      fetch('/data/news_media_classified.json').then(res => {
        if (!res.ok) throw new Error('加载新闻媒体数据失败');
        return res.json();
      }),
      fetch('/data/traditional_sources.json').then(res => {
        if (!res.ok) throw new Error('加载传统数据源失败');
        return res.json();
      })
    ])
      .then(([newsMedia, traditional]) => {
        setNewsMediaData(newsMedia);
        setTraditionalData(traditional);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('加载数据失败:', err);
        setLoadError(err.message || '加载数据失败');
        setIsLoading(false);
      });
  }, []);

  // 标签选择状态
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["political", "social", "security-tech"]));
  const [selectedSubTags, setSelectedSubTags] = useState<Set<string>>(new Set());

  // 知识库状态
  const [selectedKBCategory, setSelectedKBCategory] = useState<string | null>(null);

  // 切换标签分类展开
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // 切换三级标签选择
  const toggleSubTag = (tagId: string) => {
    const newSelected = new Set(selectedSubTags);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedSubTags(newSelected);
    setEventPage(1); // 重置事件分页
  };

  // 获取筛选后的事件数据
  const getFilteredEvents = () => {
    let filtered = mockEvents;

    // 根据时间筛选
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.datetime);
      return eventDate >= eventStartDate && eventDate <= eventEndDate;
    });

    // 根据选中的标签筛选
    if (selectedSubTags.size > 0) {
      filtered = filtered.filter(event =>
        event.tags.some(tag => selectedSubTags.has(tag))
      );
    }

    // 根据搜索关键词筛选
    if (eventSearchQuery) {
      const searchLower = eventSearchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.summary.toLowerCase().includes(searchLower) ||
        event.country.toLowerCase().includes(searchLower) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  };

  const filteredEvents = getFilteredEvents();
  const paginatedEvents = filteredEvents.slice(
    (eventPage - 1) * eventItemsPerPage,
    eventPage * eventItemsPerPage
  );
  const totalEventPages = Math.ceil(filteredEvents.length / eventItemsPerPage);

  // 格式化日期时间
  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取热度颜色
  const getPopularityColor = (popularity: number) => {
    if (popularity >= 90) return 'text-red-600 bg-red-50';
    if (popularity >= 80) return 'text-orange-600 bg-orange-50';
    if (popularity >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  // 获取当前选中的横条卡片数据
  const getCardData = () => {
    if (!newsMediaData || !traditionalData) return [];

    let dataList: NewsMedia[] = [];

    switch (selectedType) {
      case "news-international":
        dataList = newsMediaData.international;
        break;
      case "news-african":
        dataList = newsMediaData.african;
        break;
      case "government":
        dataList = traditionalData.government;
        break;
      case "ngo":
        dataList = traditionalData.ngo;
        break;
      case "research":
        dataList = traditionalData.research;
        break;
      case "commercial":
        dataList = traditionalData.commercial;
        break;
      default:
        return [];
    }

    return dataList.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        item.nameEn.toLowerCase().includes(searchLower) ||
        item.nameCn.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.country.toLowerCase().includes(searchLower)
      );
    });
  };

  const filteredCardData = getCardData();

  // 分页数据
  const paginatedCardData = filteredCardData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCardData.length / itemsPerPage);

  return (
    <div className="h-[calc(100vh-73px)] bg-[#FAFAFA] relative">
      <div className="h-full flex">
        {/* 左侧筛选面板 */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          {/* 标签页切换 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("sources")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === "sources"
                  ? "text-[#005BBB] border-b-2 border-[#005BBB]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Database className="w-4 h-4" />
              数据来源
            </button>
            <button
              onClick={() => setActiveTab("tags")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === "tags"
                  ? "text-[#005BBB] border-b-2 border-[#005BBB]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Tag className="w-4 h-4" />
              事件数据
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === "knowledge"
                  ? "text-[#005BBB] border-b-2 border-[#005BBB]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              知识库
            </button>
          </div>

          {/* 数据来源面板内容 */}
          {activeTab === "sources" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">数据来源</h2>

              {/* 加载状态 */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-gray-500">
                    <div className="w-5 h-5 border-2 border-[#005BBB] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">加载数据中...</span>
                  </div>
                </div>
              )}

              {/* 错误状态 */}
              {loadError && !isLoading && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <strong className="font-semibold">加载失败</strong>
                      <p className="mt-1">{loadError}</p>
                      <p className="mt-1 text-xs">请刷新页面重试，或检查网络连接。</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 搜索框 */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索数据源..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#005BBB]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* 数据类型筛选 */}
              {!isLoading && !loadError && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">数据类型</h3>
                <div className="space-y-2">
                  {Object.entries(typeConfig).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(selectedType === type ? null : type);
                        setPage(1);
                        setSearchQuery("");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedType === type
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-sm text-gray-700">{config.label}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {type === "government" && traditionalData && `(${traditionalData.government.length})`}
                        {type === "ngo" && traditionalData && `(${traditionalData.ngo.length})`}
                        {type === "research" && traditionalData && `(${traditionalData.research.length})`}
                        {type === "commercial" && traditionalData && `(${traditionalData.commercial.length})`}
                        {type === "news-international" && newsMediaData && `(${newsMediaData.international.length})`}
                        {type === "news-african" && newsMediaData && `(${newsMediaData.african.length})`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}

          {/* 标签面板内容 */}
          {activeTab === "tags" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">标签体系</h2>

              <div className="space-y-2">
                {tagCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{category.icon}</span>
                        <span className="text-sm font-semibold text-gray-900">{category.name}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          expandedCategories.has(category.id) ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedCategories.has(category.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 space-y-2 bg-white">
                            {category.children.map((subTag) => (
                              <div key={subTag.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleCategory(subTag.id)}
                                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                    <span className="text-sm text-gray-700">{subTag.name}</span>
                                  </div>
                                  <ChevronDown
                                    className={`w-3 h-3 text-gray-400 transition-transform ${
                                      expandedCategories.has(subTag.id) ? "rotate-90" : ""
                                    }`}
                                  />
                                </button>

                                <AnimatePresence>
                                  {expandedCategories.has(subTag.id) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-3 py-2 space-y-1">
                                        {(subTags[subTag.id] || []).map((tag) => (
                                          <button
                                            key={tag}
                                            onClick={() => toggleSubTag(tag)}
                                            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                              selectedSubTags.has(tag)
                                                ? "bg-[#005BBB] text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                          >
                                            {tag}
                                          </button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {selectedSubTags.size > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900">已选择 {selectedSubTags.size} 个标签</span>
                    <button
                      onClick={() => setSelectedSubTags(new Set())}
                      className="text-xs text-[#005BBB] hover:underline"
                    >
                      清空
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedSubTags).slice(0, 5).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 bg-white border border-blue-200 rounded-md text-gray-700">
                        {tag}
                      </span>
                    ))}
                    {selectedSubTags.size > 5 && (
                      <span className="text-xs px-2 py-1 bg-white border border-blue-200 rounded-md text-gray-500">
                        +{selectedSubTags.size - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 知识库面板内容 */}
          {activeTab === "knowledge" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">知识库分类</h2>

              <div className="space-y-3">
                {[
                  {
                    id: "风险事件数据智能标注分类",
                    name: "风险事件数据智能标注分类",
                    icon: "🏷️",
                    description: "提供风险事件的标签体系、多语种词表和标注规则",
                    color: "blue",
                  },
                  {
                    id: "识别风险事件对海外利益的潜在影响路径",
                    name: "识别风险事件对海外利益的潜在影响路径",
                    icon: "🔗",
                    description: "分析风险传导路径、因果链和行业影响评估",
                    color: "purple",
                  },
                  {
                    id: "根据影响评估提出政策建议",
                    name: "根据影响评估提出政策建议",
                    icon: "💼",
                    description: "提供风险应对措施、领保协同和政策建议依据",
                    color: "green",
                  },
                ].map((category) => {
                  const isSelected = selectedKBCategory === category.id;
                  const colorConfig = {
                    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", iconBg: "bg-blue-100" },
                    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", iconBg: "bg-purple-100" },
                    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", iconBg: "bg-green-100" },
                  };
                  const config = colorConfig[category.color as keyof typeof colorConfig];

                  return (
                    <div
                      key={category.id}
                      onClick={() => setSelectedKBCategory(category.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? `${config.border} ${config.bg} shadow-md`
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-2xl">{category.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-semibold mb-1 ${isSelected ? config.text : "text-gray-900"}`}>
                            {category.name}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 p-6 bg-gray-50 mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">知识库总数</span>
                  <span className="text-lg font-semibold text-gray-900">{knowledgeItems.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* 页面标题 */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">数据中心</h1>
              <p className="text-gray-600">
                {activeTab === "sources" && "平台整合多个权威数据源，提供全面的非洲地缘政治情报。点击卡片查看详细信息。"}
                {activeTab === "tags" && "标签体系帮助您快速定位和筛选相关信息，支持多维度分类检索。"}
                {activeTab === "knowledge" && "知识库按应用场景分类，提供风险事件标注、影响路径分析和政策建议支持。在左侧选择分类查看详情。"}
              </p>
            </div>

            {/* 数据源和新闻媒体列表 */}
            {activeTab === "sources" && (
              <div className="space-y-6">
                {/* 横条卡片数据 */}
                {selectedType && filteredCardData.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {selectedType === "news-international" && "国际新闻媒体"}
                      {selectedType === "news-african" && "非洲本地媒体"}
                      {selectedType === "government" && "政府机构"}
                      {selectedType === "ngo" && "非政府组织"}
                      {selectedType === "research" && "研究机构"}
                      {selectedType === "commercial" && "商业数据"}
                    </h2>

                    {/* 搜索框 */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="搜索..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#005BBB]"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                          }}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* 统计信息 */}
                    <div className="mb-4 text-sm text-gray-600">
                      共 {filteredCardData.length} 条数据
                      {searchQuery && ` · 搜索结果`}
                    </div>

                    {/* 列表 - 横条卡片 */}
                    <div className="space-y-3">
                      {paginatedCardData.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-5"
                        >
                          <div className="flex items-start gap-4">
                            {/* 左侧：基本信息 */}
                            <div className="flex-1 min-w-0">
                              {/* 名称和URL */}
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                  {item.nameCn || item.nameEn}
                                </h3>
                                {item.nameCn && item.nameEn && item.nameCn !== item.nameEn && (
                                  <span className="text-sm text-gray-500">| {item.nameEn}</span>
                                )}
                              </div>

                              {/* URL */}
                              <div className="flex items-center gap-2 mb-3">
                                <a
                                  href={`https://${item.url.replace(/^https?:\/\//, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-[#005BBB] hover:underline truncate flex items-center gap-1"
                                >
                                  <Globe2 className="w-3 h-3" />
                                  {item.url}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>

                              {/* 简介 */}
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>

                              {/* 标签 - 只显示前5个 */}
                              {item.marks && (
                                <div className="flex flex-wrap gap-2">
                                  {item.marks.split(',').slice(0, 5).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md"
                                    >
                                      {tag.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* 右侧：元信息 */}
                            <div className="flex-shrink-0 text-right">
                              {/* 所在地 */}
                              <div className="flex items-center gap-2 mb-2 justify-end">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{item.country}</span>
                              </div>

                              {/* 成立年份 */}
                              {item.year && (
                                <div className="text-xs text-gray-500">
                                  {selectedType === "government" || selectedType === "ngo" || selectedType === "research" ? "成立于" : "创立于"} {item.year}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* 分页控制 */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`px-3 py-1 rounded-lg text-sm ${
                                  page === pageNum
                                    ? "bg-[#005BBB] text-white"
                                    : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          下一页
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 无数据提示 */}
                {!selectedType && (
                  <div className="text-center py-16">
                    <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">请选择数据来源</h3>
                    <p className="text-gray-500">在左侧选择一个数据来源，查看详细数据源</p>
                  </div>
                )}

                {selectedType && filteredCardData.length === 0 && (
                  <div className="text-center py-16">
                    <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无数据</h3>
                    <p className="text-gray-500">请尝试选择其他数据类型或调整搜索关键词</p>
                  </div>
                )}
              </div>
            )}

            {/* 标签视图 - 事件中心 */}
            {activeTab === "tags" && (
              <div className="space-y-6">
                {/* 标题和搜索 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">事件中心</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {filteredEvents.length !== mockEvents.length
                        ? `时间范围内共 ${filteredEvents.length} 条事件（总共 ${mockEvents.length} 条）`
                        : `共 ${mockEvents.length} 条事件`
                      }
                      {selectedSubTags.size > 0 && ` · 已选择 ${selectedSubTags.size} 个标签`}
                    </p>
                  </div>
                  <div className="relative w-80">
                    <input
                      type="text"
                      placeholder="搜索事件..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#005BBB]"
                      value={eventSearchQuery}
                      onChange={(e) => {
                        setEventSearchQuery(e.target.value);
                        setEventPage(1);
                      }}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 时间筛选器 */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">时间范围:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={eventStartDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        setEventStartDate(new Date(e.target.value));
                        setEventPage(1);
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#005BBB]"
                    />
                    <span className="text-gray-500">至</span>
                    <input
                      type="date"
                      value={eventEndDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        setEventEndDate(new Date(e.target.value));
                        setEventPage(1);
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#005BBB]"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(startDate.getDate() - 30);
                      setEventEndDate(endDate);
                      setEventStartDate(startDate);
                      setEventPage(1);
                    }}
                    className="text-sm text-[#005BBB] hover:underline"
                  >
                    重置为最近30天
                  </button>
                  <span className="ml-auto text-xs text-gray-500">
                    筛选后: {filteredEvents.length} 条事件
                  </span>
                </div>

                {/* 已选择的标签 */}
                {selectedSubTags.size > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-gray-600 mr-2">已选标签:</span>
                    {Array.from(selectedSubTags).map(tagId => (
                      <span
                        key={tagId}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-300 rounded-full text-sm text-blue-700"
                      >
                        {tagId}
                        <button
                          onClick={() => toggleSubTag(tagId)}
                          className="ml-1 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setSelectedSubTags(new Set())}
                      className="text-sm text-red-600 hover:text-red-800 ml-2"
                    >
                      清空全部
                    </button>
                  </div>
                )}

                {/* 事件列表 */}
                {paginatedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {paginatedEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                                  {event.title}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDateTime(event.datetime)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.country}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Globe2 className="w-3 h-3" />
                                    {event.coordinates[1].toFixed(2)}°N, {event.coordinates[0].toFixed(2)}°E
                                  </div>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getPopularityColor(event.popularity)}`}>
                                🔥 {event.popularity}
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {event.summary}
                            </p>

                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              {(() => {
                                const hierarchy = getTagsHierarchy(event.tags);
                                return (
                                  <div className="flex items-center gap-1.5">
                                    {/* 一级标签 */}
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                                      {hierarchy.level1}
                                    </span>
                                    <span className="text-gray-400">›</span>
                                    {/* 二级标签 */}
                                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                                      {hierarchy.level2}
                                    </span>
                                    {hierarchy.level3 && (
                                      <>
                                        <span className="text-gray-400">›</span>
                                        {/* 三级标签 */}
                                        <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-md">
                                          {hierarchy.level3}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-xs text-gray-500">
                                来源: {event.source}
                              </span>
                              <a
                                href={event.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#005BBB] hover:underline flex items-center gap-1"
                              >
                                查看详情
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedSubTags.size > 0 ? "没有匹配的事件" : "暂无事件"}
                    </h3>
                    <p className="text-gray-500">
                      {selectedSubTags.size > 0
                        ? "请尝试选择其他标签或调整搜索关键词"
                        : "在左侧选择标签进行筛选"}
                    </p>
                  </div>
                )}

                {/* 分页控制 */}
                {totalEventPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setEventPage(p => Math.max(1, p - 1))}
                      disabled={eventPage === 1}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalEventPages) }, (_, i) => {
                        let pageNum;
                        if (totalEventPages <= 5) {
                          pageNum = i + 1;
                        } else if (eventPage <= 3) {
                          pageNum = i + 1;
                        } else if (eventPage >= totalEventPages - 2) {
                          pageNum = totalEventPages - 4 + i;
                        } else {
                          pageNum = eventPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setEventPage(pageNum)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              eventPage === pageNum
                                ? "bg-[#005BBB] text-white"
                                : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setEventPage(p => Math.min(totalEventPages, p + 1))}
                      disabled={eventPage === totalEventPages}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 知识库视图 */}
            {activeTab === "knowledge" && (
              <>
                {!selectedKBCategory ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">选择知识库分类</h3>
                    <p className="text-gray-500">在左侧选择一个分类，查看该分类下的知识库详情</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedKBCategory}</h2>
                      <p className="text-gray-600">
                        {selectedKBCategory === "风险事件数据智能标注分类" && "提供风险事件的标签体系、多语种词表和标注规则"}
                        {selectedKBCategory === "识别风险事件对海外利益的潜在影响路径" && "分析风险传导路径、因果链和行业影响评估"}
                        {selectedKBCategory === "根据影响评估提出政策建议" && "提供风险应对措施、领保协同和政策建议依据"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {knowledgeItems
                        .filter((item) => item.category === selectedKBCategory)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-gray-200 hover:border-[#005BBB] transition-all p-6"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#005BBB]/10 rounded-lg flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-[#005BBB]" />
                                </div>
                                <div>
                                  <h3 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h3>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {item.lastUpdate}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.summary}</p>

                            <div className="flex flex-wrap gap-2">
                              {item.tags.map((tag) => (
                                <span key={tag} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <button className="mt-4 w-full py-2 border border-[#005BBB] text-[#005BBB] rounded-lg text-sm font-medium hover:bg-[#005BBB] hover:text-white transition-colors">
                              查看详情
                            </button>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
