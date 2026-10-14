import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { createReviewImpactZone, reviewDemoEvent, tazaraRiskEvents, type TazaraRiskEvent } from "../../data/reviewDemo";

export function ReviewDemoToolbar({ title, onReset, onExplore }: {
  title: string;
  onReset: () => void;
  onExplore: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-white px-6 py-3">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <div className="flex items-center gap-2">
        <button onClick={onReset} className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm text-[#005BBB] hover:bg-blue-50">
          <RotateCcw className="h-4 w-4" />重置选择
        </button>
        <button onClick={onExplore} className="flex items-center gap-2 rounded-lg bg-[#005BBB] px-3 py-2 text-sm text-white hover:bg-[#004494]">
          <SlidersHorizontal className="h-4 w-4" />重新选择
        </button>
      </div>
    </div>
  );
}

export function RailwayEventSelect({ selectedId, onChange }: { selectedId?: string; onChange: (event: TazaraRiskEvent) => void }) {
  return (
    <label className="mb-4 block text-xs font-medium text-gray-600">
      坦赞铁路风险事件
      <select aria-label="坦赞铁路风险事件" value={selectedId ?? ""} onChange={e => {
        const event = tazaraRiskEvents.find(item => item.id === e.target.value);
        if (event) onChange(event);
      }} className="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#005BBB]">
        <option value="" disabled>选择事件查看铁路影响</option>
        {tazaraRiskEvents.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
      </select>
    </label>
  );
}

export function ReviewDemoSummary({ event = reviewDemoEvent, destination, full = false }: {
  event?: TazaraRiskEvent;
  destination?: string;
  full?: boolean;
}) {
  const scenario = createReviewImpactZone(event);
  return (
    <section aria-label="铁路事件影响分析" className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-gray-800">
      <p className="mb-2 text-xs text-gray-500">{event.date}</p>
      <h2 className="text-base font-semibold leading-6">{event.title}</h2>
      <p className="mt-2 text-xs leading-5">{event.description}</p>
      <div className="mt-3 space-y-1 text-xs leading-5">
        <p><span className="text-gray-500">影响区段：</span>{event.affectedSegment}</p>
        <p><span className="text-gray-500">运输影响：</span>{event.serviceImpact}</p>
      </div>
      <div className="my-4 grid grid-cols-2 gap-3">
        <div><p className="text-xl font-semibold tabular-nums">{scenario.radius} <span className="text-xs font-normal">km</span></p><p className="text-xs text-gray-500">影响半径</p></div>
        <div><p className="text-xl font-semibold tabular-nums">{scenario.chineseAssets.length} <span className="text-xs font-normal">处</span></p><p className="text-xs text-gray-500">关注资产</p></div>
      </div>
      <p className="text-xs font-semibold leading-5 text-[#005BBB]">{scenario.impactPath.map(step => step.stage).join(" → ")}</p>
      <p className="mt-2 text-xs leading-5">重点判断：{event.conclusion}</p>
      {full && (
        <div className="mt-5 space-y-4">
          <h3 className="font-semibold">影响路径分析</h3>
          {scenario.impactPath.map(step => <p key={step.step} className="text-sm leading-6"><strong>{step.step}. {step.stage}：</strong>{step.description}</p>)}
          <h3 className="font-semibold">关注资产与响应</h3>
          {scenario.chineseAssets.map(asset => <p key={asset.name} className="text-sm">{asset.name} · 距离 {asset.distance} km · {asset.risk === "high" ? "高" : asset.risk === "medium" ? "中" : "低"}风险</p>)}
          {scenario.responseMeasures.map(item => <p key={item.category} className="text-sm leading-6"><strong>{item.category}：</strong>{item.measures.join(" ")}</p>)}
          <p className="text-xs leading-5 text-gray-500">方法说明：影响半径、人口及资产为情景分析输入；空间暴露不代表实际损失，情景事件不作为已发生事实。</p>
        </div>
      )}
      {destination && <Link to={`${destination}?event=${encodeURIComponent(event.id)}`} className="mt-3 inline-block text-xs font-semibold text-[#005BBB] hover:underline">{destination === "/regional-insights" ? "查看该事件的重点资产 →" : "查看该事件的影响分析 →"}</Link>}
    </section>
  );
}
