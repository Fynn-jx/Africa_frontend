import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { booleanPointInPolygon, booleanValid, point, kinks } from '@turf/turf';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try { return nextResolve(`${specifier}.ts`, context); } catch (error) {
        if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
      }
    }
    return nextResolve(specifier, context);
  },
});
const { getCostDistanceImpact, resolveImpactParameters } = await import('../src/utils/costDistanceImpact.ts');
const { tazaraRiskEvents, createReviewImpactZone } = await import('../src/data/reviewDemo.ts');
const { loadTazaraData } = await import('../src/utils/loadTazaraData.ts');
const degreeKm = Math.PI * 6371 / 180;
const coordinate = (x, y = 0) => [x / degreeKm, y / degreeKm];
const event = { id: 'test', type: '社会ESG舆情', location: [0, 0], severity: 'high' };
const polygon = (x1, y1, x2, y2) => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[coordinate(x1, y1), coordinate(x2, y1), coordinate(x2, y2), coordinate(x1, y2), coordinate(x1, y1)]] } });
const collection = (...features) => ({ type: 'FeatureCollection', features });

test('type defaults, overrides, and scenario data use cost half-distances', () => {
  assert.equal(resolveImpactParameters(event).halfDistanceKm, 25);
  assert.equal(resolveImpactParameters({ type: '交通物流' }).halfDistanceKm, 75);
  assert.equal(resolveImpactParameters({ type: '政权政策' }).halfDistanceKm, 200);
  assert.equal(resolveImpactParameters({ type: '军事冲突', halfDistanceKm: 40 }).halfDistanceKm, 40);
  for (const scenario of tazaraRiskEvents) {
    assert.ok(!('impactRadius' in scenario));
    assert.equal(createReviewImpactZone(scenario).halfDistanceKm, scenario.halfDistanceKm);
  }
});

test('formula halves at c_1/2, applies s_e and k_scale, and truncates below 0.1', () => {
  const model = getCostDistanceImpact(event);
  assert.equal(model.impactAt([0, 0]), 1);
  assert.ok(Math.abs(model.impactAt(coordinate(25)) - 0.5) < 1e-6);
  assert.ok(Math.abs(model.impactAt(coordinate(50)) - 0.25) < 1e-6);
  assert.ok(model.impactAt(coordinate(80)) >= 0.1);
  assert.equal(model.impactAt(coordinate(85)), 0);
  const weighted = getCostDistanceImpact({ ...event, strength: 0.8, scaleWeight: 0.5 });
  assert.ok(Math.abs(weighted.impactAt([0, 0]) - 0.4) < 1e-6);
  assert.equal(getCostDistanceImpact({ ...event, strength: 0.05 }).areaKm2, 0);
});

test('a railway produces longer reach along its direction than across it', () => {
  const rails = [{ type: 'zambia', coordinates: [coordinate(-180), coordinate(180)] }];
  const model = getCostDistanceImpact(event, rails);
  assert.ok(model.impactAt(coordinate(120)) >= 0.1);
  assert.equal(model.impactAt(coordinate(0, 120)), 0);
  assert.ok(model.costAt(coordinate(50)) < getCostDistanceImpact(event).costAt(coordinate(50)));
});

test('borders add cost; water and polygon holes block traversal', () => {
  const land = collection(polygon(-200, -200, 12.5, 200), polygon(12.5, -200, 200, 200));
  const model = getCostDistanceImpact(event, [], land);
  assert.equal(model.costAt(coordinate(25)), 50); // 25 land km + 25 border cost km.
  const sea = collection(polygon(-200, -200, 12.5, 200), polygon(22.5, -200, 200, 200));
  assert.equal(getCostDistanceImpact(event, [], sea).impactAt(coordinate(30)), 0);
  const island = polygon(-150, -150, 150, 150);
  island.geometry.coordinates.push(polygon(12.5, -12.5, 27.5, 12.5).geometry.coordinates[0]);
  const withHole = getCostDistanceImpact(event, [], collection(island));
  assert.equal(withHole.impactAt(coordinate(20)), 0);
  assert.ok(withHole.contours.features[0].geometry.coordinates.some(poly => poly.length > 1));
  const enclave = polygon(12.5, -12.5, 27.5, 12.5);
  const enclaveFirst = getCostDistanceImpact(event, [], collection(enclave, island));
  assert.equal(enclaveFirst.costAt(coordinate(20)), 45);
  const enclaveLast = getCostDistanceImpact(event, [], collection(island, enclave));
  assert.equal(enclaveLast.costAt(coordinate(20)), enclaveFirst.costAt(coordinate(20)));
});

