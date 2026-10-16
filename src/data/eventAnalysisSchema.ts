// Names and groups mirror RegionalInsights.eventTypeConfig (the existing 3 × 15 taxonomy).
export const EVENT_TAG_GROUPS = [
  {
    name: "核心政治与权力博弈",
    tags: ["政权政策", "军事冲突", "恐怖极端", "制裁孤立", "意识形态脱钩"],
  },
  {
    name: "经贸资源对抗",
    tags: ["供应链矿产", "能源价格", "金融管制", "贸易保护", "技术壁垒"],
  },
  {
    name: "治理合规长臂管辖",
    tags: ["国有化征收", "长臂管辖", "数字对抗", "绿色壁垒", "社会ESG舆情"],
  },
] as const;
export type EventTag = (typeof EVENT_TAG_GROUPS)[number]["tags"][number];
export const EVENT_TAGS: readonly EventTag[] = EVENT_TAG_GROUPS.flatMap(
  (group) => [...group.tags],
);
export const SIGNAL_NAMES = {
  E: "事件 / 表态",
  S: "社会动员 / 扩散",
  V: "暴力 / 实际中断",
  C: "政策、法律或核实证据",
} as const;
export type SignalKey = keyof typeof SIGNAL_NAMES;
export type EventSignals = Record<
  SignalKey,
  { strength: number; evidence: string }
>;
export interface ExtractedPlace {
  name: string;
  country: string;
  lat: number | null;
  lon: number | null;
}
export interface EventExtraction {
  is_risk_event: boolean;
  primary_tag: EventTag;
  secondary_tags: EventTag[];
  signals: EventSignals;
  confirmation: boolean;
  places: ExtractedPlace[];
  event_date: string | null;
  summary: string;
  confidence: number;
  reason: string;
}
export interface EventAdvice {
  warning: string;
  recommendations: string[];
  watch_signals: string[];
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const unit = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
const str = (v: unknown, max = 3000): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
export const isEventTag = (v: unknown): v is EventTag =>
  typeof v === "string" && EVENT_TAGS.includes(v as EventTag);

// Validate model output at the server boundary and again before client calculations.
export function validateExtraction(
  value: unknown,
  sourceText?: string,
): EventExtraction {
  const fail = (): never => {
    throw new Error("AI 抽取结果不符合字段、标签或原文证据约束，请重试。");
  };
  if (!record(value)) return fail();
  if (
    typeof value.is_risk_event !== "boolean" ||
    !isEventTag(value.primary_tag) ||
    !Array.isArray(value.secondary_tags) ||
    value.secondary_tags.length > 15 ||
    !value.secondary_tags.every(isEventTag) ||
    typeof value.confirmation !== "boolean" ||
    !unit(value.confidence) ||
    !str(value.summary) ||
    !str(value.reason) ||
    !record(value.signals)
  )
    return fail();
  for (const key of Object.keys(SIGNAL_NAMES)) {
    const signal = value.signals[key];
    if (
      !record(signal) ||
      !unit(signal.strength) ||
      typeof signal.evidence !== "string" ||
      signal.evidence.length > 6000 ||
      (signal.strength > 0 && !signal.evidence.trim()) ||
      (sourceText !== undefined &&
        signal.evidence !== "" &&
        !sourceText.includes(signal.evidence))
    )
      return fail();
  }
  const c = value.signals.C as { strength: number; evidence: string };
  if (value.confirmation && (c.strength === 0 || !c.evidence.trim()))
    return fail();
  if (!Array.isArray(value.places) || value.places.length > 20) return fail();
  for (const place of value.places) {
    if (
      !record(place) ||
      !str(place.name, 200) ||
      typeof place.country !== "string" ||
      place.country.length > 100 ||
      (sourceText !== undefined && !sourceText.includes(place.name)) ||
      !(
        place.lat === null ||
        (typeof place.lat === "number" &&
          Number.isFinite(place.lat) &&
          Math.abs(place.lat) <= 90)
      ) ||
      !(
        place.lon === null ||
        (typeof place.lon === "number" &&
          Number.isFinite(place.lon) &&
          Math.abs(place.lon) <= 180)
      ) ||
      (place.lat === null) !== (place.lon === null)
    )
      return fail();
  }
  if (value.event_date !== null) {
    if (
      typeof value.event_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.event_date)
    )
      return fail();
    const date = new Date(value.event_date);
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value.event_date
    )
      return fail();
  }
  // Drop unrecognized properties rather than passing arbitrary model content downstream.
  return {
    is_risk_event: value.is_risk_event,
    primary_tag: value.primary_tag,
    secondary_tags: [...new Set(value.secondary_tags)] as EventTag[],
    signals: Object.fromEntries(
      Object.keys(SIGNAL_NAMES).map((key) => {
        const s = (
          value.signals as Record<
            string,
            { strength: number; evidence: string }
          >
        )[key];
        return [key, { strength: s.strength, evidence: s.evidence }];
      }),
    ) as EventSignals,
    confirmation: value.confirmation,
    places: value.places.map((p) => ({
      name: p.name,
      country: p.country,
      lat: p.lat,
      lon: p.lon,
    })),
    event_date: value.event_date as string | null,
    summary: value.summary,
    confidence: value.confidence,
    reason: value.reason,
  };
}
export function validateAdvice(value: unknown): EventAdvice {
  if (
    !record(value) ||
    !str(value.warning, 1000) ||
    !Array.isArray(value.recommendations) ||
    value.recommendations.length < 3 ||
    value.recommendations.length > 5 ||
    !value.recommendations.every((v) => str(v, 1000)) ||
    !Array.isArray(value.watch_signals) ||
    value.watch_signals.length < 1 ||
    value.watch_signals.length > 10 ||
    !value.watch_signals.every((v) => str(v, 1000))
  ) {
    throw new Error("AI 建议格式无效，请重试。");
  }
  return {
    warning: value.warning,
    recommendations: value.recommendations,
    watch_signals: value.watch_signals,
  };
}
