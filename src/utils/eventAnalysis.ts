import type { FeatureCollection } from "geojson";
import {
  getCostDistanceImpact,
  resolveImpactParameters,
  IMPACT_CUTOFF,
  type Coordinate,
  type CostDistanceImpact,
} from "./costDistanceImpact";
import type { TazaraData, TazaraStation } from "./loadTazaraData";
import {
  EVENT_TAGS,
  type EventTag,
  type EventExtraction,
  type ExtractedPlace,
} from "../data/eventAnalysisSchema";
import { logisticsAssets } from "../data/logisticsAssets";

export const SIGNAL_WEIGHTS = { E: 0.4, S: 0.3, V: 0.3 } as const;
export const WARNING_THRESHOLDS = {
  high: 0.5,
  caution: 0.25,
  attention: 0.1,
} as const;
export const CONFIDENCE_THRESHOLD = 0.6;
export const TAG_WEIGHTS: Record<EventTag, number> = Object.fromEntries(
  EVENT_TAGS.map((tag) => [tag, 1]),
) as Record<EventTag, number>;
export const WARNING_LEVELS = ["无预警", "关注", "警惕", "高危"] as const;
export type WarningLevel = (typeof WARNING_LEVELS)[number];
export const PROJECTS = [{ id: "tazara", name: "坦赞铁路 TAZARA" }] as const;
export const HISTORY_NOTICE = "需历史序列，暂不可计算";
export const GAZETTEER = [
  {
    name: "达累斯萨拉姆",
    aliases: ["Dar es Salaam", "Dar-es-Salaam"],
    coordinates: [39.2450325, -6.8464084],
    country: "坦桑尼亚",
  },
  {
    name: "姆贝亚",
    aliases: ["Mbeya"],
    coordinates: [33.4118653, -8.9321091],
    country: "坦桑尼亚",
  },
  {
    name: "通杜马",
    aliases: ["Tunduma"],
    coordinates: [32.7677559, -9.3183324],
    country: "坦桑尼亚",
  },
  {
    name: "纳孔德",
    aliases: ["Nakonde"],
    coordinates: [32.7578947, -9.3094307],
    country: "赞比亚",
  },
  {
    name: "卡萨马",
    aliases: ["Kasama"],
    coordinates: [31.2067054, -10.2434633],
    country: "赞比亚",
  },
  {
    name: "姆皮卡",
    aliases: ["Mpika"],
    coordinates: [31.3908452, -11.8476271],
    country: "赞比亚",
  },
  {
    name: "塞伦杰",
    aliases: ["Serenje"],
    coordinates: [30.2160665, -13.2334954],
    country: "赞比亚",
  },
  {
    name: "卡皮里姆波希",
    aliases: ["Kapiri Mposhi", "New Kapiri Mposhi"],
    coordinates: [28.6811822, -13.9549148],
    country: "赞比亚",
  },
  {
    name: "姆林巴",
    aliases: ["Mlimba"],
    coordinates: [35.8021373, -8.7827487],
    country: "坦桑尼亚",
  },
  {
    name: "马坎巴科",
    aliases: ["Makambako"],
    coordinates: [34.8236609, -8.8405983],
    country: "坦桑尼亚",
  },
  {
    name: "卢萨卡",
    aliases: ["Lusaka"],
    coordinates: [28.3228, -15.3875],
    country: "赞比亚",
  },
] as const;
export type PlaceSource =
  "站点库" | "城市库" | "LLM 坐标·低置信" | "人工坐标" | "unresolved";
export interface ResolvedPlace {
  originalName: string;
  name: string;
  country: string;
  source: PlaceSource;
  coordinates: Coordinate | null;
}
const normalize = (name: string) =>
  name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‐‑–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
