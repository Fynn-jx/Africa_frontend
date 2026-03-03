import { ReactNode, useMemo } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  Polyline,
  Circle,
  CircleMarker,
  Popup,
  useMap,
  GeoJSON,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapboxMapProps {
  center?: [number, number];
  zoom?: number;
  style?: string;
  children?: ReactNode;
  onLoad?: () => void;
}

// 非洲大陆边界 [南纬, 西经, 北纬, 东经]
// 扩大范围：纬度 -40° 到 42°（上下各加5度），经度 -20° 到 52°
const AFRICA_BOUNDS: [[number, number], [number, number]] = [
  [-40, -20], // 南西
  [42, 52]   // 北东
];

// 地图视图控制器
function MapViewController({ center, zoom, onLoad }: { center: [number, number]; zoom: number; onLoad?: () => void }) {
  const map = useMap();

  useMemo(() => {
    map.setView([center[1], center[0]], zoom);

    // 设置地图边界，限制只能在非洲大陆范围
    map.setMaxBounds(AFRICA_BOUNDS);
    map.setMinZoom(3); // 最小缩放，确保能看到整个非洲
    map.setMaxZoom(10); // 最大缩放，防止过度放大

    onLoad?.();
  }, [center, zoom, map, onLoad]);

  return null;
}

export default function MapboxMap({
  center = [20, 0],
  zoom = 4,
  style,
  children,
  onLoad,
}: MapboxMapProps) {
  // Leaflet 使用 [lat, lng] 格式，Mapbox 使用 [lng, lat]
  const leafletCenter: [number, number] = [center[1], center[0]];

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={leafletCenter}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
        maxBounds={AFRICA_BOUNDS}
        maxBoundsViscosity={1.0} // 完全限制在边界内
        minZoom={3}
        maxZoom={10}
      >
        {/* CartoDB 浅色底图 - 与区域深度洞察保持一致 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* 视图控制器 */}
        <MapViewController center={center} zoom={zoom} onLoad={onLoad} />

        {/* 渲染子组件 */}
        {children}
      </MapContainer>
    </div>
  );
}

// 导出兼容的组件接口

// 简化的 Source 组件（用于 GeoJSON 数据，Leaflet 不直接支持，返回 null）
export interface SourceProps {
  id: string;
  type: string;
  data: any;
  children?: ReactNode;
}

export function Source({ id, type, data, children }: SourceProps) {
  // 将 GeoJSON 数据传递给子组件（通过 context 或其他方式）
  // 这里简化处理，直接返回 children
  return <>{children}</>;
}

// 简化的 Layer 组件（Mapbox 特有，Leaflet 不需要）
export interface LayerProps {
  id: string;
  type: string;
  paint?: any;
  children?: ReactNode;
}

export function Layer({ children }: LayerProps) {
  return <>{children}</>;
}

// 导出 Leaflet 组件供页面使用
export { Marker, Polyline, Circle, CircleMarker, Popup, GeoJSON };

// 导出类型
export type { MarkerProps } from 'react-leaflet';