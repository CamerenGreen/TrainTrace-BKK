import { useRef, useState } from "react";
import { Focus, Minus, Plus, RotateCcw, X, ArrowUpRight } from "lucide-react";
import {
  GRAPH_EDGES,
  getStation,
  INTERCHANGES,
  LINE_IDS,
  LINES,
  STATIONS,
  type LineId,
  type Station,
} from "../../data/stations";
import type { RoutePlan } from "../../lib/routePlanner";
const fullView = { x: -130, y: -30, w: 2220, h: 1540 };
const position = (s: Station) => ({ x: s.x * 1.1, y: s.y * 0.7 });
const edges = GRAPH_EDGES.filter((e) => e.from < e.to);
const hubs = new Set([
  ...INTERCHANGES.flatMap(([a, b]) => [a, b]),
  "mrt-blue:BL01",
  "mrt-pink:PK10",
]);
const terminals = new Set(
  STATIONS.filter(
    (s) =>
      GRAPH_EDGES.filter((e) => e.from === s.id && e.line !== "transfer")
        .length === 1,
  ).map((s) => s.id),
);
export function NetworkMap({
  plan,
  from,
  to,
  onFrom,
  onTo,
}: {
  plan: RoutePlan | null;
  from: string;
  to: string;
  onFrom: (id: string) => void;
  onTo: (id: string) => void;
}) {
  const [view, setView] = useState(fullView),
    [filter, setFilter] = useState<LineId | null>(null),
    [selected, setSelected] = useState<Station | null>(null);
  const svg = useRef<SVGSVGElement>(null),
    drag = useRef<{
      x: number;
      y: number;
      view: typeof fullView;
      moved: boolean;
    } | null>(null);
  const pathIds = new Set(plan?.path.map((s) => s.id) ?? []);
  const pathEdges = new Set(
    plan?.path
      .slice(1)
      .map((s, i) => [plan.path[i].id, s.id].sort().join("|")) ?? [],
  );
  const zoom = fullView.w / view.w;
  const zoomBy = (factor: number) =>
    setView((v) => {
      const w = Math.max(420, Math.min(fullView.w, v.w / factor)),
        h = (w * fullView.h) / fullView.w;
      return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
    });
  const fitRoute = () => {
    if (!plan) return;
    setFilter(null);
    const points = plan.path.map(position),
      xs = points.map((s) => s.x),
      ys = points.map((s) => s.y);
    const w = Math.max(
      500,
      Math.max(...xs) - Math.min(...xs) + 320,
      ((Math.max(...ys) - Math.min(...ys) + 200) * fullView.w) / fullView.h,
    );
    const h = (w * fullView.h) / fullView.w;
    setView({
      x: (Math.max(...xs) + Math.min(...xs) - w) / 2,
      y: (Math.max(...ys) + Math.min(...ys) - h) / 2,
      w,
      h,
    });
  };
  return (
    <section className="map-card" aria-label="Interactive Bangkok rail map">
      <div className="map-heading">
        <div>
          <h2>Rail map</h2>
        </div>
        <span className="schematic-tag">Not to scale</span>
      </div>
      <div className="map-filters" aria-label="Highlight a line">
        <button
          className={!filter ? "active" : ""}
          onClick={() => setFilter(null)}
        >
          All lines
        </button>
        {LINE_IDS.map((line) => (
          <button
            className={filter === line ? "active" : ""}
            key={line}
            onClick={() => setFilter(filter === line ? null : line)}
            aria-pressed={filter === line}
          >
            <i style={{ background: LINES[line].color }} />
            {LINES[line].short}
          </button>
        ))}
      </div>
      <div className="map-viewport">
        <svg
          ref={svg}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          aria-label="All operating BTS and MRT stations. Select a station to plan a route."
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current,
              rect = svg.current?.getBoundingClientRect();
            if (!d || !rect) return;
            const dx = e.clientX - d.x,
              dy = e.clientY - d.y;
            if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
            if (d.moved) {
              const scale = Math.max(
                d.view.w / rect.width,
                d.view.h / rect.height,
              );
              setView({
                ...d.view,
                x: d.view.x - dx * scale,
                y: d.view.y - dy * scale,
              });
            }
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            if (d && !d.moved) {
              const target = (
                document.elementFromPoint(
                  e.clientX,
                  e.clientY,
                ) as Element | null
              )?.closest("[data-station]");
              if (target)
                setSelected(getStation(target.getAttribute("data-station")!)!);
            }
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <defs>
            <pattern
              id="map-dots"
              width="35"
              height="35"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1.1" fill="#d7dfd9" />
            </pattern>
          </defs>
          <rect
            x="-5000"
            y="-5000"
            width="10000"
            height="10000"
            fill="url(#map-dots)"
          />
          <path
            d="M 230 -100 C 350 190 290 360 300 430 S 670 730 590 900 S 570 1080 900 1190 S 1010 1380 1160 1700"
            fill="none"
            stroke="#e3eef0"
            strokeWidth="40"
          />
          <text
            x="520"
            y="1240"
            fill="#91abb1"
            fontSize="19"
            transform="rotate(25 520 1240)"
          >
            CHAO PHRAYA RIVER
          </text>
          <text x="135" y="95" className="district-label">
            NONTHABURI
          </text>
          <text x="805" y="620" className="district-label">
            BANGKOK
          </text>
          <text x="1630" y="1360" className="district-label">
            SAMUT PRAKAN
          </text>
          {edges.map((e) => {
            const a = position(getStation(e.from)!),
              b = position(getStation(e.to)!);
            const onRoute = pathEdges.has([e.from, e.to].sort().join("|"));
            const dim = filter
              ? e.line !== filter && e.line !== "transfer"
              : plan
                ? !onRoute
                : false;
            return (
              <line
                key={`${e.from}-${e.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={e.line === "transfer" ? "#526860" : LINES[e.line].color}
                strokeWidth={e.line === "transfer" ? 4 : onRoute ? 11 : 7}
                strokeLinecap="round"
                strokeDasharray={e.line === "transfer" ? "5 5" : undefined}
                opacity={dim ? 0.14 : 1}
              />
            );
          })}
          {STATIONS.map((s) => {
            const p = position(s),
              isEndpoint = s.id === from || s.id === to,
              important = hubs.has(s.id) || terminals.has(s.id) || isEndpoint;
            const dim = filter
              ? s.line !== filter
              : plan
                ? !pathIds.has(s.id)
                : false;
            const showLabel = important || zoom > 1.5;
            const left =
              (s.line === "mrt-blue" && Number(s.code.slice(2)) <= 14) ||
              s.line === "mrt-purple" ||
              s.line === "bts-silom";
            const horizontal =
              (s.line === "mrt-purple" &&
                Number(s.code.slice(2)) >= 4 &&
                Number(s.code.slice(2)) <= 10) ||
              (s.line === "mrt-blue" &&
                ((Number(s.code.slice(2)) >= 27 &&
                  Number(s.code.slice(2)) <= 32) ||
                  ["BL11", "BL12"].includes(s.code))) ||
              (s.line === "bts-silom" &&
                ["S8", "S9", "S10", "S11"].includes(s.code)) ||
              (s.line === "mrt-pink" &&
                s.code.startsWith("PK") &&
                Number(s.code.slice(2)) >= 6 &&
                Number(s.code.slice(2)) <= 25) ||
              (s.line === "mrt-yellow" && Number(s.code.slice(2)) <= 8) ||
              (s.line === "bts-sukhumvit" && /^E[1-4]$/.test(s.code));
            return (
              <g
                key={s.id}
                data-station={s.id}
                role="button"
                tabIndex={0}
                aria-label={`${s.name}, ${s.code}, ${LINES[s.line].name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(s);
                  }
                }}
                className="map-station"
                opacity={dim ? 0.26 : 1}
              >
                <title>
                  {s.name} · {s.code} · {LINES[s.line].name}
                </title>
                <circle cx={p.x} cy={p.y} r={17} fill="transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={important ? 7 : 4.5}
                  fill={isEndpoint ? "#173f36" : "white"}
                  stroke={
                    isEndpoint || hubs.has(s.id)
                      ? "#24463b"
                      : LINES[s.line].color
                  }
                  strokeWidth={important ? 3 : 2}
                />
                {isEndpoint && (
                  <g>
                    <circle cx={p.x} cy={p.y - 24} r="16" fill="#173f36" />
                    <text
                      x={p.x}
                      y={p.y - 18}
                      textAnchor="middle"
                      fill="white"
                      fontSize="18"
                      fontWeight="700"
                    >
                      {s.id === from ? "A" : "B"}
                    </text>
                  </g>
                )}
                {showLabel && (
                  <text
                    className="station-label"
                    x={p.x + (horizontal ? 5 : left ? -13 : 13)}
                    y={p.y + (horizontal ? -18 : 6)}
                    textAnchor={horizontal ? "start" : left ? "end" : "start"}
                    transform={
                      horizontal
                        ? `rotate(-48 ${p.x + 5} ${p.y - 18})`
                        : undefined
                    }
                    fontSize={important ? 20 : 17}
                    fontWeight={important ? 650 : 450}
                  >
                    {s.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="map-instruction">
          <span className="instruction-dot" />
          Select a station
          <span> · Drag to move · Zoom for names</span>
        </div>
        <div className="map-controls">
          <button
            onClick={() => zoomBy(1.4)}
            aria-label="Zoom in"
            disabled={view.w <= 420}
          >
            <Plus size={19} />
          </button>
          <button
            onClick={() => zoomBy(1 / 1.4)}
            aria-label="Zoom out"
            disabled={view.w >= fullView.w}
          >
            <Minus size={19} />
          </button>
          <span />
          <button
            onClick={() => setView(fullView)}
            aria-label="Show entire network"
          >
            <RotateCcw size={17} />
          </button>
          <button
            onClick={fitRoute}
            disabled={!plan}
            aria-label="Fit selected route"
          >
            <Focus size={19} />
          </button>
        </div>
        {selected && (
          <div className="station-popover">
            <button
              className="popover-close"
              aria-label="Close station details"
              onClick={() => setSelected(null)}
            >
              <X size={16} />
            </button>
            <span
              className="eyebrow"
              style={{ color: LINES[selected.line].color }}
            >
              {selected.code} · {LINES[selected.line].name}
            </span>
            <h3>{selected.name}</h3>
            <div>
              <button
                onClick={() => {
                  onFrom(selected.id);
                  setSelected(null);
                }}
              >
                Start here <ArrowUpRight size={15} />
              </button>
              <button
                onClick={() => {
                  onTo(selected.id);
                  setSelected(null);
                }}
              >
                Go here <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
      <footer className="map-footer">
        <span>
          <i className="interchange-icon" />
          Change lines
        </span>
        <span>7 lines</span>
      </footer>
    </section>
  );
}
