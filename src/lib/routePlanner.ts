import {
  ADJACENCY,
  getStation,
  LINES,
  type LineId,
  type Station,
} from "../data/stations.ts";

export type RoutePreference = "fastest" | "cheapest" | "transfers";
export interface RideSegment {
  kind: "ride";
  line: LineId;
  stations: Station[];
  stops: number;
  minutes: number;
  waitMinutes: number;
}
export interface WalkSegment {
  kind: "transfer";
  from: Station;
  to: Station;
  minutes: number;
  sameLine: boolean;
}
export type RouteSegment = RideSegment | WalkSegment;
export interface FareItem {
  label: string;
  amount: number;
}
export interface RoutePlan {
  id: string;
  path: Station[];
  segments: RouteSegment[];
  fares: FareItem[];
  totalFare: number;
  totalMinutes: number;
  rideMinutes: number;
  walkMinutes: number;
  waitMinutes: number;
  transfers: number;
  stops: number;
}
const isGreen = (line: LineId) =>
  line === "bts-sukhumvit" || line === "bts-silom";

/** Planning estimates, not an operator fare matrix. See docs/DATA.md. */
export function estimateFare(
  line: LineId,
  stops: number,
  stations: Station[] = [],
): number {
  if (!stops) return 0;
  if (isGreen(line)) {
    const allNorth =
      stations.length > 0 &&
      stations.every(
        (s) =>
          s.line === "bts-sukhumvit" &&
          /^N\d+$/.test(s.code) &&
          Number(s.code.slice(1)) >= 8,
      );
    const allEast =
      stations.length > 0 &&
      stations.every(
        (s) =>
          s.line === "bts-sukhumvit" &&
          /^E\d+$/.test(s.code) &&
          Number(s.code.slice(1)) >= 14,
      );
    if (allNorth || allEast) return 15;
    const extension = stations.some(
      (s) =>
        (s.line === "bts-sukhumvit" &&
          ((s.code.startsWith("N") && Number(s.code.slice(1)) > 8) ||
            (s.code.startsWith("E") && Number(s.code.slice(1)) > 14))) ||
        (s.line === "bts-silom" && Number(s.code.slice(1)) > 8),
    );
    return Math.min(
      62,
      [0, 17, 25, 28, 32, 35, 40, 43, 47][Math.min(stops, 8)] +
        (extension ? 15 : 0),
    );
  }
  if (line === "bts-gold") return 16;
  if (line === "mrt-blue")
    return [0, 17, 20, 23, 25, 28, 30, 33, 35, 38, 40, 43, 44][
      Math.min(stops, 12)
    ];
  if (line === "mrt-purple") return Math.min(42, 14 + stops * 2);
  return Math.min(45, 15 + stops * 3);
}
function needsPlatformChange(prev: Station, at: Station, next: Station) {
  if (at.id === "mrt-blue:BL01") return [prev.code, next.code].includes("BL02");
  if (at.id === "mrt-pink:PK10") return [prev.code, next.code].includes("MT01");
  return false;
}
function makePlan(path: Station[]): RoutePlan {
  const segments: RouteSegment[] = [];
  let ride: RideSegment | undefined;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1],
      next = path[i];
    const edge = ADJACENCY.get(prev.id)!.find((e) => e.to === next.id)!;
    if (edge.line === "transfer") {
      segments.push({
        kind: "transfer",
        from: prev,
        to: next,
        minutes: edge.minutes,
        sameLine: false,
      });
      ride = undefined;
      continue;
    }
    if (i > 1 && needsPlatformChange(path[i - 2], prev, next)) {
      segments.push({
        kind: "transfer",
        from: prev,
        to: prev,
        minutes: 3,
        sameLine: true,
      });
      ride = undefined;
    }
    if (!ride) {
      ride = {
        kind: "ride",
        line: edge.line,
        stations: [prev],
        stops: 0,
        minutes: 0,
        waitMinutes: LINES[edge.line].headway / 2,
      };
      segments.push(ride);
    }
    ride.stations.push(next);
    ride.stops++;
    ride.minutes += edge.minutes;
  }
  // Ticket groups survive paid-area platform changes and the BTS Siam interchange.
  const fares: FareItem[] = [];
  let group: { line: LineId; stations: Station[]; stops: number } | undefined;
  const flush = () => {
    if (group)
      fares.push({
        label: isGreen(group.line) ? "BTS Green lines" : LINES[group.line].name,
        amount: estimateFare(group.line, group.stops, group.stations),
      });
    group = undefined;
  };
  for (const segment of segments) {
    if (segment.kind === "transfer") {
      if (
        !segment.sameLine &&
        !(isGreen(segment.from.line) && isGreen(segment.to.line))
      )
        flush();
    } else {
      if (!group) group = { line: segment.line, stops: 0, stations: [] };
      group.stops += segment.stops;
      group.stations.push(...segment.stations);
    }
  }
  flush();
  const rides = segments.filter((s): s is RideSegment => s.kind === "ride");
  const rideMinutes = rides.reduce((sum, s) => sum + s.minutes, 0);
  const walkMinutes = segments.reduce(
    (sum, s) => sum + (s.kind === "transfer" ? s.minutes : 0),
    0,
  );
  const waitMinutes = rides.reduce((sum, s) => sum + s.waitMinutes, 0);
  return {
    id: path.map((s) => s.id).join(">"),
    path,
    segments,
    fares,
    totalFare: fares.reduce((sum, f) => sum + f.amount, 0),
    totalMinutes: Math.ceil(rideMinutes + walkMinutes + waitMinutes),
    rideMinutes,
    walkMinutes,
    waitMinutes,
    transfers: Math.max(0, rides.length - 1),
    stops: rides.reduce((sum, s) => sum + s.stops, 0),
  };
}