test('GeoJSON contours and point hits agree, including nested levels and holes', () => {
  const land = polygon(-150, -150, 150, 150);
  land.geometry.coordinates.push(polygon(12.5, -12.5, 27.5, 12.5).geometry.coordinates[0]);
  const model = getCostDistanceImpact(event, [], collection(land));
  for (const contour of model.contours.features) {
    for (const polygon of contour.geometry.coordinates) {
      for (const ring of polygon) {
        assert.ok(ring.length >= 4);
        assert.deepEqual(ring[0], ring.at(-1));
        assert.ok(ring.every(vertex => vertex.every(Number.isFinite)));
      }
      assert.equal(kinks({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: polygon } }).features.length, 0);
    }
    for (let x = -95; x <= 95; x += 5) for (let y = -95; y <= 95; y += 5) {
      const p = coordinate(x, y);
      assert.equal(booleanPointInPolygon(point(p), contour), model.impactAt(p) >= contour.properties.threshold, `mismatch at ${x},${y} / ${contour.properties.threshold}`);
    }
  }
});

test('cache reuses a model and invalidates changed parameters or spatial inputs', () => {
  const rails = [], countries = collection(polygon(-200, -200, 200, 200));
  const first = getCostDistanceImpact(event, rails, countries);
  assert.equal(getCostDistanceImpact({ ...event }, rails, countries), first);
  assert.notEqual(getCostDistanceImpact({ ...event, severity: 'medium' }, rails, countries), first);
  assert.notEqual(getCostDistanceImpact({ ...event, location: coordinate(5) }, rails, countries), first);
  assert.notEqual(getCostDistanceImpact(event, [...rails], countries), first);
});

test('real GeoJSON loads once and all five scenarios produce non-circular footprints', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async url => {
    requests++;
    return new Response(await readFile(new URL(`../public${url}`, import.meta.url)), { headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const [data, duplicate] = await Promise.all([loadTazaraData(), loadTazaraData()]);
    assert.equal(data, duplicate);
    assert.equal(requests, 4);
    assert.equal(data.railLines.length, 1152);
    const countries = JSON.parse(await readFile(new URL('../public/data/african-countries-only.geojson', import.meta.url), 'utf8'));
    for (const scenario of tazaraRiskEvents) {
      const start = performance.now();
      const model = getCostDistanceImpact(scenario, data.railLines, countries);
      assert.ok(model.areaKm2 > 0);
      assert.ok(model.impactAt(scenario.location) >= 0.5);
      const outer = model.contours.features[0];
      assert.ok(outer.geometry.coordinates.length > 0);
      assert.ok(booleanPointInPolygon(point(scenario.location), outer));
      for (const contour of model.contours.features) {
        if (contour.geometry.coordinates.length) assert.ok(booleanValid(contour), `${scenario.id} / ${contour.properties.threshold}: invalid GeoJSON`);
        for (const coordinates of contour.geometry.coordinates) {
          // Rings may touch at one vertex; each individual ring must be simple.
          for (const ring of coordinates) assert.equal(kinks({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }).features.length, 0);
        }
        for (const station of data.stations.filter((_, index) => index % 8 === 0)) {
          assert.equal(booleanPointInPolygon(point(station.coordinates), contour), model.impactAt(station.coordinates) >= contour.properties.threshold);
        }
      }
      console.log(`${scenario.id}: ${model.areaKm2} km², ${(performance.now() - start).toFixed(0)} ms`);
    }
    const regional = getCostDistanceImpact({ ...tazaraRiskEvents[0], id: 'regional-benchmark', scale: 'regional', halfDistanceKm: 200 }, data.railLines, countries);
    assert.ok(regional.areaKm2 > 0);
    assert.ok(regional.contours.features[0].geometry.coordinates.length > 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
