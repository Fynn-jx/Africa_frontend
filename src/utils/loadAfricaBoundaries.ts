import type { FeatureCollection } from 'geojson';

let boundariesPromise: Promise<FeatureCollection> | undefined;

export function loadAfricaBoundaries(): Promise<FeatureCollection> {
  if (!boundariesPromise) {
    boundariesPromise = fetch('/data/african-countries-only.geojson').then(async response => {
      if (!response.ok) throw new Error(`国家边界加载失败：${response.status}`);
      return response.json() as Promise<FeatureCollection>;
    }).catch(error => { boundariesPromise = undefined; throw error; });
  }
  return boundariesPromise;
}
