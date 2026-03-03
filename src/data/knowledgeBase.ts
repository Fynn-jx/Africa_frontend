// 知识库类型定义
export interface KnowledgeItem {
  id: string;
  title: string;
  type: string; // 知识库类型：annotation, impact, policy
  category: string; // 二级分类
  tags: string[]; // 标签
  content: string; // 知识内容
  examples?: string[]; // 示例（可选）
  source: string; // 数据来源
}

// ==================== 1. 面向"风险事件数据智能标注分类"的知识库 ====================

export const annotationKnowledgeBase: KnowledgeItem[] = [
  // 1.1 非洲风险事件标签与样本知识库
  {
    id: "anno-001",
    title: "非洲风险事件标签与样本知识库",
    type: "annotation",
    category: "事件标注",
    tags: ["标签体系", "事件类型", "分类标准"],
    content: `包含非洲54国的主要风险事件标签分类体系。政治-制度维度包括政治稳定性、法律法规、双边关系、地缘政治4个二级标签，共35个三级标签；社会-环境维度包括经济韧性、社会治安、自然灾害、医疗卫生、文化宗教、出行安全、应急资源7个二级标签，共52个三级标签；安全-技术维度包括恐怖主义、网络安全、供应链安全、领事保护4个二级标签，共28个三级标签。总计15个二级标签和115个三级标签。每个标签都有明确的定义、判定标准和典型案例。`,
    examples: [
      "政治稳定性 → 政权更迭与选举动荡、大规模示威游行、政变未遂、罢工与行业停摆",
      "社会治安 → 抢劫盗窃高发、绑架勒索、有组织犯罪、群体性骚乱",
      "恐怖主义 → 爆炸袭击、枪击车辆冲撞、绑架人质、劫持车辆"
    ],
    source: "非洲出海安全官数据中心"
  },

  // 1.2 风险事件多语分类词表库
  {
    id: "anno-002",
    title: "风险事件多语分类词表库",
    type: "annotation",
    category: "多语言处理",
    tags: ["中文", "英语", "法语", "阿拉伯语", "翻译对照"],
    content: `提供风险事件关键术语的多语言对照表库，支持中文、英语、法语、阿拉伯语、葡萄牙语、斯瓦希里语等6种语言。包含事件类型词汇1500+条、地理名词3000+条、组织机构名称500+条、时间表达200+条。每个术语都有标准翻译、变体形式和使用场景标注。采用本体建模方法，建立术语间的语义关系网络。支持模糊匹配和上下文识别。`,
    examples: [
      "protest → 抗争活动、示威游行 (中文) | protest, demonstration (英语) | manifestation (法语)",
      "conflict → 武装冲突、冲突事件 (中文) | armed conflict, clash (英语) | conflit armé (法语)",
      "高风险 → high risk (英语) | risque élevé (法语) | خطر عالي (阿拉伯语)"
    ],
    source: "非洲多语种术语数据中心"
  },

  // 1.3 风险事件要素抽取与标注规则库
  {
    id: "anno-003",
    title: "风险事件要素抽取与标注规则库",
    type: "annotation",
    category: "信息抽取",
    tags: ["命名实体识别", "关系抽取", "事件要素", "标注规则"],
    content: `包含风险事件信息抽取的规则模板和标注指南。定义了事件核心要素（时间、地点、主体、客体、原因、结果、影响）的抽取规则和边界条件。提供了15类实体的识别模式和50+种关系抽取模板。建立了标注一致性检验机制，包含自动审核规则（时间格式、地名匹配度等）和人工审核标准。支持半自动标注模式，AI预标注+人工校准，标注准确率达到95%以上。`,
    examples: [
      "事件主体识别：政府组织、恐怖组织、反对派、民间组织、外国政府、跨国企业",
      "地点要素抽取：国家、省份、城市、具体场所（港口、机场、工业园区、矿区）",
      "影响范围评估：死亡人数、受伤人数、失踪人数、疏散人数、财产损失、影响区域"
    ],
    source: "非洲事件标注规范委员会"
  }
];

// ==================== 2. 面向"识别风险事件对海外利益的潜在影响路径"的知识库 ====================

