import { tazaraRiskEvents, type TazaraRiskEvent } from './tazaraRiskEvents';

export { tazaraRiskEvents, getTazaraRiskEvent, type TazaraRiskEvent } from './tazaraRiskEvents';
export const reviewDemoEvent = tazaraRiskEvents[0];
export const reviewDemoPeriod = { start: "2026-02-01", end: "2026-02-28" };

export function createReviewImpactZone(event: TazaraRiskEvent = reviewDemoEvent) {
  return {
    type: event.type,
    location: `${event.country} · ${event.locationLabel}`,
    coordinates: { lat: event.location[1], lng: event.location[0] },
    scale: event.scale,
    halfDistanceKm: event.halfDistanceKm,
    affectedPopulation: event.affectedPopulation,
    criticalInfrastructure: [
      { type: "铁路节点", name: event.affectedSegment, distance: 0, impactPath: event.impactPath.slice(0, 2) },
    ],
    chineseAssets: event.assets.map((asset, index) => ({
      ...asset, impactPath: event.impactPath.slice(Math.min(index, 2), Math.min(index, 2) + 2),
    })),
    impactPath: event.impactPath,
    responseMeasures: event.responseMeasures,
  };
}