// This small network has seven independent cycles. Enumerating simple paths gives
// exact preference ordering under our fare model, including non-additive tickets.
// Depth-first traversal avoids the old breadth-first queue and 24-station cutoff.
const pathCache = new Map<string, RoutePlan[]>();
function allPlans(fromId: string, toId: string): RoutePlan[] {
  const key = `${fromId}>${toId}`;
  const cached = pathCache.get(key);
  if (cached) return cached;
  if (!getStation(fromId) || !getStation(toId) || fromId === toId) return [];
  const result: RoutePlan[] = [],
    path: Station[] = [getStation(fromId)!],
    seen = new Set([fromId]);
  const visit = (id: string) => {
    if (id === toId) {
      result.push(makePlan([...path]));
      return;
    }
    for (const edge of ADJACENCY.get(id) ?? []) {
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);
      path.push(getStation(edge.to)!);
      visit(edge.to);
      path.pop();
      seen.delete(edge.to);
    }
  };
  visit(fromId);
  if (pathCache.size >= 40) pathCache.delete(pathCache.keys().next().value!);
  pathCache.set(key, result);
  return result;
}
export function findBestRoutes(
  fromId: string,
  toId: string,
  preference: RoutePreference = "fastest",
): { best: RoutePlan | null; alternatives: RoutePlan[] } {
  const plans = [...allPlans(fromId, toId)].sort((a, b) => {
    if (preference === "cheapest")
      return (
        a.totalFare - b.totalFare ||
        a.totalMinutes - b.totalMinutes ||
        a.transfers - b.transfers
      );
    if (preference === "transfers")
      return (
        a.transfers - b.transfers ||
        a.totalMinutes - b.totalMinutes ||
        a.totalFare - b.totalFare
      );
    return (
      a.totalMinutes - b.totalMinutes ||
      a.totalFare - b.totalFare ||
      a.transfers - b.transfers
    );
  });
  const best = plans[0] ?? null;
  // Hide alternatives that are worse on every dimension.
  const alternatives = plans
    .slice(1)
    .filter(
      (p) =>
        best &&
        (p.totalFare < best.totalFare ||
          p.totalMinutes < best.totalMinutes ||
          p.transfers < best.transfers),
    )
    .slice(0, 2);
  return { best, alternatives };
}
export function bangkokTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
export function serviceNotice(now: Date, minutes: number) {
  const [hour, minute] = bangkokTime(now).split(":").map(Number);
  if (hour < 6)
    return "Outside the usual 06:00–00:00 service window. This is a planning estimate for the next service, not a train departure.";
  if (hour * 60 + minute + minutes >= 24 * 60)
    return "This trip may extend beyond service hours. Check the operator’s last train before travelling.";
  return null;
}