export const impactKnowledgeBase: KnowledgeItem[] = [
  // 2.1 海外利益影响路径知识图谱库
  {
    id: "impact-001",
    title: "海外利益影响路径知识图谱库",
    type: "impact",
    category: "影响路径",
    tags: ["知识图谱", "实体关系", "传导路径"],
    content: `建立了海外利益面临的风险事件影响路径知识图谱，包含节点类型18种（事件、地区、国家、资产、基础设施、供应链、人员等）和关系类型25种（影响、波及、阻断、依赖、关联等）。图谱采用本体建模，支持多跳查询和路径推理。可以回答"某类事件通过什么路径影响某类资产"、"哪些地区的资产受某事件影响"等复杂问题。基于真实历史事件数据训练，包含典型案例路径5000+条。`,
    examples: [
      "武装冲突 → 安全威胁 → 人员撤离 → 资产停运 → 供应链中断",
      "自然灾害 → 基础设施损毁 → 物流中断 → 生产停滞 → 经济损失",
      "法律变更 → 合规要求变化 → 运营模式调整 → 成本结构变化"
    ],
    source: "海外利益影响分析实验室"
  },

  // 2.2 风险—机制—后果因果链模板库
  {
    id: "impact-002",
    title: "风险—机制—后果因果链模板库",
    type: "impact",
    category: "因果分析",
    tags: ["因果链", "传导机制", "影响分析"],
    content: `提供各类风险事件的因果链分析模板，包含政治、经济、社会、安全、环境五大类事件的200+种传导机制模板。每个模板定义了触发条件、中间变量、传导路径、最终后果等关键要素。采用"风险(R) → 机制(M) → 后果(C)"建模方法，支持链式传导和网状传导分析。模板库基于非洲10年历史事件的因果分析构建，经过专家验证和实例校准。`,
    examples: [
      "抗议活动模板：政治诉求 → 示威活动 → 交通中断 → 供应链延迟 → 生产停滞",
      "武装冲突模板：冲突爆发 → 安全恶化 → 人员撤离 → 资产闲置 → 经济损失",
      "法律变更模板：法案通过 → 合规审查 → 运营调整 → 成本变化 → 竞争力变化"
    ],
    source: "非洲风险传导机制研究院"
  },

  // 2.3 行业场景化影响评估指标库
  {
    id: "impact-003",
    title: "行业场景化影响评估指标库",
    type: "impact",
    category: "行业评估",
    tags: ["行业场景", "评估指标", "影响量化"],
    content: `针对8大重点行业（矿业、能源、基础设施、制造业、物流、建筑、金融、数字经济）提供场景化影响评估指标体系。每个行业包含30-50个关键指标，涵盖资产安全、人员安全、运营连续性、供应链稳定、财务影响、法律合规、声誉风险等8个维度。指标体系参考国际标准（ISO 31000风险管理、ISO 22301业务连续性等）和行业最佳实践，针对非洲地区的特殊性和中国企业的实际情况进行本地化调整。`,
    examples: [
      "矿业指标：矿区安全等级、供应链中断风险、设备可用率、合同履约率、汇率波动影响",
      "基础设施指标：项目进度延误、工程质量风险、安全生产事故、资金链紧张程度",
      "物流指标：运输时效下降、仓储成本上升、通关时间延长、路径可靠性变化"
    ],
    source: "中资企业非洲投资风险评估中心"
  }
];

// ==================== 3. 面向"根据影响评估提出政策建议"的知识库 ====================

