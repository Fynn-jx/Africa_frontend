import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { TazaraData } from "../../../utils/loadTazaraData";
import type { EventComputation } from "../../../utils/eventAnalysis";
import { uniqueStations } from "../../../utils/eventAnalysis";
import { ImpactFootprint, ImpactFootprintLegend } from "./ImpactFootprint";

function EventView({ result }: { result: EventComputation }) {
  const map = useMap();
  const p = result.selectedPlace?.coordinates;
  useEffect(() => {
    if (p) map.setView([p[1], p[0]], 8, { animate: false });
  }, [map, p]);
  return null;
}
export default function EventAnalysisMap({
  result,
  data,
}: {
  result: EventComputation;
  data: TazaraData;
}) {
  const p = result.selectedPlace?.coordinates;
  const hits = new Set(result.stationHits.map((hit) => hit.name));
  return (
    <div className="space-y-3">
      <div
        className="relative h-[400px] overflow-hidden rounded-xl border border-slate-200"
        aria-label="事件影响范围地图"
      >
        <MapContainer
          center={p ? [p[1], p[0]] : [-10, 34]}
          zoom={p ? 8 : 5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <EventView result={result} />
          {data.railLines.map((line, index) => (
            <Polyline
              key={index}
              positions={line.coordinates.map((point) => [point[1], point[0]])}
              pathOptions={{ color: "#005BBB", weight: 2, opacity: 0.6 }}
            />
          ))}
          {result.model && <ImpactFootprint model={result.model} fitView />}
          {uniqueStations(data.stations).map((station, index) => (
            <CircleMarker
              key={index}
              center={[station.coordinates[1], station.coordinates[0]]}
              radius={hits.has(station.name) ? 5 : 2.5}
              pathOptions={{
                color: hits.has(station.name) ? "#DC2626" : "#64748B",
                fillOpacity: 0.9,
                weight: 1,
              }}
            >
              <Popup>
                {station.name} ·{" "}
                {hits.has(station.name) ? "达到影响阈值" : "未达影响阈值"}
              </Popup>
            </CircleMarker>
          ))}
          {result.assetHits.map((hit, index) => (
            <CircleMarker
              key={`asset-${index}`}
              center={[hit.coordinates[1], hit.coordinates[0]]}
              radius={6}
              pathOptions={{ color: "#7C3AED", fillOpacity: 0.9 }}
            >
              <Popup>
                {hit.name} · 物流目录示意坐标 · R={hit.impact.toFixed(3)}
              </Popup>
            </CircleMarker>
          ))}
          {p && (
            <CircleMarker
              center={[p[1], p[0]]}
              radius={9}
              pathOptions={{
                color: "#9A3412",
                fillColor: "#F97316",
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup>
                事件点：{result.selectedPlace?.name}
                <br />
                {result.selectedPlace?.source}
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-600">
        橙色：事件点 · 蓝线：TAZARA 铁路 · 红色：命中站点 / 影响足迹 ·
        紫色：命中物流资产
      </p>
      {result.model ? (
        <ImpactFootprintLegend model={result.model} />
      ) : (
        <p className="text-sm text-slate-500">
          {result.isRiskEvent
            ? "缺少可用地点，未生成影响足迹。"
            : "非风险事件：仅显示已解析位置及铁路，不生成影响足迹。"}
        </p>
      )}
    </div>
  );
}
