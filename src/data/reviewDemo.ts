// A fixed teaching scenario shared by both review entry points. These are
// scenario assumptions, not a live event feed or measured forecast results.
export const reviewDemoEvent = {
  id: "review-tazara-community-001",
  title: "坦赞铁路沿线社区抗议与货运受阻",
  label: "坦赞铁路沿线社区抗议与货运受阻",
  country: "赞比亚",
  location: [31.2067054, -10.2434633] as [number, number],
  type: "社会ESG舆情",
  severity: "high" as const,
  popularity: 95,
  date: "2026-02-22",
  timestamp: Date.parse("2026-02-22T12:00:00Z"),
  impactRadius: 20,
  affectedPopulation: 12500,
  source: "固定演示情景，非真实事件记录",
  description: "假设 Kasama 站周边发生社区抗议并阻碍货运通行，观察风险如何沿铁路、转运仓与项目营地传导。事件、人口及资产影响均为演示设定。",
};

export const reviewDemoPeriod = { start: "2026-02-01", end: "2026-02-28" };

export function createReviewImpactZone() {
  const impactPath = [
    { step: 1, stage: "社区抗议", description: "情景设定：站点周边聚集抗议人群，货运出入口通行受限。", severity: "high" as const },
    { step: 2, stage: "铁路货运受阻", description: "关键货运节点受扰，列车装卸与发运计划需要调整。", severity: "high" as const },
    { step: 3, stage: "矿产品转运延迟", description: "运输扰动向转运仓传递，形成库存积压与交付延迟的可能性。", severity: "medium" as const },
    { step: 4, stage: "企业响应", description: "核实现场情况，协调社区沟通，并比较临时公路转运方案。", severity: "medium" as const },
  ];

  return {
    type: "社会ESG舆情",
    location: "赞比亚 · Kasama 站周边",
    coordinates: { lat: reviewDemoEvent.location[1], lng: reviewDemoEvent.location[0] },
    radius: reviewDemoEvent.impactRadius,
    affectedPopulation: reviewDemoEvent.affectedPopulation,
    criticalInfrastructure: [
      { type: "货运站", name: "Kasama 站（情景锚点）", distance: 0, impactPath: impactPath.slice(0, 2) },
    ],
    chineseAssets: [
      { type: "铁路", name: "铁路货运节点（示范）", distance: 0, risk: "high" as const, impactPath: impactPath.slice(0, 2) },
      { type: "仓储", name: "矿产品转运仓（示范）", distance: 4.2, risk: "high" as const, impactPath: impactPath.slice(1, 3) },
      { type: "营地", name: "沿线项目营地（示范）", distance: 8.6, risk: "medium" as const, impactPath: impactPath.slice(2) },
    ],
    impactPath,
    responseMeasures: [
      { category: "现场核实与人员安排", priority: "immediate" as const, measures: ["向现场负责人核实通行状态，记录证据与更新时间。", "评估员工通勤与物资保障，避免进入冲突聚集区。"] },
      { category: "物流与社区协调", priority: "short-term" as const, measures: ["比较临时公路转运的成本、时效与可行性。", "与地方代表开展社区沟通，持续观察抗议是否升级。"] },
    ],
  };
}