export const policyKnowledgeBase: KnowledgeItem[] = [
  // 3.1 海外利益风险应对措施与预案库
  {
    id: "policy-001",
    title: "海外利益风险应对措施与预案库",
    type: "policy",
    category: "应对措施",
    tags: ["应急预案", "风险应对", "处置措施"],
    content: `包含针对各类风险事件的标准化应对措施和预案模板。按事件类型（政治、经济、安全、自然、法律）分为5大类，每类包含15-20种应对措施和预案模板。措施库采用"情景-措施-资源"三层结构，明确具体措施、执行步骤、所需资源和时间要求。预案库包含100+套实战预案，覆盖高危国家和重点行业，提供详细的操作指引和责任分工。`,
    examples: [
      "政治危机预案：人员撤离方案、资产保护措施、外交协调流程、媒体应对策略",
      "恐怖袭击预案：紧急避险程序、伤亡救治流程、保险理赔指引、心理援助机制",
      "自然灾害预案：应急响应启动、救援资源调配、业务连续性保障、灾后重建规划"
    ],
    source: "海外利益保护应急指挥中心"
  },

  // 3.2 领保协同与应急处置策略库
  {
    id: "policy-002",
    title: "领保协同与应急处置策略库",
    type: "policy",
    category: "领保协同",
    tags: ["领事保护", "应急响应", "协同机制"],
    content: `提供领事保护与应急处置的协同策略和操作流程。包含与使领馆的协调机制、领事保护申请流程、紧急联络渠道、领事官员现场处置程序等。涵盖8类紧急情况（人员伤亡、财产损失、证件丢失、被拘留/逮捕、遭遇恐怖袭击、重大事故、自然灾害）的处置流程和最佳实践。基于外交部领事保护中心和驻非洲54国使领馆的实战经验总结，提供500+个真实案例和处置模板。`,
    examples: [
      "人员伤亡处置：医疗救治协调、家属协助安排、遗体运送流程、保险理赔指引",
      "证件丢失处理：临时旅行证件办理、身份核验程序、紧急证件预约、永久证件补发",
      "被拘留应对：领事探视机制、律师联络程序、法律援助申请、外交交涉策略"
    ],
    source: "外交部领事保护中心"
  },

  // 3.3 国别合规与政策建议依据库
  {
    id: "policy-003",
    title: "国别合规与政策建议依据库",
    type: "policy",
    category: "合规建议",
    tags: ["国别合规", "政策建议", "法律依据"],
    content: `提供非洲54国的投资合规指南和政策建议依据库。每个国家包含政治制度、法律体系、投资政策、税收制度、外汇管制、劳动法、环保要求等12个维度的合规要点。基于各国最新法律法规和政策文件，提供具体的合规建议和风险提示。政策建议库包含300+条具体建议，涵盖市场准入、经营许可、税务筹划、外汇管理、劳动雇佣、环境保护、社会责任等各个方面。每条建议都标注了法律依据和政策来源，并定期更新。`,
    examples: [
      "埃及合规要点：公司法要求、外资比例限制、土地使用规定、外汇管制政策、税收优惠政策",
      "肯尼亚合规要点：投资许可申请、工作签证配额、本地含量要求、环保标准、社区发展要求",
      "南非合规要点：BEE法案合规、黑人经济赋权要求、矿产资源法规、外汇申报制度、劳动法规定"
    ],
    source: "非洲投资法律政策研究中心"
  }
];

// 合并所有知识库
export const allKnowledgeBase: KnowledgeItem[] = [
  ...annotationKnowledgeBase,
  ...impactKnowledgeBase,
  ...policyKnowledgeBase
];

// 根据事件类型推荐相关知识库条目
export function recommendKnowledge(eventType: string, country: string): KnowledgeItem[] {
  // 为法律事件推荐第一类和第三类知识库
  if (eventType === "法律法规") {
    return [
      annotationKnowledgeBase[0], // 标签与样本知识库
      policyKnowledgeBase[2], // 国别合规知识库
    ];
  }

  // 为政治稳定性、社会治安、恐怖主义事件推荐所有三类知识库
  if (["政治稳定性", "社会治安", "恐怖主义"].includes(eventType)) {
    return [
      annotationKnowledgeBase[0], // 标签知识库
      impactKnowledgeBase[1], // 因果链模板库
      policyKnowledgeBase[0], // 应对措施库
      policyKnowledgeBase[1], // 领保协同库
    ];
  }

  // 为经济韧性、供应链事件推荐第二类知识库
  if (["经济韧性", "供应链安全"].includes(eventType)) {
    return [
      annotationKnowledgeBase[0], // 标签知识库
      impactKnowledgeBase[2], // 行业评估指标库
      policyKnowledgeBase[2], // 国别合规知识库
    ];
  }

  // 默认推荐第一类知识库
  return [annotationKnowledgeBase[0]];
}

// 按知识库类型筛选
export function filterKnowledgeByType(type: 'annotation' | 'impact' | 'policy'): KnowledgeItem[] {
  switch (type) {
    case 'annotation':
      return annotationKnowledgeBase;
    case 'impact':
      return impactKnowledgeBase;
    case 'policy':
      return policyKnowledgeBase;
    default:
      return allKnowledgeBase;
  }
}

// 搜索知识库
export function searchKnowledge(keyword: string): KnowledgeItem[] {
  const lowerKeyword = keyword.toLowerCase();
  return allKnowledgeBase.filter(item =>
    item.title.toLowerCase().includes(lowerKeyword) ||
    item.content.toLowerCase().includes(lowerKeyword) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
    item.examples?.some(ex => ex.toLowerCase().includes(lowerKeyword))
  );
}
