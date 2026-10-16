import type { FeatureCollection } from 'geojson';

export interface TazaraStation {
  name: string;
  coordinates: [number, number];
  type: 'tanzania' | 'zambia';
  sequence?: number;
}

export interface TazaraRailLine {
  coordinates: [number, number][];
  type: 'tanzania' | 'zambia';
}

export interface TazaraData {
  railLines: TazaraRailLine[];
  stations: TazaraStation[];
}

let dataPromise: Promise<TazaraData> | undefined;

// Both maps share actual GeoJSON lines and stable references for model caching.
// Failed requests can be retried on the next mount.
export function loadTazaraData(): Promise<TazaraData> {
  if (!dataPromise) {
    dataPromise = (async () => {
      const parts = await Promise.all((['tanzania', 'zambia'] as const).map(async type => {
        const read = async (kind: string): Promise<FeatureCollection> => {
          const response = await fetch(`/tazara-data/${type}_${kind}.geojson`);
          if (!response.ok) throw new Error(`Rail data request failed: ${response.status} (${type}/${kind})`);
          return response.json();
        };
        const [rails, stationData] = await Promise.all([read('rail'), read('stations')]);
        const railLines: TazaraRailLine[] = rails.features.flatMap(feature => {
          const geometry = feature.geometry;
          const lines = geometry?.type === 'LineString' ? [geometry.coordinates]
            : geometry?.type === 'MultiLineString' ? geometry.coordinates : [];
          return lines.filter(line => line.length >= 2).map(coordinates => ({
            type, coordinates: coordinates.map(point => [point[0], point[1]] as [number, number]),
          }));
        });
        const stations: TazaraStation[] = stationData.features.flatMap(feature => feature.geometry?.type === 'Point' ? [{
          type,
          name: String(feature.properties?.name || feature.properties?.Name || '未命名站点'),
          coordinates: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] as [number, number],
        }] : []);
        stations.sort((a, b) => b.coordinates[0] - a.coordinates[0]);
        stations.forEach((station, index) => { station.sequence = index + 1; });
        return { railLines, stations };
      }));
      return { railLines: parts.flatMap(part => part.railLines), stations: parts.flatMap(part => part.stations) };
    })().catch(error => { dataPromise = undefined; throw error; });
  }
  return dataPromise;
}
