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
    "通货膨胀失控与物价暴���",
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


// 事件模板库
const eventTemplates: Record<string, Array<{title: string, summary: string}>> = {
  "政治稳定性": [
    { title: "{country}选举委员会宣布推迟选举结果公布", summary: "{country}独立选举委员会宣布，由于技术故障和部分地区的计票争议，选举结果将推迟公布。主要反对党候选人指控选举过程中存在大规模违规行为。" },
    { title: "{country}爆发大规模示威游行", summary: "{country}首都爆发大规模示威活动，数千名民众抗议政府政策。示威者与安全部队发生冲突，造成多人受伤。当局已实施宵禁。" },
    { title: "{country}政府内阁重组", summary: "{country}总统宣布改组内阁，更换了包括财政部长、外交部长在内的多名重要内阁成员。分析认为此次改组旨在应对当前经济和政治危机。" },
    { title: "{country}反对党领袖被拘留", summary: "{country}警方以腐败指控逮捕了主要反对党领袖。支持者称这是政治迫害，呼吁国际社会干预。" },
    { title: "{country}宪法法院裁决引发争议", summary: "{country}宪法法院作出裁决，允许现任总统再次参选，引发反对派强烈不满。分析人士担忧可能引发政治动荡。" },
    { title: "{country}地方自治要求升级", summary: "{country}某地区宣布寻求更大自治权，要求中央政府下放更多权力。分离主义组织威胁将采取进一步行动。" },
    { title: "{country}实施国家紧急状态", summary: "由于安全局势恶化，{country}政府宣布实施国家紧急状态，加强安全措施。人权组织对此表示担忧。" },
  ],
  "经济韧性": [
    { title: "{country}货币汇率创历史新低", summary: "{country}货币兑美元汇率大幅贬值，创历史新低。央行宣布紧急干预措施，包括抛售外汇储备和上调利率。" },
    { title: "{country}通货膨胀率突破新高", summary: "{country}统计局公布数据显示，年通胀率已超过50%，食品和能源价格飙升。民众生活成本大幅上升。" },
    { title: "{country}主权债务违约风险上升", summary: "国际评级机构下调{country}主权信用评级，警告其面临债务违约风险。政府正与债权人就债务重组进行谈判。" },
    { title: "{country}银行发生挤兑潮", summary: "{country}多家银行出现挤兑现象，民众对银行系统信心下降。央行宣布提供紧急流动性支持。" },
    { title: "{country}宣布燃油补贴改革", summary: "{country}政府宣布将分阶段取消燃油补贴，以缓解财政压力。专家警告可能引发物价上涨和社会不满。" },
    { title: "{country}失业率创历史新高", summary: "{country}劳动部公布数据显示，青年失业率已超过40%。经济学家警告高失业率可能引发社会动荡。" },
    { title: "{country}获得国际货币基金组织救助", summary: "{country}与国际货币基金组织达成救助协议，将获得数十亿美元贷款。作为交换，承诺实施财政紧缩政策。" },
  ],
  "社会治安": [
    { title: "{country}发生武装抢劫案件", summary: "{country}某城市发生武装抢劫银行案件，多名劫匪与警方交火，造成人员伤亡。警方正在追捕在逃嫌疑人。" },
    { title: "{country}绑架勒索案件增加", summary: "{country}近期绑架勒索案件明显增加，受害者包括外籍人士和富商。警方称这是有组织犯罪集团所为。" },
    { title: "{country}发生群体性暴力事件", summary: "{country}两个社区之间爆发冲突，造成多人伤亡。警方已部署力量维持秩序，局势仍然紧张。" },
    { title: "{country}枪击事件造成伤亡", summary: "{country}某地发生枪击事件，造成多人伤亡。警方正在调查动机，尚未排除恐怖主义可能性。" },
    { title: "{country}破获重大毒品走私案", summary: "{country}警方和海关部门联合行动，破获一起重大毒品走私案，缴获大量毒品并逮捕多名嫌疑人。" },
    { title: "{country}打击有组织犯罪行动", summary: "{country}安全部队展开大规模行动，打击有组织犯罪集团。行动中多名嫌疑人被捕，大量武器被缴获。" },
  ],
  "自然灾害": [
    { title: "{country}遭遇严重洪水灾害", summary: "持续强降雨导致{country}多个省份发生洪水灾害，数千人流离失所。政府已启动紧急响应机制，请求国际援助。" },
    { title: "{country}遭受严重干旱", summary: "{country}遭遇数十年来最严重干旱，农作物大面积歉收，数百万人面临粮食危机。联合国呼吁国际社会提供援助。" },
    { title: "{country}发生地震", summary: "{country}发生强烈地震，造成建筑物损毁和人员伤亡。救援工作正在进行，伤亡数字可能进一步上升。" },
    { title: "{country}爆发传染病疫情", summary: "{country}卫生部门宣布爆发传染病疫情，已有多人感染。政府正在采取隔离和疫苗接种措施。" },
    { title: "{country}遭遇蝗灾侵袭", summary: "大规模蝗群入侵{country}，对农作物造成严重威胁。粮农组织警告可能引发粮食危机。" },
    { title: "{country}热带气旋造成破坏", summary: "热带气旋袭击{country}沿海地区，造成房屋损毁、基础设施破坏和人员伤亡。当局已展开救援行动。" },
  ],
  "恐怖主义": [
    { title: "{country}发生恐怖袭击事件", summary: "{country}某城市发生恐怖袭击，造成平民伤亡。极端组织声称对袭击负责。当局已加强安全措施。" },
    { title: "{country}爆炸袭击造成伤亡", summary: "{country}发生爆炸袭击，目标包括安全部队检查站。目前尚无组织声称负责，调查正在进行。" },
    { title: "{country}自杀式袭击事件", summary: "{country}发生自杀式袭击事件，袭击者在人群密集地点引爆爆炸装置。极端组织声称对此负责。" },
    { title: "{country}边境安全部队遭袭", summary: "{country}边境安全部队遭遇武装分子袭击，造成士兵伤亡。军方正在展开追剿行动。" },
    { title: "{country}安全机构挫败恐袭图谋", summary: "{country}安全机构宣布挫败一起恐怖袭击图谋，逮捕多名嫌疑人并缴获武器和爆炸物。" },
  ],
  "双边关系": [
    { title: "{country}与邻国发生外交争端", summary: "{country}与邻国就边界问题发生外交争端，双方互相召见大使抗议。分析人士担忧可能影响地区稳定。" },
    { title: "{country}签署双边合作协议", summary: "{country}与来访的外国代表团签署多项双边合作协议，涵盖经济、安全和人文领域。" },
    { title: "{country}召回驻外大使", summary: "{country}召回驻某国大使进行磋商，显示两国关系出现紧张。外交部门未透露具体原因。" },
    { title: "{country}与国际组织合作", summary: "{country}与国际组织签署合作协议，将在发展、安全和人权领域加强合作。" },
  ],
  "地缘政治": [
    { title: "大国在{country}展开博弈", summary: "多个大国在{country}展开外交和经济博弈，竞相扩大影响力。分析认为这将重塑地区地缘政治格局。" },
    { title: "{country}在大国竞争中寻求平衡", summary: "面对大国竞争，{country}试图在各方之间保持平衡，维护自身利益。专家称这是明智的外交策略。" },
    { title: "区域安全峰会在{country}举行", summary: "区域安全峰会在{country}举行，各国领导人讨论地区安全问题。会议发表联合声明，承诺加强合作。" },
    { title: "{country}参与区域维和行动", summary: "{country}决定向冲突地区派遣维和部队参与区域维和行动。此举得到联合国和地区组织支持。" },
  ],
  "网络安全": [
    { title: "{country}遭受网络攻击", summary: "{country}政府机构和关键基础设施遭受大规模网络攻击，部分服务中断。网络安全专家正在调查应对。" },
    { title: "{country}加强网络安全防护", summary: "{country}宣布加强网络安全防护措施，建立国家级网络安全中心。此举应对日益严峻的网络安全威胁。" },
    { title: "{country}破获网络犯罪团伙", summary: "{country}警方破获一个跨国网络犯罪团伙，该团伙涉嫌网络诈骗和黑客攻击。多名嫌疑人被捕。" },
  ],
  "供应链安全": [
    { title: "{country}港口运营受阻", summary: "由于罢工或安全原因，{country}主要港口运营受阻，影响进出口贸易。货主抱怨造成重大经济损失。" },
    { title: "{country}关键物资供应紧张", summary: "{country}出现关键物资供应紧张，政府宣布采取紧急措施确保供应链稳定。分析人士认为这反映了全球供应链问题。" },
    { title: "{country}加强供应链韧性", summary: "{country}宣布加强供应链韧性的战略，包括多元化供应来源和建立战略储备。" },
  ],
  "出行安全": [
    { title: "{country}发生严重交通事故", summary: "{country}发生严重交通事故，造成重大人员伤亡。事故原因正在调查中，初步判断涉及超速或刹车失灵。" },
    { title: "{country}航空安全事件", summary: "{country}发生航空安全事件，所幸未造成人员伤亡。民航部门已展开调查。" },
    { title: "{country}发布旅行安全警示", summary: "{country}外交部发布旅行安全警示，提醒公民注意特定地区的安全风险。建议避免前往高风险地区。" },
  ],
  "领事保护": [
    { title: "{country}发生涉及外籍人员的安全事件", summary: "{country}发生涉及外籍人员的安全事件，相关国家领事机构已介入提供协助。案件正在调查中。" },
    { title: "{country}加强对外籍人员的保护", summary: "{country}宣布加强对外籍人员的保护措施，包括增加警力部署和建立快速响应机制。" },
    { title: "{country}与外国领事机构合作", summary: "{country}与外国领事机构举行会议，讨论加强合作保护外籍公民安全和权益。" },
  ],
  "应急资源": [
    { title: "{country}启动应急响应机制", summary: "面对紧急情况，{country}政府启动应急响应机制，调动资源应对危机。各部门正协调行动。" },
    { title: "{country}接受国际人道主义援助", summary: "{country}政府接受国际社会提供的人道主义援助，用于缓解人道主义危机。援助物资正在分发给受灾民众。" },
    { title: "{country}建立应急储备体系", summary: "{country}宣布建立国家应急储备体系，确保在危机时刻能够快速调配物资和人员。" },
  ],
  "医疗卫生": [
    { title: "{country}医疗系统面临压力", summary: "{country}医疗系统因疾病爆发或资源短缺面临巨大压力。医院人满为患，医护人员呼吁政府提供更多支持。" },
    { title: "{country}启动疫苗接种计划", summary: "{country}卫生部启动大规模疫苗接种计划，目标是为高风险人群提供保护。疫苗已通过国际认证。" },
    { title: "{country}加强公共卫生体系", summary: "{country}宣布投资加强公共卫生体系，包括改善医疗设施和培训医护人员。世界卫生组织表示支持。" },
  ],
  "法律法规": [
    { title: "{country}通过新法律", summary: "{country}议会通过重要新法律，将对社会、经济或政治产生深远影响。法律将在总统签署后生效。" },
    { title: "{country}加强法治建设", summary: "{country}宣布加强法治建设的措施，包括司法改革和反腐败行动。国际社会对此表示关注。" },
    { title: "{country}法规调整影响外国投资", summary: "{country}调整相关法规，可能对外国投资产生影响。分析人士正在评估具体影响和应对策略。" },
  ],
  "文化宗教": [
    { title: "{country}发生宗教冲突事件", summary: "{country}不同宗教群体之间发生冲突，造成人员伤亡和财产损失。政府呼吁各方保持克制。" },
    { title: "{country}举办文化交流活动", summary: "{country}举办大型文化交流活动，促进不同文化之间的理解和包容。活动得到国际组织支持。" },
    { title: "{country}保护文化遗产", summary: "{country}宣布采取措施保护文化遗产，包括修复古迹和加强监管。联合国教科文组织表示赞赏。" },
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


      // 随机选择一个三级标签
      const categoryId = tagNameToId[category] || category;
      const level3Tags = subTags[categoryId] || [];
      const randomLevel3Tag = level3Tags.length > 0
        ? level3Tags[Math.floor(Math.random() * level3Tags.length)]
        : undefined;

      // 构建标签数组：二级标签id + 三级标签（如果有）
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
    tags: ["laws-regulations", "重大税制与补贴调整冲击"],
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
