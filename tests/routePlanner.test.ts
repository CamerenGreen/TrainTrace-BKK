import test from "node:test";
import assert from "node:assert/strict";
import {
  ADJACENCY,
  getStation,
  STATIONS,
  GRAPH_EDGES,
  LINE_IDS,
} from "../src/data/stations.ts";
import {
  bangkokTime,
  estimateFare,
  findBestRoutes,
  serviceNotice,
} from "../src/lib/routePlanner.ts";

test("all operating lines are complete, uniquely identified and connected", () => {
  assert.equal(STATIONS.length, 173);
  assert.equal(new Set(STATIONS.map((s) => s.id)).size, 173);
  assert.deepEqual(
    LINE_IDS.map((line) => STATIONS.filter((s) => s.line === line).length),
    [47, 14, 3, 38, 16, 23, 32],
  );
  assert.ok(!getStation("bts-sukhumvit:N6"));
  assert.ok(
    !STATIONS.some((s) => s.line === "mrt-blue" && s.name === "Phaya Thai"),
  );
  const seen = new Set<string>();
  const queue = [STATIONS[0].id];
  while (queue.length) {
    const id = queue.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...ADJACENCY.get(id)!.map((e) => e.to));
  }
  assert.equal(seen.size, 173);
  for (const e of GRAPH_EDGES) {
    assert.ok(getStation(e.from) && getStation(e.to));
    assert.ok(
      GRAPH_EDGES.some(
        (r) => r.from === e.to && r.to === e.from && r.minutes === e.minutes,
      ),
    );
  }
});
test("full-length BTS trip has 46 stops, no arbitrary depth limit", () => {
  const p = findBestRoutes("bts-sukhumvit:N24", "bts-sukhumvit:E23").best!;
  assert.equal(p.stops, 46);
  assert.equal(p.transfers, 0);
  assert.equal(p.path.length, 47);
  assert.equal(p.fares.length, 1);
  assert.equal(p.totalFare, 62);
});
test("Siam is in the right Silom order and changing there shares a BTS fare", () => {
  const p = findBestRoutes("bts-silom:W1", "bts-sukhumvit:E4").best!;
  assert.deepEqual(
    p.path.slice(0, 3).map((s) => s.code),
    ["W1", "CEN", "CEN"],
  );
  assert.equal(p.stops, 5);
  assert.equal(p.transfers, 1);
  assert.equal(p.fares.length, 1);
  assert.equal(p.totalFare, estimateFare("bts-sukhumvit", 5, p.path));
});
test("walking between interchange platforms never charges a zero-stop ticket", () => {
  const p = findBestRoutes("bts-sukhumvit:E4", "mrt-blue:BL22").best!;
  assert.equal(p.totalFare, 0);
  assert.equal(p.stops, 0);
  assert.equal(p.totalMinutes, 6);
  assert.equal(p.fares.length, 0);
  assert.equal(p.waitMinutes, 0);
});
test("Blue loop includes Tha Phra before its westbound tail", () => {
  const p = findBestRoutes("mrt-blue:BL32", "mrt-blue:BL34").best!;
  assert.deepEqual(
    p.path.map((s) => s.code),
    ["BL32", "BL01", "BL33", "BL34"],
  );
  assert.equal(p.transfers, 0);
});
test("Tha Phra platform change is counted but does not add another fare", () => {
  const p = findBestRoutes("mrt-blue:BL02", "mrt-blue:BL32").best!;
  assert.equal(p.transfers, 1);
  assert.equal(p.stops, 2);
  assert.equal(p.fares.length, 1);
  assert.equal(p.walkMinutes, 3);
  assert.equal(p.waitMinutes, 7);
});
test("Pink branch is a branch with a platform change and continuous fare", () => {
  const p = findBestRoutes("mrt-pink:PK09", "mrt-pink:MT02").best!;
  assert.deepEqual(
    p.path.map((s) => s.code),
    ["PK09", "PK10", "MT01", "MT02"],
  );
  assert.equal(p.transfers, 1);
  assert.equal(p.fares.length, 1);
  assert.equal(
    findBestRoutes("mrt-pink:MT01", "mrt-pink:MT02").best!.transfers,
    0,
  );
});
test("invalid and identical endpoints return no trip", () => {
  for (const pair of [
    ["bad", "mrt-blue:BL01"],
    ["", ""],
    ["mrt-blue:BL01", "mrt-blue:BL01"],
  ])
    assert.equal(findBestRoutes(...(pair as [string, string])).best, null);
});
test("representative trips across all lines remain contiguous and correctly ranked", () => {
  const endpoints = LINE_IDS.flatMap((line) => {
    const list = STATIONS.filter((s) => s.line === line);
    return [list[0].id, list.at(-1)!.id];
  });
  for (const a of endpoints)
    for (const b of endpoints) {
      if (a === b) continue;
      const fastest = findBestRoutes(a, b, "fastest").best!;
      const cheapest = findBestRoutes(a, b, "cheapest").best!;
      const transfers = findBestRoutes(a, b, "transfers").best!;
      assert.ok(fastest && cheapest && transfers);
      assert.ok(cheapest.totalFare <= fastest.totalFare);
      assert.ok(fastest.totalMinutes <= cheapest.totalMinutes);
      assert.ok(transfers.transfers <= fastest.transfers);
      assert.equal(
        fastest.totalMinutes,
        Math.ceil(
          fastest.rideMinutes + fastest.walkMinutes + fastest.waitMinutes,
        ),
      );
      assert.equal(
        fastest.totalFare,
        fastest.fares.reduce((sum, f) => sum + f.amount, 0),
      );
      assert.equal(
        new Set(fastest.path.map((s) => s.id)).size,
        fastest.path.length,
      );
      for (let i = 1; i < fastest.path.length; i++)
        assert.ok(
          ADJACENCY.get(fastest.path[i - 1].id)!.some(
            (e) => e.to === fastest.path[i].id,
          ),
        );
    }
});
test("Bangkok time and overnight notices do not use the device timezone", () => {
  assert.equal(bangkokTime(new Date("2026-09-17T00:00:00Z")), "07:00");
  assert.ok(
    serviceNotice(new Date("2026-09-16T18:00:00Z"), 20)?.includes("Outside"),
  );
  assert.ok(
    serviceNotice(new Date("2026-09-17T16:50:00Z"), 30)?.includes("beyond"),
  );
  assert.equal(serviceNotice(new Date("2026-09-17T00:00:00Z"), 30), null);
});
