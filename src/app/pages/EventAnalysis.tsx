import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { FeatureCollection } from "geojson";
import { eventAnalysisSamples } from "../../data/eventAnalysisSamples";
import {
  EVENT_TAG_GROUPS,
  SIGNAL_NAMES,
  validateAdvice,
  validateExtraction,
  type EventAdvice,
  type EventExtraction,
  type EventTag,
  type SignalKey,
} from "../../data/eventAnalysisSchema";
import { loadTazaraData, type TazaraData } from "../../utils/loadTazaraData";
import { loadAfricaBoundaries } from "../../utils/loadAfricaBoundaries";
import {
  buildAdviceInput,
  computeEventAnalysis,
  GAZETTEER,
  HISTORY_NOTICE,
  PROJECTS,
  SIGNAL_WEIGHTS,
  WARNING_THRESHOLDS,
  uniqueStations,
  validCoordinate,
  type AnalysisHit,
  type EventComputation,
  type ManualCorrection,
  type ResolvedPlace,
} from "../../utils/eventAnalysis";
import EventAnalysisMap from "../components/map/EventAnalysisMap";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#005BBB] px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";
const fmt = (v: number | null | undefined, digits = 3) =>
  v == null ? "—" : Number.isFinite(v) ? v.toFixed(digits) : "不可达";
