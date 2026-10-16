import type { Feature, FeatureCollection, MultiPolygon, Position } from 'geojson';
import type { TazaraRailLine } from './loadTazaraData';

export type ImpactScale = 'local' | 'corridor' | 'regional';
export type Coordinate = readonly [number, number]; // GeoJSON order: longitude, latitude.
export interface ImpactEvent {
  id?: string;
  type: string;
  location: Coordinate;
  severity?: string;
  scale?: ImpactScale;
  halfDistanceKm?: number;
  strength?: number;
  scaleWeight?: number;
}

export const IMPACT_THRESHOLDS = [0.1, 0.25, 0.5] as const;
export const IMPACT_CUTOFF = 0.1;
export const GRID_KM = 5;
// Demonstration assumptions, not calibrated transport or loss estimates.
export const IMPACT_RESISTANCE = { land: 1, rail: 0.45, railBufferKm: 7.5, borderCostKm: 25 } as const;
const HALF_DISTANCE: Record<ImpactScale, number> = { local: 25, corridor: 75, regional: 200 };
const STRENGTH: Record<string, number> = { critical: 1, high: 1, medium: 0.75, low: 0.5 };
const KM_PER_DEGREE = Math.PI * 6371 / 180;

export function resolveImpactParameters(event: Pick<ImpactEvent, 'type' | 'severity' | 'scale' | 'halfDistanceKm' | 'strength' | 'scaleWeight'>) {
  const scale = event.scale ?? (
    /社会|ESG|社区|protest/i.test(event.type) ? 'local'
      : /供应链|能源|贸易|绿色|交通|物流|铁路|disaster/i.test(event.type) ? 'corridor' : 'regional'
  );
  const halfDistanceKm = event.halfDistanceKm ?? HALF_DISTANCE[scale];
  const strength = event.strength ?? STRENGTH[event.severity ?? 'high'] ?? 1;
  const scaleWeight = event.scaleWeight ?? 1;
  if (!Number.isFinite(halfDistanceKm) || halfDistanceKm <= 0 || halfDistanceKm > 200) {
    throw new RangeError('halfDistanceKm must be greater than 0 and at most 200 cost-km');
  }
  if (![strength, scaleWeight].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) {
    throw new RangeError('Impact strength and scale weight must be between 0 and 1');
  }
  return { scale, halfDistanceKm, lambdaKm: halfDistanceKm / Math.LN2, strength, scaleWeight, amplitude: strength * scaleWeight };
}

export type ImpactParameters = ReturnType<typeof resolveImpactParameters>;

// Existing scenario assets have distances, not surveyed coordinates. Keep their
// illustrative placement deterministic and use it for both drawing and hits.
export function scenarioAssetCoordinate(origin: Coordinate, distanceKm: number, index: number, count: number, angleOffset = 0): [number, number] {
  const angle = index * Math.PI * 2 / Math.max(1, count) + angleOffset;
  return [origin[0] + Math.cos(angle) * distanceKm / (KM_PER_DEGREE * Math.cos(origin[1] * Math.PI / 180)),
    origin[1] + Math.sin(angle) * distanceKm / KM_PER_DEGREE];
}

export type ImpactContour = Feature<MultiPolygon, { threshold: number }>;
export interface CostDistanceImpact {
  key: string;
  parameters: ImpactParameters;
  contours: FeatureCollection<MultiPolygon, { threshold: number }>;
  areaKm2: number;
  cellCount: number;
  impactAt: (coordinate: Coordinate) => number;
  costAt: (coordinate: Coordinate) => number;
}

