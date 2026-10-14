import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { createReviewImpactZone, reviewDemoEvent } from "../../data/reviewDemo";

export function ReviewDemoToolbar({ isDemo, onReset, onExplore }: {
  isDemo: boolean;
  onReset: () => void;
  onExplore: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-white px-6 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{isDemo ? "示范案例已加载 · 坦赞铁路物流风险" : "自主探索 · 选择事件与重点资产"}</p>
        <p className="mt-1 text-xs text-gray-500">{isDemo ? "直接查看事件、影响路径与企业响应；案例参数为固定演示设定。" : "可随时恢复完整示范案例；本看板用于情景演示。"}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onReset} className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm text-[#005BBB] hover:bg-blue-50">
          <RotateCcw className="h-4 w-4" />恢复示范案例
        </button>
        <button onClick={onExplore} className="flex items-center gap-2 rounded-lg bg-[#005BBB] px-3 py-2 text-sm text-white hover:bg-[#004494]">
          <SlidersHorizontal className="h-4 w-4" />重新选择
        </button>
      </div>
    </div>
  );
}

export function ReviewDemoSummary({ destination, full = false }: { destination?: string; full?: boolean }) {
  const scenario = createReviewImpactZone();
  return (
    <section aria-label="示范案例说明" className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-gray-800">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-[#005BBB]">固定演示情景</span>
        <span className="text-gray-500">{reviewDemoEvent.date}</span>
      </div>
      <h2 className="text-base font-semibold leading-6">{reviewDemoEvent.title}</h2>
      <p className="mt-2 text-xs leading-5">{reviewDemoEvent.description}</p>
      <div className="my-4 grid grid-cols-2 gap-3">
        <div><p className="text-xl font-semibold tabular-nums">20 <span className="text-xs font-normal">km</span></p><p className="text-xs text-gray-500">设定影响半径</p></div>
        <div><p className="text-xl font-semibold tabular-nums">3 <span className="text-xs font-normal">处</span></p><p className="text-xs text-gray-500">示范关注资产</p></div>
      </div>
      <p className="text-xs font-semibold leading-5 text-[#005BBB]">社区抗议 → 铁路受阻 → 转运延迟 → 企业响应</p>
      <p className="mt-2 text-xs leading-5">重点判断：局部节点受扰可能传导至物流履约。先核实现场，再比较转运方案并开展社区沟通。</p>
      {full && (
        <div className="mt-5 space-y-4">
          <h3 className="font-semibold">示范分析过程</h3>
          {scenario.impactPath.map(step => <p key={step.step} className="text-sm leading-6"><strong>{step.step}. {step.stage}：</strong>{step.description}</p>)}
          <h3 className="font-semibold">关注资产与响应</h3>
          {scenario.chineseAssets.map(asset => <p key={asset.name} className="text-sm">{asset.name} · 设定距离 {asset.distance} km · {asset.risk === "high" ? "高" : "中"}风险</p>)}
          {scenario.responseMeasures.map(item => <p key={item.category} className="text-sm leading-6"><strong>{item.category}：</strong>{item.measures.join(" ")}</p>)}
          <p className="text-xs leading-5 text-gray-500">方法边界：圆形影响区为情景假设；12,500 人为演示参数，并非人口栅格计算结果。地图站点用于定位，资产与事件为模拟。空间暴露不等于实际损失，也不证明提前预警能力。</p>
        </div>
      )}
      {destination && <Link to={destination} className="mt-3 inline-block text-xs font-semibold text-[#005BBB] hover:underline">{destination === "/regional-insights" ? "查看同一案例的重点资产 →" : "查看同一案例的影响分析 →"}</Link>}
    </section>
  );
}
