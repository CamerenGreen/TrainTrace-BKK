import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Info,
  MapPin,
  Route,
  TrainFront,
  Wallet,
  X,
} from "lucide-react";
import { getStation, LINES, STATIONS } from "../../data/stations";
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
        <h3>Your journey</h3>
        <span>
          <Check size={12} /> Estimated route
        </span>
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
                <small>
                  {s.sameLine
                    ? "Stay in the paid area; change platforms."
                    : s.from.line.startsWith("bts-") &&
                        s.to.line.startsWith("bts-") &&
                        s.from.code === "CEN"
                      ? "Stay in the BTS paid area."
                      : "Follow interchange signs; allow time between platforms."}
                </small>
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
          Adult single-trip planning estimates. Distance bands, ticket type and
          discounts can change the actual price.
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
            <div className="eyebrow">YOUR CITY, A LITTLE CLOSER</div>
            <h1>
              Bangkok, connected<span>.</span>
            </h1>
            <p>
              Find your way across the city. More exploring, less figuring it
              out.
            </p>
          </div>
          <div className="estimate-badge">
            <span />
            Estimate mode<small>No live train feed connected</small>
          </div>
        </section>
        <div className="workspace">
          <aside className="planner-card" id="planner">
            <div className="planner-title">
              <span className="section-icon">
                <Route size={20} />
              </span>
              <div>
                <h2>Where are you heading?</h2>
                <p>Let’s find your next connection.</p>
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
                  You’re already there. Choose a different destination.
                </p>
              )}
              <label className="preference-label">
                Make the most of your journey
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
                Find my route
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
                <div className="empty-route-art">
                  <span>A</span>
                  <i />
                  <TrainFront size={25} />
                  <i />
                  <span>B</span>
                </div>
                <h3>A better way from A to B.</h3>
                <p>
                  Search {STATIONS.length} station platforms, or choose a stop
                  on the map to begin.
                </p>
                <span className="eyebrow">TRY A JOURNEY</span>
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
                  How we calculate your trip
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
            <div className="below-map">
              <div>
                <span className="small-icon">
                  <TrainFront size={19} />
                </span>
                <p>
                  <b>The whole BTS + MRT network</b>
                  <span>Seven lines, including the Pink Line branch.</span>
                </p>
              </div>
              <div>
                <span className="small-icon">
                  <Wallet size={19} />
                </span>
                <p>
                  <b>A little planning goes a long way</b>
                  <span>Compare time, estimated fares and changes.</span>
                </p>
              </div>
            </div>
            <div className="coverage-note">
              <MapPin size={14} />
              BTS Sukhumvit, Silom & Gold · MRT Blue, Purple, Yellow & Pink.
              Airport Rail Link and SRT are outside this planner.
            </div>
          </div>
        </div>
        <footer className="page-footer">
          <span>
            TrainTrace BKK<span>Made for the journey.</span>
          </span>
          <button onClick={() => dialog.current?.showModal()}>
            Network & fare sources
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
        <span className="eyebrow">A NOTE ON YOUR JOURNEY</span>
        <h2>Useful estimates. Clear expectations.</h2>
        <p>
          This app calculates routes instantly on the operating BTS/MRT network.
          It does not receive live arrivals, train positions or disruption
          reports.
        </p>
        <h3>Travel times</h3>
        <p>
          We allow about 2½ minutes per station, walking time at interchanges,
          and half an assumed 6–10 minute headway each time you board. Arrival
          estimates refresh every 30 seconds. Check station signs for the next
          and last trains.
        </p>
        <h3>Fare estimates</h3>
        <p>
          Adult single-trip estimates use simplified distance bands. BTS changes
          at Siam share one ticket estimate; other systems are added separately.
          Blue Line estimates use the July 2026 ฿17–44 range. Card discounts,
          daily caps, concessions and cross-system rebates are not included. The
          lowest-fare option is based on this estimate model.
        </p>
        <h3>Network coverage</h3>
        <p>
          All 7 operating BTS/MRT lines, with 173 station platforms including
          interchange platforms and the Muang Thong Thani branch. This is a
          schematic, not a walking or geographic map. Unopened extensions,
          Airport Rail Link and SRT services are excluded.
        </p>
        <h3>Check with the operators</h3>
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
          Sources reviewed 17 September 2026. Confirm current fares and service
          with the operator before travel.
        </p>
      </dialog>
    </div>
  );
}
