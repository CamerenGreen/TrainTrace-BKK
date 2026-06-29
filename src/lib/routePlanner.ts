import {
  getStation,
  GRAPH_EDGES,
  LINE_LABELS,
  STATIONS,
  type LineId,
  type Station,
} from "@/data/stations";

export interface RouteSegment {
  line: LineId;
  label: string;
  stations: Station[];
  stops: number;
  fare: number;
  minutes: number;
}

export interface RoutePlan {
  path: Station[];
  segments: RouteSegment[];
  totalFare: number;
  totalMinutes: number;
  transfers: number;
}

const STATION_IDS_BY_NAME = STATIONS.reduce<Map<string, string[]>>(
  (map, station) => {
    const ids = map.get(station.name) ?? [];
    ids.push(station.id);
    map.set(station.name, ids);
    return map;
  },
  new Map(),
);

function btsFare(stops: number): number {
  if (stops <= 4) return 17;
  if (stops <= 6) return 25;
  if (stops <= 8) return 29;
  if (stops <= 10) return 33;
  if (stops <= 14) return 37;
  if (stops <= 17) return 42;
  return 47;
}

function mrtFare(stops: number): number {
  if (stops <= 2) return 16;
  if (stops <= 4) return 19;
  if (stops <= 6) return 22;
  if (stops <= 8) return 26;
  if (stops <= 10) return 30;
  if (stops <= 14) return 35;
  if (stops <= 17) return 40;
  return 42;
}

function fareForLine(line: LineId, stops: number): number {
  if (line === "mrt-blue") return mrtFare(stops);
  return btsFare(stops);
}

function buildSegments(path: Station[]): RouteSegment[] {
  if (path.length < 2) return [];

  const segments: RouteSegment[] = [];
  let currentLine = path[0].line;
  let currentStations: Station[] = [path[0]];
  let currentMinutes = 0;

  for (let i = 1; i < path.length; i += 1) {
    const prev = path[i - 1];
    const next = path[i];
    const edge = GRAPH_EDGES.find(
      (item) => item.from === prev.id && item.to === next.id,
    );
    currentMinutes += edge?.minutes ?? 3;

    if (next.line === currentLine) {
      currentStations.push(next);
      continue;
    }

    const stops = Math.max(currentStations.length - 1, 0);
    segments.push({
      line: currentLine,
      label: LINE_LABELS[currentLine],
      stations: currentStations,
      stops,
      fare: fareForLine(currentLine, stops),
      minutes: currentMinutes,
    });

    currentLine = next.line;
    currentStations = [next];
    currentMinutes = 0;
  }

  const stops = Math.max(currentStations.length - 1, 0);
  segments.push({
    line: currentLine,
    label: LINE_LABELS[currentLine],
    stations: currentStations,
    stops,
    fare: fareForLine(currentLine, stops),
    minutes: currentMinutes,
  });

  return segments;
}

function pathToPlan(pathIds: string[]): RoutePlan | null {
  const path = pathIds
    .map((id) => getStation(id))
    .filter((station): station is Station => Boolean(station));

  if (path.length !== pathIds.length) return null;

  const segments = buildSegments(path);
  const totalFare = segments.reduce((sum, segment) => sum + segment.fare, 0);
  const totalMinutes = segments.reduce((sum, segment) => sum + segment.minutes, 0);

  return {
    path,
    segments,
    totalFare,
    totalMinutes,
    transfers: Math.max(segments.length - 1, 0),
  };
}

function findPaths(fromId: string, toId: string, maxDepth = 24): string[][] {
  const queue: Array<{ node: string; path: string[] }> = [
    { node: fromId, path: [fromId] },
  ];
  const results: string[][] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    if (current.node === toId) {
      results.push(current.path);
      continue;
    }

    if (current.path.length >= maxDepth) continue;

    for (const edge of GRAPH_EDGES) {
      if (edge.from !== current.node) continue;
      if (current.path.includes(edge.to)) continue;
      queue.push({ node: edge.to, path: [...current.path, edge.to] });
    }
  }

  return results;
}

function dedupePlans(plans: RoutePlan[]): RoutePlan[] {
  const seen = new Set<string>();
  return plans.filter((plan) => {
    const key = plan.path.map((station) => station.id).join(">");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function findBestRoutes(
  fromName: string,
  toName: string,
): { best: RoutePlan | null; alternatives: RoutePlan[] } {
  const fromIds = [...new Set(STATION_IDS_BY_NAME.get(fromName) ?? [])];
  const toIds = [...new Set(STATION_IDS_BY_NAME.get(toName) ?? [])];

  if (fromIds.length === 0 || toIds.length === 0 || fromName === toName) {
    return { best: null, alternatives: [] };
  }

  const plans: RoutePlan[] = [];

  for (const fromId of fromIds) {
    for (const toId of toIds) {
      if (fromId === toId) continue;
      for (const path of findPaths(fromId, toId)) {
        const plan = pathToPlan(path);
        if (plan) plans.push(plan);
      }
    }
  }

  const uniquePlans = dedupePlans(plans).sort((a, b) => {
    if (a.totalFare !== b.totalFare) return a.totalFare - b.totalFare;
    if (a.totalMinutes !== b.totalMinutes) return a.totalMinutes - b.totalMinutes;
    return a.transfers - b.transfers;
  });

  return {
    best: uniquePlans[0] ?? null,
    alternatives: uniquePlans.slice(1, 3),
  };
}
