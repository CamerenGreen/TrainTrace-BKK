import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Info,
  Route,
  TrainFront,
  Wallet,
  X,
} from "lucide-react";
import { getStation, LINES } from "../../data/stations";
import {
  bangkokTime,
  findBestRoutes,
  serviceNotice,
  type RoutePlan,
  type RoutePreference,
} from "../../lib/routePlanner";
import { NetworkMap } from "./NetworkMap";
import { StationPicker } from "./StationPicker";

const preferences: { id: RoutePreference; label: string }[] = [
  { id: "fastest", label: "Fastest" },
  { id: "cheapest", label: "Lowest fare" },
  { id: "transfers", label: "Fewer changes" },
];
function Journey({ plan, now }: { plan: RoutePlan; now: Date }) {
  const notice = serviceNotice(now, plan.totalMinutes);
  return (
    <div className="journey">
      <div className="journey-heading">
        <h3>Route</h3>

      </div>
      <div className="journey-metrics" role="status" aria-live="polite">
        <div>
          <strong>
            {plan.totalMinutes}
            <small> min</small>
          </strong>
          <span>
            <Clock3 size={13} /> including waits
          </span>
        </div>
        <div>
          <strong>฿{plan.totalFare}</strong>
          <span>
            <Wallet size={13} /> estimated fare
          </span>
        </div>
        <div>
          <strong>{plan.transfers}</strong>
          <span>
            <Route size={13} /> changes
          </span>
        </div>
      </div>
      {!notice && (
        <p className="arrival">
          Leave now <b>{bangkokTime(now)}</b>
          <ArrowRight size={13} />
          Estimated arrival{" "}
          <b>
            {bangkokTime(new Date(now.getTime() + plan.totalMinutes * 60000))}
          </b>
        </p>
      )}
      {notice && (
        <p className="service-notice">
          <Info size={16} />
          {notice}
        </p>
      )}
      <div className="journey-steps">
        {plan.segments.map((s, i) =>
          s.kind === "transfer" ? (
            <div className="walk-step" key={i}>
              <Route size={14} />
              <div>
                {s.sameLine
                  ? `Change trains at ${s.from.name}`
                  : `Walk ${s.minutes} min · ${s.from.name}${s.from.name !== s.to.name ? ` → ${s.to.name}` : ""}`}

              </div>
            </div>
          ) : (
            <div
              className="ride-step"
              key={i}
              style={
                { "--line-color": LINES[s.line].color } as React.CSSProperties
              }
            >
              <span className="ride-dot" />
              <div>
                <span
                  className="line-label"
                  style={{ color: LINES[s.line].color }}
                >
                  {LINES[s.line].name}
                </span>
                <h4>
                  {s.stations[0].name}
                  <ArrowRight size={14} />
                  {s.stations.at(-1)!.name}
                </h4>
                <p>
                  {s.stops} stop{s.stops === 1 ? "" : "s"} · ~{Math.ceil(s.minutes)} min riding · ~
                  {Math.ceil(s.waitMinutes)} min wait
                </p>
                <details>
                  <summary>View {s.stations.length} stations</summary>
                  <ol>
                    {s.stations.map((station, j) => (
                      <li key={`${station.id}-${j}`}>
                        <b>{station.code}</b>
                        {station.name}
                      </li>
                    ))}
                  </ol>
                </details>
              </div>
            </div>
          ),
        )}
      </div>
      <details className="fare-details">
        <summary>
          Fare breakdown <b>~฿{plan.totalFare}</b>
        </summary>
        {plan.fares.length ? (
          plan.fares.map((f, i) => (
            <p key={i}>
              <span>{f.label}</span>
              <b>฿{f.amount}</b>
            </p>
          ))
        ) : (
          <p>Walking connection · no rail fare</p>
        )}
        <small>
          Adult fare estimates. Discounts are not included.
        </small>
      </details>
    </div>
  );
}
export function RouteOptimizer() {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [preference, setPreference] = useState<RoutePreference>("fastest"),
    [planned, setPlanned] = useState(false),
    [selected, setSelected] = useState(0),
    [now, setNow] = useState(new Date());
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const valid = Boolean(getStation(from) && getStation(to) && from !== to);
  const result = useMemo(
    () => (planned && valid ? findBestRoutes(from, to, preference) : null),
    [from, to, preference, planned, valid],
  );
  const plans = result?.best ? [result.best, ...result.alternatives] : [];
  const plan = plans[selected] ?? plans[0] ?? null;
  const updateFrom = (id: string) => {
    setFrom(id);
    setSelected(0);
  };
  const updateTo = (id: string) => {
    setTo(id);
    setSelected(0);
  };
  const example = (a: string, b: string) => {
    setFrom(a);
    setTo(b);
    setPlanned(true);
    setSelected(0);
  };
  const clear = () => {
    setFrom("");
    setTo("");
    setPlanned(false);
    setSelected(0);
  };
  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            clear();
          }}
          aria-label="TrainTrace BKK home"
        >
          <span className="brand-icon">
            <TrainFront size={23} />
          </span>
          <span>
            TrainTrace<span className="brand-city">BKK</span>
          </span>
        </a>
        <nav>
          <a className="nav-active" href="#planner">
            Journey planner
          </a>
          <button onClick={() => dialog.current?.showModal()}>
            Data & fares
            <ArrowUpRight size={14} />
          </button>
        </nav>
        <div className="header-clock">
          <Clock3 size={15} />
          <b>{bangkokTime(now)}</b>
          <span>Bangkok</span>
        </div>
      </header>
      <main>
        <section className="intro">
          <div>
            <h1>Bangkok BTS &amp; MRT Route Planner</h1>
          </div>
          <div className="estimate-badge">
            <span />
            Estimates only
          </div>
        </section>
        <div className="workspace">
          <aside className="planner-card" id="planner">
            <div className="planner-title">
              <span className="section-icon">
                <Route size={20} />
              </span>
              <div>
                <h2>Plan a trip</h2>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (valid) {
                  setPlanned(true);
                  setSelected(0);
                }
              }}
            >
              <StationPicker
                label="Starting station"
                marker="A"
                value={from}
                onChange={updateFrom}
              />
              <div className="swap-row">
                <span />
                <button
                  type="button"
                  aria-label="Swap starting station and destination"
                  onClick={() => {
                    setFrom(to);
                    setTo(from);
                    setSelected(0);
                  }}
                >
                  <ArrowDownUp size={15} />
                </button>
              </div>
              <StationPicker
                label="Destination"
                marker="B"
                value={to}
                onChange={updateTo}
              />
              {from && from === to && (
                <p className="field-error" role="status">
                  Choose a different destination.
                </p>
              )}
              <label className="preference-label">
                Sort routes by
              </label>
              <div className="preferences" aria-label="Route preference">
                {preferences.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={preference === p.id}
                    className={preference === p.id ? "active" : ""}
                    onClick={() => {
                      setPreference(p.id);
                      setSelected(0);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button className="search-button" disabled={!valid} type="submit">
                Find route
                <ArrowRight size={18} />
              </button>
              <div className="departure-note">
                <Clock3 size={13} />
                Depart now · Bangkok time<span>THB ฿</span>
              </div>
            </form>
            {plan ? (
              <>
                <div className="result-topline">
                  <span>
                    {preferences.find((p) => p.id === preference)?.label} first
                  </span>
                  <button onClick={clear}>
                    Clear route
                    <X size={12} />
                  </button>
                </div>
                {plans.length > 1 && (
                  <div
                    className="route-options"
                    aria-label="Route alternatives"
                  >
                    {plans.map((p, i) => (
                      <button
                        key={p.id}
                        aria-pressed={plan.id === p.id}
                        onClick={() => setSelected(i)}
                        className={plan.id === p.id ? "active" : ""}
                      >
                        <span>
                          {i === 0 ? "Recommended" : `Alternative ${i}`}
                        </span>
                        <b>
                          {p.totalMinutes} min · ฿{p.totalFare}
                        </b>
                        <small>{p.transfers} changes</small>
                      </button>
                    ))}
                  </div>
                )}
                <Journey plan={plan} now={now} />
              </>
            ) : (
              <div className="empty-journey">
                <span className="eyebrow">Example routes</span>
                <button
                  onClick={() =>
                    example("bts-sukhumvit:CEN", "bts-sukhumvit:E4")
                  }
                >
                  Siam
                  <ArrowRight size={13} />
                  Asok
                  <ArrowUpRight size={14} />
                </button>
                <button
                  onClick={() => example("bts-sukhumvit:N8", "bts-silom:S12")}
                >
                  Mo Chit
                  <ArrowRight size={13} />
                  Bang Wa
                  <ArrowUpRight size={14} />
                </button>
                <button
                  onClick={() => example("mrt-purple:PP01", "mrt-pink:MT01")}
                >
                  Khlong Bang Phai
                  <ArrowRight size={13} />
                  IMPACT
                  <ArrowUpRight size={14} />
                </button>
              </div>
            )}
            {result && !result.best && (
              <p role="status" className="field-error">
                No route found. Please choose another pair of stations.
              </p>
            )}
            <div className="planner-footnote">
              <Info size={15} />
              <p>
                Fares and travel times are estimates.
                <button onClick={() => dialog.current?.showModal()}>
                  About estimates
                </button>
              </p>
            </div>
          </aside>
          <div className="map-column">
            <NetworkMap
              plan={plan}
              from={from}
              to={to}
              onFrom={(id) => {
                updateFrom(id);
                setPlanned(true);
              }}
              onTo={(id) => {
                updateTo(id);
                setPlanned(true);
              }}
            />
          </div>
        </div>
        <footer className="page-footer">
          <span>
            TrainTrace BKK
          </span>
          <button onClick={() => dialog.current?.showModal()}>
            Sources
            <ArrowUpRight size={13} />
          </button>
        </footer>
      </main>
      <dialog ref={dialog} className="data-dialog">
        <button
          aria-label="Close data and fares"
          className="dialog-close"
          onClick={() => dialog.current?.close()}
        >
          <X size={20} />
        </button>
        <h2>Fares & travel times</h2>
        <p>Times and fares are estimates. Live arrivals and delays are not available.</p>
        <h3>Times</h3>
        <p>Includes train travel, walking between lines and estimated waits. Check station signs for the next and last trains.</p>
        <h3>Fares</h3>
        <p>Adult single-trip estimates, without discounts. Changing BTS lines at Siam uses one fare. Other lines are priced separately. Confirm the fare before buying a ticket.</p>
        <h3>Map</h3>
        <p>All seven BTS/MRT lines. Not to scale. Airport Rail Link, SRT and unopened lines are excluded.</p>
        <h3>Sources</h3>
        <div className="source-links">
          <a
            href="https://www.bts.co.th/routemap.html"
            target="_blank"
            rel="noreferrer"
          >
            BTS routes & fares ↗
          </a>
          <a
            href="https://metro.bemplc.co.th/MRT-System-Map?lang=en"
            target="_blank"
            rel="noreferrer"
          >
            MRT Blue & Purple ↗
          </a>
          <a
            href="https://metro.bemplc.co.th/Metro-News-Detail?id=40995&lang=th"
            target="_blank"
            rel="noreferrer"
          >
            Blue Line fare update, July 2026 ↗
          </a>
          <a
            href="https://nbm.co.th/en/areamap/"
            target="_blank"
            rel="noreferrer"
          >
            MRT Pink ↗
          </a>
          <a href="https://www.ebm.co.th/" target="_blank" rel="noreferrer">
            MRT Yellow ↗
          </a>
        </div>
        <p className="data-date">
          Updated 17 September 2026.
        </p>
      </dialog>
    </div>
  );
}
