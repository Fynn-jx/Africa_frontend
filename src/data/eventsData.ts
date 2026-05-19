// 事件数据接口
export interface EventItem {
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

// 非洲主要国家坐标池
const africanLocations = [
  { country: "尼日利亚", coordinates: [7.4896, 9.0579] },
  { country: "肯尼亚", coordinates: [36.8219, -1.2921] },
  { country: "南非", coordinates: [28.1881, -25.7479] },
  { country: "埃及", coordinates: [31.2357, 30.0444] },
  { country: "埃塞俄比亚", coordinates: [38.7578, 8.9635] },
  { country: "刚果民主共和国", coordinates: [29.2283, -0.6234] },
  { country: "坦桑尼亚", coordinates: [39.2083, -6.7924] },
  { country: "加纳", coordinates: [-1.9825, 6.6041] },
  { country: "苏丹", coordinates: [32.5599, 15.5007] },
  { country: "安哥拉", coordinates: [17.8739, -11.2027] },
  { country: "莫桑比克", coordinates: [40.5159, -12.0853] },
  { country: "利比亚", coordinates: [13.1913, 32.8872] },
  { country: "乌干达", coordinates: [32.5632, 1.3733] },
  { country: "赞比亚", coordinates: [28.2887, -15.4234] },
  { country: "津巴布韦", coordinates: [29.1548, -19.0154] },
  { country: "喀麦隆", coordinates: [11.5082, 3.8488] },
  { country: "科特迪瓦", coordinates: [-4.0136, 5.5364] },
  { country: "塞内加尔", coordinates: [-17.4452, 14.4975] },
  { country: "马里", coordinates: [-3.5486, 17.5707] },
  { country: "布基纳法索", coordinates: [-1.5562, 12.2354] },
  { country: "尼日尔", coordinates: [8.0764, 17.6078] },
  { country: "乍得", coordinates: [18.7322, 15.4542] },
  { country: "中非共和国", coordinates: [20.9394, 6.6111] },
  { country: "卢旺达", coordinates: [29.8739, -1.9403] },
  { country: "布隆迪", coordinates: [29.9154, -3.3654] },
  { country: "索马里", coordinates: [46.1996, 5.1521] },
];

// 事件数据源
const eventSources = [
  "Reuters", "BBC Africa", "Al Jazeera", "CNN International", "France24",
  "Bloomberg", "Financial Times", "Wall Street Journal", "The Guardian",
  "UN OCHA", "ACLED", "ICRC", "WHO", "World Bank", "IMF",
  "Amnesty International", "Human Rights Watch", "Crisis Group",
  "当地政府", "当地警方", "卫生部", "外交部", "国防部"
];

// 小指标名称到id的映射
const tagNameToId: Record<string, string> = {
  "政权政策": "policy-continuity",
  "军事冲突": "military-conflict",
  "恐怖极端": "terrorism-extremism",
  "制裁孤立": "sanctions-isolation",
  "意识形态脱钩": "ideology-nationalism",
  "供应链矿产": "supply-minerals",
  "能源价格": "energy-price",
  "金融管制": "financial-controls",
  "贸易保护": "trade-protectionism",
  "技术壁垒": "tech-ip-barriers",
  "国有化征收": "nationalization-expropriation",
  "长臂管辖": "regulatory-longarm",
  "数字对抗": "cyber-digital",
  "绿色壁垒": "climate-green",
  "社会ESG舆情": "social-esg",
};

const subTags: Record<string, string[]> = {};


// 事件模板库：与PORI三大类十五小指标保持一致
const eventTemplates: Record<string, Array<{title: string, summary: string}>> = {
  "政权政策": [
    { title: "{country}大选争议引发政策连续性担忧", summary: "{country}主要反对派质疑选举程序，投资者担心新政府上台后调整外资、税收和矿业许可政策。" },
    { title: "{country}内阁重组释放监管转向信号", summary: "{country}总统宣布更换财政、矿业和内政部门负责人，市场关注既有合同和行业准入政策是否发生变化。" },
  ],
  "军事冲突": [
    { title: "{country}边境地区军事摩擦升级", summary: "{country}边境安全部队与邻国武装发生交火，区域运输通道和能源设施安全受到影响。" },
    { title: "{country}区域武装冲突外溢至商贸节点", summary: "{country}周边冲突造成难民流动和道路封控，企业物流、人员出行和项目复工面临不确定性。" },
  ],
  "恐怖极端": [
    { title: "{country}极端组织袭击矿区营地", summary: "{country}偏远矿区遭武装人员袭击，外籍人员安全和矿山连续生产受到直接威胁。" },
    { title: "{country}安全机构提高反恐警戒等级", summary: "{country}首都和交通枢纽加强安检，政府称极端组织可能策划针对软目标的袭击。" },
  ],
  "制裁孤立": [
    { title: "{country}面临新一轮国际制裁压力", summary: "多边组织讨论对{country}实施金融限制和旅行禁令，银行结算、贸易融资和合规审查成本上升。" },
    { title: "{country}外交摩擦导致援助和合作项目暂停", summary: "{country}与主要伙伴国关系趋紧，部分政府间项目和技术合作被推迟。" },
  ],
  "意识形态脱钩": [
    { title: "{country}民族主义言论推高反外资情绪", summary: "{country}社交媒体出现针对外资企业的抵制话题，部分项目被指责未能惠及本地社区。" },
    { title: "{country}阵营化争议波及企业经营环境", summary: "{country}政党围绕大国竞争和产业自主展开争论，外资企业面临更高舆论和审查压力。" },
  ],
  "供应链矿产": [
    { title: "{country}关键矿产出口通道出现中断", summary: "{country}港口和边境口岸因安全或政策原因临时收紧，铜、钴、锂等战略矿产外运延误。" },
    { title: "{country}关键原材料供应商停产", summary: "{country}上游矿区因罢工、治安或能源短缺停产，下游制造企业面临断供和价格波动压力。" },
  ],
  "能源价格": [
    { title: "{country}燃油供应紧张推高物流成本", summary: "{country}燃油进口受限，柴油价格快速上涨，矿山、港口和长距离运输成本同步抬升。" },
    { title: "{country}电力短缺影响工业园运行", summary: "{country}电网负荷不足导致轮流限电，制造业和矿业项目被迫调整排产计划。" },
  ],
  "金融管制": [
    { title: "{country}央行收紧外汇审批", summary: "{country}央行加强利润汇回和进口付汇审核，企业资金调度和跨境结算周期延长。" },
    { title: "{country}本币快速贬值引发资本管制", summary: "{country}汇率剧烈波动，政府采取临时资本管制措施以稳定金融市场。" },
  ],
  "贸易保护": [
    { title: "{country}上调关键商品进口关税", summary: "{country}政府宣布提高部分工业品和设备进口税率，外资项目建设成本上升。" },
    { title: "{country}对进口产品启动反倾销调查", summary: "{country}贸易部门称将审查低价进口产品，相关企业面临清关延迟和价格重谈压力。" },
  ],
  "技术壁垒": [
    { title: "{country}加强高科技投资审查", summary: "{country}监管部门将通信、AI和新能源设备列为敏感领域，外资并购和技术合作审批趋严。" },
    { title: "{country}数据与技术标准出现分裂风险", summary: "{country}计划采用新的本地技术认证标准，跨国企业需重新评估产品合规和适配成本。" },
  ],
  "国有化征收": [
    { title: "{country}讨论提高矿业国有持股比例", summary: "{country}议会提出扩大国家在矿业项目中的权益，现有外资合同面临重新谈判可能。" },
    { title: "{country}地方政府征用项目土地", summary: "{country}地方政府以公共利益为由征用项目周边土地，企业资产权属和补偿安排存在不确定性。" },
  ],
  "长臂管辖": [
    { title: "{country}跨境合规执法压力上升", summary: "{country}监管机构要求企业补充海外交易、供应商和数据流向说明，合规审查周期拉长。" },
    { title: "{country}行业监管被用于商业谈判施压", summary: "{country}执法部门对外资企业发起集中检查，涉及税务、劳工、环保和反垄断问题。" },
  ],
  "数字对抗": [
    { title: "{country}关键基础设施遭网络攻击", summary: "{country}港口、电力或政府系统出现网络攻击迹象，企业线上服务和物流调度受到影响。" },
    { title: "{country}跨境数据本地化要求收紧", summary: "{country}发布新的数据存储和跨境传输要求，平台型企业需调整云服务部署架构。" },
  ],
  "绿色壁垒": [
    { title: "{country}碳排放监管影响出口企业", summary: "{country}开始执行更严格的碳排放核算和绿色认证要求，资源出口和制造企业合规成本上升。" },
    { title: "{country}极端天气冲击项目现场", summary: "{country}遭遇洪水、干旱或高温天气，交通、供水和现场安全管理压力增加。" },
  ],
  "社会ESG舆情": [
    { title: "{country}社区抗议指向外资项目ESG问题", summary: "{country}项目周边居民围绕就业、环保和收益分配发起抗议，企业声誉和施工连续性受到影响。" },
    { title: "{country}社交媒体负面话题快速扩散", summary: "{country}本地社交平台出现针对企业的负面传播，舆论从个案投诉扩散为群体性抵制。" },
  ],
};

// 生成60条模拟事件数据（一个月时间，每天约2条）
export function generateMockEvents(): EventItem[] {
  const events: EventItem[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // 30天前

  const allCategories = Object.keys(eventTemplates);

  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);

    // 每天生成2条事件
    for (let eventOfDay = 0; eventOfDay < 2; eventOfDay++) {
      // 随机选择国家和类别
      const location = africanLocations[Math.floor(Math.random() * africanLocations.length)];
      const category = allCategories[Math.floor(Math.random() * allCategories.length)];
      const templates = eventTemplates[category];
      const template = templates[Math.floor(Math.random() * templates.length)];

      // 随机生成时间
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      currentDate.setHours(hour, minute, 0, 0);

      // 生成热度（70-98之间）
      const popularity = Math.floor(Math.random() * 28) + 70;

      // 选择随机来源
      const source = eventSources[Math.floor(Math.random() * eventSources.length)];

      // 生成事件ID
      const eventId = `evt-${String(day + 1).padStart(2, '0')}-${String(eventOfDay + 1).padStart(2, '0')}`;

      // ���换模板中的占位符
      const title = template.title.replace(/{country}/g, location.country);
      const summary = template.summary.replace(/{country}/g, location.country);


      // 按新的15项小指标生成事件标签
      const categoryId = tagNameToId[category] || category;
      const level3Tags = subTags[categoryId] || [];
      const randomLevel3Tag = level3Tags.length > 0
        ? level3Tags[Math.floor(Math.random() * level3Tags.length)]
        : undefined;

      // 构建标签数组：小指标id + 细分标签（当前演示口径以小指标为主）
      const eventTags = randomLevel3Tag ? [categoryId, randomLevel3Tag] : [categoryId];

      events.push({
        id: eventId,
        datetime: currentDate.toISOString(),
        country: location.country,
        tags: eventTags,
        title: title,
        summary: summary,
        source: source,
        coordinates: [location.coordinates[0], location.coordinates[1]],
        link: `https://example.com/events/${eventId}`,
        popularity: popularity,
      });
    }
  }

  // 按时间降序排序
  events.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  // 添加演示专用事件："埃及通过新法律" - 放在最新位置
  const demoEvent: EventItem = {
    id: "demo-egypt-law-001",
    datetime: new Date().toISOString(), // 当前时间
    country: "埃及",
    tags: ["policy-continuity"],
    title: "埃及通过新投资法，设立特殊经济区",
    summary: "埃及议会今日正式通过新的投资法，将在苏伊士运河走廊、红海沿岸等地设立3个特殊经济区。新法律提供税收减免、土地优惠和简化审批程序等措施，旨在吸引外资、促进经济发展。同时法律还加强了对投资者权益的保护，建立了国际仲裁机制。该法案获得了议会压倒性支持，将在总统签署后立即生效。分析人士认为这是埃及经济改革的重要里程碑。",
    source: "中东经济观察",
    coordinates: [31.2357, 30.0444], // 开罗坐标
    link: "https://example.com/events/demo-egypt-law-001",
    popularity: 95, // 高热度，便于演示
  };

  // 将演示事件插入到最前面
  events.unshift(demoEvent);

  return events;
}

// 生成并导出事件数据
export const mockEvents: EventItem[] = generateMockEvents();
