import { useEffect } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { CostDistanceImpact } from '../../../utils/costDistanceImpact';

export function ImpactFootprint({ model, color = '#DC2626', fitView = false }: { model: CostDistanceImpact; color?: string; fitView?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!fitView) return;
    const bounds = L.geoJSON(model.contours).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9, animate: false });
  }, [map, model, fitView]);
  return <>{model.contours.features.map(feature => (
    <GeoJSON key={`${model.key}-${feature.properties.threshold}`} data={feature} interactive={false}
      style={{ color, fillColor: color, weight: feature.properties.threshold === 0.5 ? 2 : 1, fillOpacity: 0.08, opacity: 0.7 }} />
  ))}</>;
}

export function ImpactFootprintLegend({ model, error }: { model: CostDistanceImpact | null; error?: string | null }) {
  if (error) return <p className="text-xs text-red-600">影响足迹数据加载失败，请刷新重试。</p>;
  if (!model) return <p className="text-xs text-gray-500">正在加载影响足迹所需的铁路与边界数据…</p>;
  return <div className="space-y-1 text-xs leading-5 text-gray-600">
    <p>成本半衰距离：{model.parameters.halfDistanceKm} km · 足迹约 {model.areaKm2.toLocaleString()} km²</p>
    <p>影响强度 ≥ 0.1 / 0.25 / 0.5，颜色由浅至深；资产命中阈值 ≥ 0.1。</p>
    <p className="text-gray-500">演示参数：铁路阻力 0.45、陆地 1、跨境增加 25 成本公里；水域不可通行。5 km 网格估算，空间暴露不代表实际损失。</p>
  </div>;
}