type Stage = "idle" | "extract" | "spatial" | "compute" | "advise";
type ApiFailure = { stage: "extract" | "compute" | "advise"; message: string };
function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-3 text-base font-semibold text-slate-900">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm text-[#005BBB]">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
function Hits({ title, hits }: { title: string; hits: AnalysisHit[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-800">
        {title}（{hits.length}）
      </h3>
      {hits.length ? (
        <div className="max-h-60 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-2">名称</th>
                <th className="p-2">R</th>
                <th className="p-2">c / 成本公里</th>
              </tr>
            </thead>
            <tbody>
              {hits.map((hit, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="p-2">
                    {hit.name}
                    <span className="block text-xs text-slate-500">
                      {hit.source}
                    </span>
                  </td>
                  <td className="p-2 tabular-nums">{fmt(hit.impact)}</td>
                  <td className="p-2 tabular-nums">{fmt(hit.costKm, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">没有达到 R ≥ 0.1 的命中。</p>
      )}
    </div>
  );
}
async function requestAnalysis(body: unknown, signal: AbortSignal) {
  let response: Response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("无法连接研判 API，请确认本地 API 已启动后重试。");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "研判 API 未返回 JSON。npm run dev 仅启动前端，请使用 vercel dev 启动 API。",
    );
  }
  if (!response.ok)
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "研判服务请求失败，请重试。",
    );
  return data;
}

export default function EventAnalysis() {
  const [text, setText] = useState("");
  const [projectId, setProjectId] = useState("tazara");
  const [extraction, setExtraction] = useState<EventExtraction | null>(null);
  const [result, setResult] = useState<EventComputation | null>(null);
  const [spatial, setSpatial] = useState<{
    data: TazaraData;
    countries: FeatureCollection;
  } | null>(null);
  const [advice, setAdvice] = useState<EventAdvice | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [formError, setFormError] = useState("");
  const [manualTag, setManualTag] = useState<EventTag>("社会ESG舆情");
  const [manualLocation, setManualLocation] = useState("current");
  const [manualRisk, setManualRisk] = useState(true);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const controller = useRef<AbortController | null>(null);
  const serial = useRef(0);
  const pendingCorrection = useRef<ManualCorrection | null>(null);
  const busy = stage !== "idle";
  const length = Array.from(text.trim()).length;
  useEffect(
    () => () => {
      serial.current++;
      controller.current?.abort();
    },
    [],
  );
  const stationOptions = useMemo(
    () => uniqueStations(spatial?.data.stations ?? []),
    [spatial],
  );
  const begin = () => {
    controller.current?.abort();
    controller.current = new AbortController();
    const id = ++serial.current;
    return { id, signal: controller.current.signal };
  };
  function changeInput(nextText: string, nextProject = projectId) {
    serial.current++;
    controller.current?.abort();
    setStage("idle");
    pendingCorrection.current = null;
    setText(nextText);
    setProjectId(nextProject);
    setExtraction(null);
    setResult(null);
    setAdvice(null);
    setFailure(null);
    setFormError("");
  }
  async function generateAdvice(
    computed: EventComputation,
    run: { id: number; signal: AbortSignal },
  ) {
    if (!computed.model || computed.L === null) return;
    setStage("advise");
    try {
      const data = validateAdvice(
        await requestAnalysis(
          { mode: "advise", computed: buildAdviceInput(computed) },
          run.signal,
        ),
      );
      if (run.id === serial.current) setAdvice(data);
    } catch (error) {
      if (run.id === serial.current)
        setFailure({
          stage: "advise",
          message: error instanceof Error ? error.message : "AI 建议请求失败。",
        });
    }
  }
  async function calculate(
    extracted: EventExtraction,
    manual: ManualCorrection | null,
    withAdvice: boolean,
    run: { id: number; signal: AbortSignal },
  ) {
    pendingCorrection.current = manual;
    let activeStage: ApiFailure["stage"] = "compute";
    try {
      setStage("spatial");
      const [data, countries] = spatial
        ? [spatial.data, spatial.countries]
        : await Promise.all([loadTazaraData(), loadAfricaBoundaries()]);
      if (run.id !== serial.current) return;
      setSpatial({ data, countries });
      setStage("compute");
      // Let the loading step paint before running the synchronous grid calculation.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (run.id !== serial.current) return;
      const computed = computeEventAnalysis(extracted, data, countries, manual);
      setResult(computed);
      if (withAdvice) {
        activeStage = "advise";
        await generateAdvice(computed, run);
      }
    } catch (error) {
      if (run.id === serial.current)
        setFailure({
          stage: activeStage,
          message:
            error instanceof Error ? error.message : "空间计算失败，请重试。",
        });
    } finally {
      if (run.id === serial.current) setStage("idle");
    }
  }
  async function start() {
    if (length < 10 || length > 6000) {
      setFormError("请输入 10–6000 字符的事件文本。");
      return;
    }
    const run = begin();
    setFailure(null);
    setFormError("");
    setResult(null);
    setAdvice(null);
    setExtraction(null);
    setStage("extract");
    try {
      const extracted = validateExtraction(
        await requestAnalysis(
          { mode: "extract", text: text.trim(), projectId },
          run.signal,
        ),
        text.trim(),
      );
      if (run.id !== serial.current) return;
      setExtraction(extracted);
      setManualTag(extracted.primary_tag);
      setManualRisk(extracted.is_risk_event);
      setManualLocation("current");
      setLatitude("");
      setLongitude("");
      await calculate(extracted, null, true, run);
    } catch (error) {
      if (run.id === serial.current) {
        setFailure({
          stage: "extract",
          message: error instanceof Error ? error.message : "AI 抽取失败。",
        });
        setStage("idle");
      }
    }
  }
  async function recalculate() {
    if (!extraction || !result) return;
    let place: ResolvedPlace | null = null;
    if (manualLocation === "current") place = result.selectedPlace;
    else if (manualLocation.startsWith("station:")) {
      const station = stationOptions[Number(manualLocation.split(":")[1])];
      if (station)
        place = {
          name: station.name,
          originalName: station.name,
          coordinates: station.coordinates,
          country: station.type === "tanzania" ? "坦桑尼亚" : "赞比亚",
          source: "站点库",
        };
    } else if (manualLocation.startsWith("city:")) {
      const city = GAZETTEER[Number(manualLocation.split(":")[1])];
      if (city)
        place = {
          name: city.name,
          originalName: city.name,
          coordinates: city.coordinates,
          country: city.country,
          source: "城市库",
        };
    } else if (manualLocation === "coordinates") {
      const coordinate = [Number(longitude), Number(latitude)];
      if (
        !longitude.trim() ||
        !latitude.trim() ||
        !validCoordinate(coordinate)
      ) {
        setFormError("请输入有效坐标：经度 −180 至 180，纬度 −85 至 85。");
        return;
      }
      place = {
        name: "人工指定地点",
        originalName: "人工指定地点",
        coordinates: [coordinate[0], coordinate[1]],
        country: "",
        source: "人工坐标",
      };
    }
    if (manualRisk && !place?.coordinates) {
      setFormError("请从站点/城市库选择地点，或输入有效经纬度。");
      return;
    }
    const run = begin();
    setFormError("");
    setFailure(null);
    setAdvice(null);
    setResult(null);
    await calculate(
      extraction,
      { primaryTag: manualTag, place, isRiskEvent: manualRisk },
      false,
      run,
    );
  }
  async function retry() {
    if (failure?.stage === "extract") return start();
    const run = begin();
    setFailure(null);
    if (failure?.stage === "advise" && result) {
      await generateAdvice(result, run);
      if (run.id === serial.current) setStage("idle");
    } else if (extraction)
      await calculate(extraction, pendingCorrection.current, true, run);
  }
  const stepLabels: Record<Exclude<Stage, "idle">, string> = {
    extract: "正在调用 AI 抽取事件与原文证据…",
    spatial: "正在解析地点并加载铁路 / 国家边界…",
    compute: "正在计算成本距离网格与项目压力…",
    advise: "计算已完成，正在基于结果生成 AI 建议…",
  };

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-7">
          <h1 className="text-2xl font-semibold text-slate-950">事件研判</h1>
        </header>
        <div className="grid items-start gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <FileSearch className="h-5 w-5 text-[#005BBB]" />
              输入事件
            </h2>
            <label
              htmlFor="analysis-project"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              目标项目
            </label>
            <select
              id="analysis-project"
              className={fieldClass}
              value={projectId}
              onChange={(e) => changeInput(text, e.target.value)}
            >
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <label
              htmlFor="analysis-text"
              className="mb-2 mt-5 block text-sm font-medium text-slate-700"
            >
              新闻 / 事件文本
            </label>
            <textarea
              id="analysis-text"
              rows={11}
              className={`${fieldClass} resize-y leading-6`}
              placeholder="粘贴新闻原文，支持中文、English、Français、Kiswahili。"
              value={text}
              onChange={(e) => changeInput(e.target.value)}
            />
            <p
              className={`mt-1 text-right text-xs ${length > 6000 ? "text-red-600" : "text-slate-400"}`}
            >
              {length} / 6000 字符 · 至少 10 字符
            </p>
            <button
              type="button"
              className={`${buttonClass} mt-4 w-full`}
              disabled={busy || length < 10 || length > 6000}
              onClick={start}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSearch className="h-4 w-4" />
              )}
              {busy ? "研判中…" : "开始研判"}
            </button>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs text-slate-500">
                载入示例（均为虚构新闻，点击后仍需开始研判）
              </p>
              <div className="grid grid-cols-2 gap-2">
                {eventAnalysisSamples.map((sample) => (
                  <button
                    key={sample.id}
                    className="rounded-lg border border-slate-200 px-2 py-2 text-left text-xs leading-5 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => changeInput(sample.text)}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              文本将发送至服务端 AI
              进行抽取。所有指数由客户端按公开参数计算，空间命中不代表实际受损。
            </p>
          </aside>
          <main className="min-w-0 space-y-5" aria-busy={busy}>
            {busy && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"
              >
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                {stepLabels[stage]}
              </div>
            )}
            {failure && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <p className="font-medium">
                  {failure.stage === "extract"
                    ? "AI 抽取失败"
                    : failure.stage === "advise"
                      ? "AI 建议生成失败"
                      : "客户端计算失败"}
                </p>
                <p className="mt-2">{failure.message}</p>
                <button
                  disabled={busy}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 disabled:opacity-50"
                  onClick={retry}
                >
                  <RefreshCw className="h-4 w-4" />
                  重试{failure.stage === "advise" ? "建议" : ""}
                </button>
              </div>
            )}
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                {formError}
              </div>
            )}
            {!extraction && !busy && !failure && (
              <div className="flex min-h-[480px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-8 text-center">
                <div className="mb-5 rounded-2xl bg-blue-50 p-4 text-[#005BBB]">
                  <FileSearch className="h-9 w-9" />
                </div>
                <h2 className="text-lg font-medium text-slate-800">
                  让每一步研判都有依据
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                  输入一条事件，查看原文证据、地名来源、计算公式、影响范围和预警建议。可从左侧四个虚构示例开始。
                </p>
                <p className="mt-6 text-xs text-slate-400">
                  低置信度、非风险和无法定位的事件将提示人工复核。
                </p>
              </div>
            )}
            {extraction && (
              <>
                {result &&
                  (result.reviewReasons.length > 0 || result.manual) && (
                    <div
                      role="alert"
                      className={`rounded-xl border p-4 ${result.reviewReasons.length ? "border-amber-300 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}
                    >
                      <h2 className="flex items-center gap-2 font-semibold">
                        {result.reviewReasons.length ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                        {result.reviewReasons.length ? "需人工复核" : "已人工修正"}{result.manual && result.reviewReasons.length > 0 && <span className="text-xs font-normal">已人工修正</span>}
                      </h2>
                      <p className="mt-2 text-xs">
                        {result.manual
                          ? "已按人工选择重算；以下列出仍需复核的原因，原始 AI 判断另行保留。"
                          : "以下结果需核对后使用，可在下方修正标签、地点及事件判定。"}
                      </p>
                      <ul className="mt-2 list-inside list-disc text-sm leading-6">
                        {result.reviewReasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
{result.manual && result.originalReviewReasons.length > 0 && <details className="mt-3 text-xs"><summary className="cursor-pointer">查看原始 AI 复核原因</summary><ul className="mt-2 list-inside list-disc leading-6">{result.originalReviewReasons.map(reason => <li key={reason}>{reason}</li>)}</ul></details>}
                    </div>
                  )}
                <Step number={1} title="AI 抽取 · 原文证据">
                  <div className="mb-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-800">
                      整体置信度 {fmt(extraction.confidence, 2)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {extraction.is_risk_event ? "风险事件" : "非风险事件"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {extraction.primary_tag}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-slate-800">
                    {extraction.summary}
                  </p>
                  <dl className="mt-3 grid grid-cols-[90px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                    <dt className="text-slate-500">判断依据</dt>
                    <dd>{extraction.reason}</dd>
                    <dt className="text-slate-500">次标签</dt>
                    <dd>{extraction.secondary_tags.join("、") || "无"}</dd>
                    <dt className="text-slate-500">事件日期</dt>
                    <dd>{extraction.event_date ?? "原文未明确完整日期"}</dd>
                    <dt className="text-slate-500">确认项</dt>
                    <dd>
                      {extraction.confirmation
                        ? "是 · 预警上调一级（最高高危）"
                        : "否"}
                    </dd>
                  </dl>
                  <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                          <th className="p-3">E → S → V → C</th>
                          <th className="p-3">强度</th>
                          <th className="p-3">原文引句</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Object.keys(SIGNAL_NAMES) as SignalKey[]).map(
                          (key) => (
                            <tr key={key} className="border-t border-slate-100">
                              <td className="min-w-36 p-3 text-xs">
                                <b>{key}</b> · {SIGNAL_NAMES[key]}
                              </td>
                              <td className="p-3 tabular-nums">
                                {fmt(extraction.signals[key].strength, 2)}
                              </td>
                              <td className="min-w-40 p-3 text-xs leading-6">
                                {extraction.signals[key].evidence ? (
                                  <q>{extraction.signals[key].evidence}</q>
                                ) : (
                                  "无原文证据"
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    引句经服务端逐字校验；整体置信度适用于本次抽取，模型未提供逐字段置信度。
                  </p>
                  <details className="mt-3 text-xs text-slate-500">
                    <summary className="cursor-pointer">
                      查看全部抽取字段（含原始地点、坐标）
                    </summary>
                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3">
                      {JSON.stringify(extraction, null, 2)}
                    </pre>
                  </details>
                </Step>
                {result && (
                  <>
                    <Step number={2} title="地点解析与人工修正">
                      <div className="space-y-2">
                        {result.places.length ? (
                          result.places.map((place, i) => (
                            <div
                              key={i}
                              className="rounded-lg bg-slate-50 p-3 text-sm"
                            >
                              <div className="flex flex-wrap justify-between gap-2">
                                <span>
                                  {place.originalName} → {place.name}
                                </span>
                                <span
                                  className={`text-xs ${place.source.includes("低置信") || !place.coordinates ? "text-amber-700" : "text-[#005BBB]"}`}
                                >
                                  {place.source}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {place.country || "国家未知"} ·{" "}
                                {place.coordinates
                                  ? `经度 ${fmt(place.coordinates[0], 6)} / 纬度 ${fmt(place.coordinates[1], 6)}`
                                  : "无可用坐标"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-amber-700">
                            unresolved：原文无可识别地点。
                          </p>
                        )}
                      </div>
                      <p className="mt-3 text-xs leading-6 text-slate-500">
                        解析顺序：站点库 → 城市库 → LLM
                        坐标（低置信）。本次计算点：
                        {result.selectedPlace
                          ? `${result.selectedPlace.name} · ${result.selectedPlace.source}`
                          : "未确定"}
                        。{result.manual && "此位置为人工选择。"}{" "}
                        多地事件仅计算首个可解析地点。
                      </p>
                      {result.selectedPlace?.coordinates && (
                        <p className="mt-1 text-xs text-slate-500">
                          本次计算坐标：经度{" "}
                          {fmt(result.selectedPlace.coordinates[0], 6)} / 纬度{" "}
                          {fmt(result.selectedPlace.coordinates[1], 6)}
                        </p>
                      )}
                      <details
                        className="mt-4 rounded-lg border border-slate-200 p-4"
                        open={
                          result.reviewReasons.length > 0 || !!result.manual
                        }
                      >
                        <summary className="cursor-pointer text-sm font-medium text-[#005BBB]">
                          人工修正
                        </summary>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="manual-tag"
                              className="mb-1 block text-xs text-slate-500"
                            >
                              主标签
                            </label>
                            <select
                              id="manual-tag"
                              className={fieldClass}
                              value={manualTag}
                              onChange={(e) =>
                                setManualTag(e.target.value as EventTag)
                              }
                            >
                              {EVENT_TAG_GROUPS.map((group) => (
                                <optgroup key={group.name} label={group.name}>
                                  {group.tags.map((tag) => (
                                    <option key={tag}>{tag}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="manual-location"
                              className="mb-1 block text-xs text-slate-500"
                            >
                              事件地点
                            </label>
                            <select
                              id="manual-location"
                              className={fieldClass}
                              value={manualLocation}
                              onChange={(e) =>
                                setManualLocation(e.target.value)
                              }
                            >
                              <option value="current">
                                沿用本次解析地点
                                {!result.selectedPlace ? "（尚未确定）" : ""}
                              </option>
                              <option value="coordinates">
                                手动输入经纬度
                              </option>
                              <optgroup label="TAZARA 站点库">
                                {stationOptions.map((station, i) => (
                                  <option key={i} value={`station:${i}`}>
                                    {station.name}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="城市库">
                                {GAZETTEER.map((city, i) => (
                                  <option key={i} value={`city:${i}`}>
                                    {city.name} / {city.aliases[0]}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                          {manualLocation === "coordinates" && (
                            <>
                              <div>
                                <label
                                  htmlFor="manual-lon"
                                  className="mb-1 block text-xs text-slate-500"
                                >
                                  经度（−180 至 180）
                                </label>
                                <input
                                  id="manual-lon"
                                  type="number"
                                  step="any"
                                  min="-180"
                                  max="180"
                                  className={fieldClass}
                                  value={longitude}
                                  onChange={(e) => setLongitude(e.target.value)}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="manual-lat"
                                  className="mb-1 block text-xs text-slate-500"
                                >
                                  纬度（−85 至 85）
                                </label>
                                <input
                                  id="manual-lat"
                                  type="number"
                                  step="any"
                                  min="-85"
                                  max="85"
                                  className={fieldClass}
                                  value={latitude}
                                  onChange={(e) => setLatitude(e.target.value)}
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <label className="mt-4 flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={manualRisk}
                            onChange={(e) => setManualRisk(e.target.checked)}
                          />
                          人工判定为风险事件（取消则不生成足迹）
                        </label>
                        <p className="mt-3 text-xs leading-6 text-slate-500">
                          信号强度、确认项与原始置信度保留。此按钮只重算客户端部分，旧建议会清除；新建议可在步骤
                          7 单独生成。
                        </p>
                        <button
                          disabled={busy}
                          className={`${buttonClass} mt-3`}
                          onClick={recalculate}
                        >
                          <RefreshCw className="h-4 w-4" />
                          按修正重新计算
                        </button>
                      </details>
                    </Step>
                    <Step number={3} title="指数计算 · 参数与公式">
                      <div className="rounded-lg bg-slate-900 p-4 font-mono text-sm leading-7 text-slate-100">
                        <p>R = s_e × k_τ × exp(−c / λ_τ)</p>
                        <p>
                          s_e = {SIGNAL_WEIGHTS.E}E + {SIGNAL_WEIGHTS.S}S +{" "}
                          {SIGNAL_WEIGHTS.V}V = {fmt(result.signalStrength)}
                        </p>
                        <p>
                          k_τ = {fmt(result.categoryWeight, 1)} ·{" "}
                          {result.primaryTag}
                        </p>
                        <p>
                          λ_τ = {result.parameters.halfDistanceKm} / ln(2) ={" "}
                          {fmt(result.parameters.lambdaKm, 2)} 成本公里
                        </p>
                        <p>L = max(站点网格 impact_unit) × s_e × k_τ</p>
                        <p>
                          L = {fmt(result.maximumSpatialImpact)} ×{" "}
                          {fmt(result.signalStrength)} ×{" "}
                          {fmt(result.categoryWeight, 1)} = {fmt(result.L)}
                        </p>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">
                        类别权重：起步等权，待逻辑回归校准。当前尺度：
                        {result.parameters.scale}，成本半衰距离{" "}
                        {result.parameters.halfDistanceKm} km。
                      </p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        项目网格以沿线站点所在 5 km 网格为代理；impact_unit
                        是强度和类别权重均为 1 的空间场。实际 R 足迹已乘 s_e 与
                        k_τ，不重复相乘。低于单位场 0.1 截止范围的网格按 0
                        处理。
                      </p>
                      {result.maximumStation && (
                        <p className="mt-2 text-xs leading-6 text-slate-500">
                          最大空间影响站点：{result.maximumStation.name}；c ={" "}
                          {fmt(result.maximumStation.costKm, 2)}{" "}
                          成本公里；exp(−c/λ) ={" "}
                          {fmt(result.maximumSpatialImpact)}。
                        </p>
                      )}
                      {result.L === null && (
                        <p className="mt-2 text-sm text-amber-700">
                          {result.isRiskEvent
                            ? "缺少事件位置，L 暂不可计算。"
                            : "当前为非风险事件，不计算项目压力和预警。"}
                        </p>
                      )}
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        陆地阻力 1，铁路缓冲 7.5 km 内阻力 0.45；跨境增加 25
                        成本公里，水域不可通行。未接入道路、地形或实时运输数据。
                      </p>
                    </Step>
                    <Step number={4} title="影响范围地图">
                      {spatial && (
                        <EventAnalysisMap result={result} data={spatial.data} />
                      )}
                    </Step>
                    <Step number={5} title="命中站点 / 物流资产">
                      {result.model ? (
                        <div className="space-y-5">
                          <Hits title="TAZARA 站点" hits={result.stationHits} />
                          <Hits title="物流资产" hits={result.assetHits} />
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          未生成足迹，命中统计暂不适用。
                        </p>
                      )}
                      <p className="mt-3 text-xs leading-6 text-slate-500">
                        命中阈值 R ≥
                        0.1。站点按名称和坐标去重；物流资产复用重点项目页既有静态目录，坐标仅作示意。统计只反映所载目录的空间暴露。
                      </p>
                    </Step>
                    <Step number={6} title="项目预警等级">
                      <div className="flex flex-wrap items-center gap-4">
                        <strong
                          className={`rounded-lg px-4 py-2 text-xl ${result.warningLevel === "高危" ? "bg-red-50 text-red-700" : result.warningLevel === "警惕" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-[#005BBB]"}`}
                        >
                          {result.warningLevel ?? "暂不评级"}
                        </strong>
                        <span className="text-sm text-slate-600">
                          L = {fmt(result.L)} · 范围 0–1
                        </span>
                        {result.manual && (
                          <span className="text-xs text-[#005BBB]">
                            已人工修正
                          </span>
                        )}
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        阈值：L ≥ {WARNING_THRESHOLDS.high} 高危；≥{" "}
                        {WARNING_THRESHOLDS.caution} 警惕；≥{" "}
                        {WARNING_THRESHOLDS.attention} 关注；其余无预警。
                      </p>
                      <p className="mt-1 text-xs leading-6 text-slate-500">
                        基础等级：{result.baseLevel ?? "不适用"}；确认项{" "}
                        {extraction.confirmation
                          ? "为真，上调一级（最高高危）"
                          : "为假，不上调"}
                        。
                        {result.reviewReasons.length > 0 &&
                          "当前等级为待人工复核的计算结果。"}
                      </p>
                      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        M 升级信号：{HISTORY_NOTICE}
                      </p>
                    </Step>
                    <Step number={7} title="AI 建议">
                      <p className="mb-3 text-xs text-slate-500">
                        基于以上计算结果生成 · 空间暴露不代表实际损失
                        {result.reviewReasons.length > 0 &&
                          " · 仍需人工复核"}
                      </p>
                      {advice ? (
                        <div className="text-sm leading-7">
                          <p className="rounded-lg bg-blue-50 p-3 font-medium text-blue-900">
                            {advice.warning}
                          </p>
                          <h3 className="mb-2 mt-4 font-medium">建议行动</h3>
                          <ol className="list-decimal space-y-1 pl-5">
                            {advice.recommendations.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ol>
                          <h3 className="mb-2 mt-4 font-medium">
                            后续观察信号
                          </h3>
                          <ul className="list-disc space-y-1 pl-5">
                            {advice.watch_signals.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          {result.model
                            ? "建议尚未生成，或需根据人工修正结果重新生成。"
                            : "当前无可用空间计算结果，不生成项目建议。"}
                        </p>
                      )}
                      {result.model && (
                        <button
                          className={`${buttonClass} mt-4`}
                          disabled={busy}
                          onClick={async () => {
                            const run = begin();
                            setFailure(null);
                            setAdvice(null);
                            await generateAdvice(result, run);
                            if (run.id === serial.current) setStage("idle");
                          }}
                        >
                          {advice ? "重新生成建议" : "生成建议"}
                        </button>
                      )}
                    </Step>
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
