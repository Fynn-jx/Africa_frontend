import { ReactNode, useEffect } from 'react';
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

// 修复 Leaflet 默认图标在 Vite 打包环境中的资源路径问题。
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  style?: string;
  children?: ReactNode;
  onLoad?: () => void;
  minZoom?: number;
  maxZoom?: number;
  tileUrl?: string | null;
  tileAttribution?: string;
  overlayTileUrl?: string | null;
  overlayTileAttribution?: string;
  overlayTileOpacity?: number;
  showTileLayer?: boolean;
  maxBounds?: [[number, number], [number, number]];
}

// 非洲大陆边界 [南纬, 西经] 到 [北纬, 东经]。
const AFRICA_BOUNDS: [[number, number], [number, number]] = [
  [-40, -20],
  [42, 52],
];

function MapViewController({
  center,
  zoom,
  onLoad,
  minZoom,
  maxZoom,
  maxBounds,
}: {
  center: [number, number];
  zoom: number;
  onLoad?: () => void;
  minZoom: number;
  maxZoom: number;
  maxBounds: [[number, number], [number, number]];
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([center[1], center[0]], zoom);
    map.setMaxBounds(maxBounds);
    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);
    onLoad?.();
  }, [center, zoom, map, maxBounds, maxZoom, minZoom, onLoad]);

  return null;
}

export default function LeafletMap({
  center = [20, 0],
  zoom = 4,
  children,
  onLoad,
  minZoom = 3,
  maxZoom = 10,
  tileUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  overlayTileUrl,
  overlayTileAttribution = "",
  overlayTileOpacity = 0.75,
  showTileLayer = true,
  maxBounds = AFRICA_BOUNDS,
}: LeafletMapProps) {
  // 业务层统一使用 [lng, lat]，Leaflet 渲染层转换为 [lat, lng]。
  const leafletCenter: [number, number] = [center[1], center[0]];

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={leafletCenter}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
        maxBounds={maxBounds}
        maxBoundsViscosity={1.0}
        minZoom={minZoom}
        maxZoom={maxZoom}
      >
        {showTileLayer && tileUrl && (
          <TileLayer
            attribution={tileAttribution}
            url={tileUrl}
          />
        )}
        {showTileLayer && overlayTileUrl && (
          <TileLayer
            attribution={overlayTileAttribution}
            opacity={overlayTileOpacity}
            url={overlayTileUrl}
          />
        )}

        <MapViewController center={center} zoom={zoom} minZoom={minZoom} maxZoom={maxZoom} maxBounds={maxBounds} onLoad={onLoad} />
        {children}
      </MapContainer>
    </div>
  );
}

// 兼容旧的 Source/Layer 调用形态；Leaflet 页面通常直接渲染 GeoJSON/Marker/Circle 等组件。
export interface SourceProps {
  id: string;
  type: string;
  data: any;
  children?: ReactNode;
}

export function Source({ children }: SourceProps) {
  return <>{children}</>;
}

export interface LayerProps {
  id: string;
  type: string;
  paint?: any;
  children?: ReactNode;
}

export function Layer({ children }: LayerProps) {
  return <>{children}</>;
}

export { Marker, Polyline, Circle, CircleMarker, Popup, GeoJSON };
export type { MarkerProps } from 'react-leaflet';
