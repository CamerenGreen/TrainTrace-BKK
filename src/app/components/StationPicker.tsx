import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { getStation, getUniqueStations, LINES } from "../../data/stations";
const stations = getUniqueStations();
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace("asoke", "asok");
export function StationPicker({
  label,
  value,
  onChange,
  marker,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  marker: string;
}) {
  const id = useId(),
    ref = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(0);
  const station = getStation(value);
  const filtered = stations.filter((s) =>
    normalize(`${s.name} ${s.code} ${LINES[s.line].name}`).includes(
      normalize(query),
    ),
  );
  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
    input.current?.focus();
  };
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    document
      .getElementById(`${id}-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, id]);
  return (
    <div
      className="station-field"
      ref={ref}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id}>
        <span className={`field-marker ${marker === "B" ? "destination" : ""}`}>
          {marker}
        </span>
        {label}
      </label>
      <div className={`station-input ${open ? "is-open" : ""}`}>
        <input
          ref={input}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={
            open && filtered[active] ? `${id}-${active}` : undefined
          }
          placeholder="Search station or code"
          autoComplete="off"
          value={open ? query : (station?.name ?? "")}
          onFocus={() => {
            if (!open) {
              setOpen(true);
              setQuery("");
              setActive(0);
            }
          }}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
            onChange("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive((n) =>
                Math.max(
                  0,
                  Math.min(
                    filtered.length - 1,
                    n + (e.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (e.key === "Enter" && open && filtered[active]) {
              e.preventDefault();
              choose(filtered[active].id);
            }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {open ? <Search size={16} /> : <ChevronDown size={16} />}
      </div>
      {station && !open && (
        <span className="selected-line">
          <i style={{ background: LINES[station.line].color }} />
          {station.code} · {LINES[station.line].name}
        </span>
      )}
      {open && (
        <div
          className="station-options"
          role="listbox"
          id={`${id}-list`}
          aria-label={`${label} stations`}
        >
          {filtered.length === 0 && (
            <p className="no-options">
              No matching stations. Try a name or station code.
            </p>
          )}
          {filtered.map((s, i) => (
            <div
              key={s.id}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(s.id)}
            >
              <i style={{ background: LINES[s.line].color }} />
              <span>
                {s.name}
                <small>{LINES[s.line].name}</small>
              </span>
              <b>{s.code}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