class MinHeap {
  private entries: [number, number][] = [];
  get size() { return this.entries.length; }
  push(id: number, cost: number) {
    const entry: [number, number] = [id, cost];
    let index = this.entries.length;
    this.entries.push(entry);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.entries[parent][1] <= cost) break;
      this.entries[index] = this.entries[parent];
      index = parent;
    }
    this.entries[index] = entry;
  }
  pop() {
    const first = this.entries[0];
    const last = this.entries.pop()!;
    if (this.entries.length) {
      let index = 0;
      while (index * 2 + 1 < this.entries.length) {
        let child = index * 2 + 1;
        if (child + 1 < this.entries.length && this.entries[child + 1][1] < this.entries[child][1]) child++;
        if (this.entries[child][1] >= last[1]) break;
        this.entries[index] = this.entries[child];
        index = child;
      }
      this.entries[index] = last;
    }
    return first;
  }
}

function signedArea(ring: Position[]) {
  let area = 0;
  for (let i = 1; i < ring.length; i++) area += ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1];
  return area / 2;
}

function inRing(point: Position, ring: Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

// Trace the union of threshold cells. Shared edges disappear; holes and islands
// remain valid GeoJSON rings. This avoids drawing one Leaflet object per cell.
function polygonize(values: Float32Array, size: number, threshold: number, toCoordinate: (x: number, y: number) => Position): ImpactContour {
  const stride = size + 1;
  const edges = new Map<number, number[]>();
  const add = (x1: number, y1: number, x2: number, y2: number) => {
    const start = y1 * stride + x1, end = y2 * stride + x2;
    const targets = edges.get(start);
    if (targets) targets.push(end); else edges.set(start, [end]);
  };
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < size && y < size && values[y * size + x] >= threshold;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!inside(x, y)) continue;
    if (!inside(x, y - 1)) add(x, y, x + 1, y);
    if (!inside(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!inside(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!inside(x - 1, y)) add(x, y + 1, x, y);
  }
  const rings: Position[][] = [];
  while (edges.size) {
    const start = edges.keys().next().value!;
    const vertices = [start];
    let previous = -1, current = start;
    do {
      const targets = edges.get(current)!;
      let nextIndex = 0;
      // At diagonally touching cells, turn left to keep rings separate.
      if (targets.length > 1 && previous >= 0) {
        const dx = current % stride - previous % stride;
        const dy = Math.floor(current / stride) - Math.floor(previous / stride);
        nextIndex = targets.findIndex(target => dx * (Math.floor(target / stride) - Math.floor(current / stride)) - dy * (target % stride - current % stride) > 0);
        if (nextIndex < 0) nextIndex = 0;
      }
      const next = targets.splice(nextIndex, 1)[0];
      if (!targets.length) edges.delete(current);
      previous = current;
      current = next;
      vertices.push(current);
    } while (current !== start);
    // A hole can touch the exterior at one grid vertex. Split that walk into
    // simple rings instead of emitting a self-touching figure-eight ring.
    const path: number[] = [];
    const seen = new Map<number, number>();
    const loops: number[][] = [];
    for (const vertex of vertices) {
      const repeated = seen.get(vertex);
      if (repeated === undefined) {
        seen.set(vertex, path.length); path.push(vertex);
      } else {
        loops.push([...path.slice(repeated), vertex]);
        for (const removed of path.slice(repeated + 1)) seen.delete(removed);
        path.length = repeated + 1;
      }
    }
    for (const loop of loops) {
      const ring: Position[] = [];
      for (let i = 0; i < loop.length - 1; i++) {
        const prev = loop[(i + loop.length - 2) % (loop.length - 1)];
        const at = loop[i], next = loop[i + 1];
        const x = at % stride, y = Math.floor(at / stride);
        if ((x - prev % stride) * (Math.floor(next / stride) - y) !== (y - Math.floor(prev / stride)) * (next % stride - x)) ring.push(toCoordinate(x, y));
      }
      if (ring.length >= 3) rings.push([...ring, ring[0]]);
    }
  }
  const polygons = rings.filter(ring => signedArea(ring) > 0).map(ring => [ring]);
  for (const hole of rings.filter(ring => signedArea(ring) < 0)) {
    const outer = polygons.find(polygon => inRing(hole[0], polygon[0]));
    if (outer) outer.push(hole);
  }
  return { type: 'Feature', properties: { threshold }, geometry: { type: 'MultiPolygon', coordinates: polygons } };
}

const EMPTY_RAILS: TazaraRailLine[] = [];
const NO_COUNTRIES: FeatureCollection = { type: 'FeatureCollection', features: [] };
const cache = new WeakMap<TazaraRailLine[], WeakMap<FeatureCollection, Map<string, CostDistanceImpact>>>();
let modelVersion = 0;

export function getCostDistanceImpact(event: ImpactEvent, railLines = EMPTY_RAILS, countries = NO_COUNTRIES): CostDistanceImpact {
  const parameters = resolveImpactParameters(event);
  if (!event.location.every(Number.isFinite) || Math.abs(event.location[1]) > 85 || Math.abs(event.location[0]) > 180) throw new RangeError('Invalid event coordinate');
  const cacheKey = JSON.stringify([event.id, event.location, parameters]);
  let byCountries = cache.get(railLines);
  if (!byCountries) { byCountries = new WeakMap(); cache.set(railLines, byCountries); }
  let models = byCountries.get(countries);
  if (!models) { models = new Map(); byCountries.set(countries, models); }
  const cached = models.get(cacheKey);
  if (cached) {
    models.delete(cacheKey); models.set(cacheKey, cached);
    return cached;
  }

  const maxCost = parameters.amplitude >= IMPACT_CUTOFF ? parameters.lambdaKm * Math.log(parameters.amplitude / IMPACT_CUTOFF) : 0;
  // Even the cheapest possible path cannot reach outside this finite window.
  const half = Math.ceil(maxCost / IMPACT_RESISTANCE.rail / GRID_KM) + 2;
  const size = half * 2 + 1;
  const count = size * size;
  const longitudeKm = KM_PER_DEGREE * Math.cos(event.location[1] * Math.PI / 180);
  const project = (coordinate: Position | Coordinate): [number, number] => [(coordinate[0] - event.location[0]) * longitudeKm, (coordinate[1] - event.location[1]) * KM_PER_DEGREE];
  const unproject = (x: number, y: number): Position => [event.location[0] + x / longitudeKm, event.location[1] + y / KM_PER_DEGREE];
  const countryIds = new Uint16Array(count);

  // Scanline rasterization is linear in edges + filled cells, instead of doing
  // point-in-polygon against all country vertices for every grid point.
  const fillPolygon = (rings: Position[][], id: number) => {
    const rows: number[][] = Array.from({ length: size }, () => []);
    // Rasterize outer + holes together with the even-odd rule. Clearing holes
    // afterward could erase an enclave country rasterized earlier.
    for (const ring of rings) for (let i = 1; i < ring.length; i++) {
      const a = project(ring[i - 1]), b = project(ring[i]);
      const bottom = Math.max(0, Math.ceil(Math.min(a[1], b[1]) / GRID_KM + half));
      const top = Math.min(size - 1, Math.ceil(Math.max(a[1], b[1]) / GRID_KM + half) - 1);
      for (let row = bottom; row <= top; row++) rows[row].push(a[0] + ((row - half) * GRID_KM - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    rows.forEach((intersections, row) => {
      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2) {
        const start = Math.max(0, Math.ceil(intersections[i] / GRID_KM + half));
        const end = Math.min(size - 1, Math.ceil(intersections[i + 1] / GRID_KM + half) - 1);
        if (end >= start) countryIds.fill(id, row * size + start, row * size + end + 1);
      }
    });
  };
  countries.features.forEach((feature, index) => {
    const geometry = feature.geometry;
    const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
    polygons.forEach(polygon => fillPolygon(polygon, index + 1));
  });
  const resistance = new Float32Array(count);
  for (let i = 0; i < count; i++) resistance[i] = !countries.features.length || countryIds[i] ? IMPACT_RESISTANCE.land : Infinity;

  const windowKm = (half + 1) * GRID_KM;
  for (const line of railLines) for (let i = 1; i < line.coordinates.length; i++) {
    const a = project(line.coordinates[i - 1]), b = project(line.coordinates[i]);
    if (Math.min(a[0], b[0]) > windowKm || Math.max(a[0], b[0]) < -windowKm || Math.min(a[1], b[1]) > windowKm || Math.max(a[1], b[1]) < -windowKm) continue;
    const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (GRID_KM / 2)));
    for (let step = 0; step <= steps; step++) {
      const x = a[0] + (b[0] - a[0]) * step / steps, y = a[1] + (b[1] - a[1]) * step / steps;
      const col = Math.round(x / GRID_KM) + half, row = Math.round(y / GRID_KM) + half;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const cx = col + dx, cy = row + dy;
        if (cx < 0 || cy < 0 || cx >= size || cy >= size) continue;
        const id = cy * size + cx;
        if (Number.isFinite(resistance[id]) && Math.hypot((cx - half) * GRID_KM - x, (cy - half) * GRID_KM - y) <= IMPACT_RESISTANCE.railBufferKm) resistance[id] = IMPACT_RESISTANCE.rail;
      }
    }
  }

  const costs = new Float64Array(count).fill(Infinity);
  const values = new Float32Array(count);
  const origin = half * size + half;
  // A coastal source may fall in a water cell at 5 km resolution. Connect only
  // this cell to adjacent land, rather than making the sea traversable.
  if (!Number.isFinite(resistance[origin])) resistance[origin] = IMPACT_RESISTANCE.land;
  const heap = new MinHeap();
  costs[origin] = 0;
  heap.push(origin, 0);
  let cellCount = 0;
  while (heap.size) {
    const [id, cost] = heap.pop();
    if (cost !== costs[id] || cost > maxCost) continue;
    const impact = parameters.amplitude * Math.exp(-cost / parameters.lambdaKm);
    values[id] = impact;
    if (impact >= IMPACT_CUTOFF) cellCount++;
    const x = id % size, y = Math.floor(id / size);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dy) || x + dx < 0 || y + dy < 0 || x + dx >= size || y + dy >= size) continue;
      const next = id + dy * size + dx;
      if (!Number.isFinite(resistance[next])) continue;
      if (dx && dy && (!Number.isFinite(resistance[id + dx]) || !Number.isFinite(resistance[id + dy * size]))) continue;
      const border = countryIds[id] && countryIds[next] && countryIds[id] !== countryIds[next] ? IMPACT_RESISTANCE.borderCostKm : 0;
      const nextCost = cost + GRID_KM * (dx && dy ? Math.SQRT2 : 1) * (resistance[id] + resistance[next]) / 2 + border;
      if (nextCost <= maxCost && nextCost < costs[next]) { costs[next] = nextCost; heap.push(next, nextCost); }
    }
  }
  const indexAt = (coordinate: Coordinate) => {
    if (!coordinate.every(Number.isFinite)) return -1;
    const [x, y] = project(coordinate);
    const col = Math.floor(x / GRID_KM + half + 0.5), row = Math.floor(y / GRID_KM + half + 0.5);
    return col >= 0 && row >= 0 && col < size && row < size ? row * size + col : -1;
  };
  const result: CostDistanceImpact = {
    key: `impact-${++modelVersion}`,
    parameters,
    contours: { type: 'FeatureCollection', features: IMPACT_THRESHOLDS.map(threshold => polygonize(values, size, threshold, (x, y) => unproject((x - half - 0.5) * GRID_KM, (y - half - 0.5) * GRID_KM))) },
    areaKm2: cellCount * GRID_KM * GRID_KM,
    cellCount,
    impactAt: coordinate => { const id = indexAt(coordinate); return id < 0 ? 0 : values[id]; },
    costAt: coordinate => { const id = indexAt(coordinate); return id < 0 ? Infinity : costs[id]; },
  };
  models.set(cacheKey, result);
  if (models.size > 12) models.delete(models.keys().next().value!);
  return result;
}
