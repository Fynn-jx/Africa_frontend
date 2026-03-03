import { useState, useEffect } from 'react';
import { GeoJSON, Popup, CircleMarker } from '../components/MapboxMap';
import { FeatureCollection, Feature } from 'geojson';
import L from 'leaflet';

interface CountryData {
  id: string;
  name: string;
  code: string;
  flag: string;
  score: number;
  trend: number;
  hasData: boolean;
  lat: number;
  lng: number;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
}

interface EventPoint {
  id: string;
  country: string;
  location: [number, number];
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  date: string;
}

interface HeatmapLayerProps {
  countries: CountryData[];
  events?: EventPoint[];
  onCountryClick?: (country: CountryData) => void;
  onEventClick?: (event: EventPoint) => void;
  selectedCountry?: CountryData | null;
  showHeatmap?: boolean;
  showEvents?: boolean;
}

export default function HeatmapLayer({
  countries,
  events = [],
  onCountryClick,
  onEventClick,
  selectedCountry,
  showHeatmap = true,
  showEvents = true,
}: HeatmapLayerProps) {
  const [africaGeoJSON, setAfricaGeoJSON] = useState<FeatureCollection | null>(null);

  // 加载非洲国家边界数据
  useEffect(() => {
    fetch('/data/african-countries-only.geojson')
      .then(res => res.json())
      .then(data => setAfricaGeoJSON(data))
      .catch(err => console.error('加载非洲国家边界数据失败:', err));
  }, []);

  const countryMap = new Map(countries.map(c => [c.code || c.id, c]));

  const getCountryStyle = (feature: any) => {
    const props = feature.properties || {};
    const countryCode = props['ISO3166-1-Alpha-2'] || props.iso_a2 || props.ISO_A2;
    const country = countryMap.get(countryCode);

    if (!country || !country.hasData || !showHeatmap) {
      return {
        color: '#D1D5DB',
        weight: 1,
        fillColor: '#F3F4F6',
        fillOpacity: 0.3,
      };
    }

    const isSelected = selectedCountry?.id === country.id;

    let fillColor = '#F3F4F6';
    if (country.riskLevel === 'low') {
      fillColor = '#DBEAFE';
    } else if (country.riskLevel === 'medium') {
      fillColor = '#FEF3C7';
    } else if (country.riskLevel === 'high') {
      fillColor = '#FEE2E2';
    }

    return {
      color: isSelected ? '#005BBB' : '#9CA3AF',
      weight: isSelected ? 3 : 1.5,
      fillColor: fillColor,
      fillOpacity: 0.6,
    };
  };

  const onEachCountry = (feature: any, layer: any) => {
    const props = feature.properties || {};
    const countryCode = props['ISO3166-1-Alpha-2'] || props.iso_a2 || props.ISO_A2;
    const country = countryMap.get(countryCode);
    const countryName = props.name || props.NAME || props.admin || '未知国家';

    // 给所有国家添加悬浮和点击事件
    layer.on({
      click: () => {
        if (country) {
          onCountryClick?.(country);
        } else {
          // 没有数据的国家也可以点击，显示提示
          onCountryClick?.({
            id: countryCode,
            name: countryName,
            code: countryCode,
            flag: '🏳️',
            score: 0,
            trend: 0,
            hasData: false,
            lat: 0,
            lng: 0,
            riskLevel: 'unknown',
          } as any);
        }
      },
      mouseover: (e: any) => {
        const target = e.target;
        const isSelected = selectedCountry?.id === country?.id;

        // 悬浮时高亮边框
        target.setStyle({
          weight: 3,
          color: '#005BBB',
          fillOpacity: country?.hasData ? 0.8 : 0.5,
        });

        // 不把国家图层带到最前，避免覆盖事件点

        // 绑定 tooltip
        layer.bindTooltip(
          `<div style="
            padding: 6px 10px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            pointer-events: none;
          ">
            ${countryName}
            ${country ? `<span style="opacity: 0.8; font-size: 11px; margin-left: 6px;">(${country.score}分)</span>` : '<span style="opacity: 0.6; font-size: 11px; margin-left: 6px;">(无数据)</span>'}
          </div>`,
          {
            permanent: false,
            direction: 'top',
            offset: [0, -8],
            className: 'country-tooltip',
          }
        );
      },
      mouseout: (e: any) => {
        const target = e.target;
        const isSelected = selectedCountry?.id === country?.id;
        const hasData = country?.hasData || false;
        const style = getCountryStyle(feature);

        layer.setStyle({
          weight: isSelected ? 3 : style.weight,
          color: isSelected ? '#005BBB' : style.color,
          fillOpacity: hasData ? 0.6 : 0.3,
        });

        // 移除 tooltip
        layer.unbindTooltip();
      },
    });
  };

  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getEventRadius = (severity: string) => {
    switch (severity) {
      case 'critical': return 12;
      case 'high': return 10;
      case 'medium': return 8;
      case 'low': return 6;
      default: return 6;
    }
  };

  if (!africaGeoJSON) {
    return <div className="text-xs text-gray-500">加载地图数据中...</div>;
  }

  return (
    <>
      {showHeatmap && (
        <GeoJSON
          data={africaGeoJSON}
          style={getCountryStyle}
          onEachFeature={onEachCountry}
        />
      )}

      {showEvents && events.map((event) => (
        <CircleMarker
          key={event.id}
          center={event.location}
          radius={getEventRadius(event.severity)}
          pathOptions={{
            color: '#FFFFFF',
            weight: 2,
            fillColor: getEventColor(event.severity),
            fillOpacity: 0.9,
          }}
          eventHandlers={{
            add: (e: any) => {
              // 确保事件点始终在最上层
              e.target.bringToFront();
            },
            click: () => onEventClick?.(event),
          }}
        >
          <Popup>
            <div className="p-3 min-w-[220px]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">{event.title}</div>
                  <div className="text-xs text-gray-500">{event.country}</div>
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                  event.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  event.severity === 'high' ? 'bg-red-50 text-red-600' :
                  event.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {event.severity === 'critical' ? '严重' :
                   event.severity === 'high' ? '高' :
                   event.severity === 'medium' ? '中' : '低'}
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2">{event.description}</p>
              <div className="text-xs text-gray-400">{event.date}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