function matches(query: string, name: string) {
  const q = normalize(query),
    n = normalize(name);
  if (!q || !n) return false;
  if (q === n) return true;
  if (/[^\x00-\x7F]/.test(n)) return q.includes(n);
  const at = q.indexOf(n);
  return (
    at >= 0 &&
    (at === 0 || !/[a-z0-9]/.test(q[at - 1])) &&
    (at + n.length === q.length || !/[a-z0-9]/.test(q[at + n.length]))
  );
}
export function validCoordinate(
  coordinate: readonly number[],
): coordinate is Coordinate {
  return (
    coordinate.length === 2 &&
    coordinate.every(Number.isFinite) &&
    Math.abs(coordinate[0]) <= 180 &&
    Math.abs(coordinate[1]) <= 85
  );
}
export function resolvePlace(
  place: ExtractedPlace,
  stations: TazaraStation[],
): ResolvedPlace {
  const city = GAZETTEER.find((city) =>
    [city.name, ...city.aliases].some((name) => matches(place.name, name)),
  );
  const station = stations.find(
    (station) =>
      matches(place.name, station.name) ||
      (city &&
        city.aliases.some(
          (alias) => normalize(alias) === normalize(station.name),
        )),
  );
  if (station)
    return {
      originalName: place.name,
      name: station.name,
      country:
        city?.country ?? (station.type === "tanzania" ? "坦桑尼亚" : "赞比亚"),
      source: "站点库",
      coordinates: station.coordinates,
    };
  if (city)
    return {
      originalName: place.name,
      name: city.name,
      country: city.country,
      source: "城市库",
      coordinates: city.coordinates,
    };
  if (
    place.lon !== null &&
    place.lat !== null &&
    validCoordinate([place.lon, place.lat])
  ) {
    return {
      originalName: place.name,
      name: place.name,
      country: place.country,
      source: "LLM 坐标·低置信",
      coordinates: [place.lon, place.lat],
    };
  }
  return {
    originalName: place.name,
    name: place.name,
    country: place.country,
    source: "unresolved",
    coordinates: null,
  };
}
export function uniqueStations(stations: TazaraStation[]) {
  return stations.filter(
    (station, i) =>
      stations.findIndex(
        (other) =>
          normalize(other.name) === normalize(station.name) &&
          other.coordinates.every(
            (value, index) => value === station.coordinates[index],
          ),
      ) === i,
  );
}
export function calculateSignalStrength(signals: EventExtraction["signals"]) {
  return (
    SIGNAL_WEIGHTS.E * signals.E.strength +
    SIGNAL_WEIGHTS.S * signals.S.strength +
    SIGNAL_WEIGHTS.V * signals.V.strength
  );
}
export function getWarningLevel(L: number, confirmation = false): WarningLevel {
  const level =
    L >= WARNING_THRESHOLDS.high
      ? 3
      : L >= WARNING_THRESHOLDS.caution
        ? 2
        : L >= WARNING_THRESHOLDS.attention
          ? 1
          : 0;
  return WARNING_LEVELS[Math.min(3, level + (confirmation ? 1 : 0))];
}
export interface ManualCorrection {
  primaryTag: EventTag;
  place: ResolvedPlace | null;
  isRiskEvent: boolean;
}
export function getReviewReasons(
  extraction: EventExtraction,
  places: ResolvedPlace[],
) {
  const reasons: string[] = [];
  if (extraction.confidence < CONFIDENCE_THRESHOLD)
    reasons.push(
      `AI 置信度 ${extraction.confidence.toFixed(2)} 低于 ${CONFIDENCE_THRESHOLD}`,
    );
  if (!extraction.is_risk_event)
    reasons.push("当前判定为非风险事件，不生成影响足迹");
  if (!places.length || places.some((place) => !place.coordinates))
    reasons.push("存在无法解析的地点（unresolved），需补充明确地点");
  if (places.some((place) => place.source === "LLM 坐标·低置信"))
    reasons.push("地点仅有 LLM 坐标，尚未获得地点库核实");
  if (places.filter((place) => place.coordinates).length > 1)
    reasons.push("存在多个地点；本次仅计算首个可解析地点，其余地点需另行研判");
  return reasons;
}
export interface AnalysisHit {
  name: string;
  coordinates: Coordinate;
  impact: number;
  costKm: number;
  source: string;
}
export interface EventComputation {
  extraction: EventExtraction;
  primaryTag: EventTag;
  isRiskEvent: boolean;
  places: ResolvedPlace[];
  selectedPlace: ResolvedPlace | null;
  manual: ManualCorrection | null;
  reviewReasons: string[];
  originalReviewReasons: string[];
  signalStrength: number;
  categoryWeight: number;
  parameters: ReturnType<typeof resolveImpactParameters>;
  model: CostDistanceImpact | null;
  stationHits: AnalysisHit[];
  assetHits: AnalysisHit[];
  maximumStation: AnalysisHit | null;
  maximumSpatialImpact: number | null;
  L: number | null;
  baseLevel: WarningLevel | null;
  warningLevel: WarningLevel | null;
}
export function computeEventAnalysis(
  extraction: EventExtraction,
  data: TazaraData,
  countries: FeatureCollection,
  manual: ManualCorrection | null = null,
): EventComputation {
  const places = extraction.places.map((place) =>
    resolvePlace(place, data.stations),
  );
  const primaryTag = manual?.primaryTag ?? extraction.primary_tag;
  const isRiskEvent = manual?.isRiskEvent ?? extraction.is_risk_event;
  const selectedPlace = manual ? manual.place : places.find((place) => place.coordinates) ?? null;
  if (
    manual && ((manual.isRiskEvent && !manual.place?.coordinates) || (manual.place?.coordinates && !validCoordinate(manual.place.coordinates)))
  )
    throw new Error("人工坐标无效：经度须在 ±180、纬度须在 ±85 范围内。");
  const signalStrength = calculateSignalStrength(extraction.signals),
    categoryWeight = TAG_WEIGHTS[primaryTag];
  const parameters = resolveImpactParameters({
    type: primaryTag,
    strength: signalStrength,
    scaleWeight: categoryWeight,
  });
  const result: EventComputation = {
    extraction,
    primaryTag,
    isRiskEvent,
    places,
    selectedPlace,
    manual,
    originalReviewReasons: getReviewReasons(extraction, places),
    reviewReasons: getReviewReasons({ ...extraction, is_risk_event: isRiskEvent }, manual ? selectedPlace ? [selectedPlace] : [] : places),
    signalStrength,
    categoryWeight,
    parameters,
    model: null,
    stationHits: [],
    assetHits: [],
    maximumStation: null,
    maximumSpatialImpact: null,
    L: null,
    baseLevel: null,
    warningLevel: null,
  };
  if (!isRiskEvent || !selectedPlace?.coordinates) return result;
  if (
    !data.stations.length ||
    !data.railLines.length ||
    !countries.features.length
  )
    throw new Error("铁路、站点或国家边界数据不完整，无法计算。");
  const input = { type: primaryTag, location: selectedPlace.coordinates };
  // Unit spatial field defines L=max_g impact_unit(g) × s_e × k_tau.
  // The amplitude-weighted field supplies the actual R>=0.1 contours and hits.
  const unitModel = getCostDistanceImpact(
    { ...input, strength: 1, scaleWeight: 1 },
    data.railLines,
    countries,
  );
  const model = getCostDistanceImpact(
    { ...input, strength: signalStrength, scaleWeight: categoryWeight },
    data.railLines,
    countries,
  );
  const stations = uniqueStations(data.stations);
  const spatial = stations.map((station) => ({
    name: station.name,
    coordinates: station.coordinates,
    impact: unitModel.impactAt(station.coordinates),
    costKm: unitModel.costAt(station.coordinates),
    source: "TAZARA 站点 GeoJSON",
  }));
  const maximumStation = spatial.reduce((best, hit) =>
    hit.impact > best.impact ? hit : best,
  );
  const L = Math.min(
    1,
    Math.max(0, maximumStation.impact * signalStrength * categoryWeight),
  );
  const stationHits = stations
    .map((station) => ({
      name: station.name,
      coordinates: station.coordinates,
      impact: model.impactAt(station.coordinates),
      costKm: model.costAt(station.coordinates),
      source: "TAZARA 站点 GeoJSON",
    }))
    .filter((hit) => hit.impact >= IMPACT_CUTOFF)
    .sort((a, b) => b.impact - a.impact);
  const assetHits = logisticsAssets
    .map((asset) => ({
      name: asset.name,
      coordinates: asset.coordinates as [number, number],
      impact: model.impactAt(asset.coordinates as [number, number]),
      costKm: model.costAt(asset.coordinates as [number, number]),
      source: "既有物流目录·静态示意坐标",
    }))
    .filter((hit) => hit.impact >= IMPACT_CUTOFF)
    .sort((a, b) => b.impact - a.impact);
  return {
    ...result,
    model,
    stationHits,
    assetHits,
    maximumStation,
    maximumSpatialImpact: maximumStation.impact,
    L,
    baseLevel: getWarningLevel(L),
    warningLevel: getWarningLevel(L, extraction.confirmation),
  };
}
export function buildAdviceInput(result: EventComputation) {
  if (result.L === null || !result.model)
    throw new Error("尚无可用计算结果，不能生成建议。");
  return {
    projectId: "tazara",
    projectName: "坦赞铁路 TAZARA",
    primary_tag: result.primaryTag,
    secondary_tags: result.extraction.secondary_tags,
    summary: result.extraction.summary,
    confidence: result.extraction.confidence,
    evidence: result.extraction.signals,
    confirmation: result.extraction.confirmation,
    location: result.selectedPlace,
    scope: "单事件、首个可解析地点；铁路站点所处网格为项目代理",
    L: result.L,
    base_level: result.baseLevel,
    warning_level: result.warningLevel,
    areaKm2: result.model.areaKm2,
    station_hits: result.stationHits,
    asset_hits: result.assetHits,
    parameters: {
      ...result.parameters,
      signalWeights: SIGNAL_WEIGHTS,
      warningThresholds: WARNING_THRESHOLDS,
    },
    manual_correction: result.manual,
    review_reasons: result.reviewReasons,
    original_review_reasons: result.originalReviewReasons,
    M: HISTORY_NOTICE,
    limitations:
      "起步等权，待逻辑回归校准；静态空间暴露不代表已发生损失。原文为示例时结果同为示例。",
  };
}
