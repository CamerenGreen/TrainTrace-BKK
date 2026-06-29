export type LineId = "bts-sukhumvit" | "bts-silom" | "mrt-blue";

export interface Station {
  id: string;
  name: string;
  line: LineId;
}

export const LINE_LABELS: Record<LineId, string> = {
  "bts-sukhumvit": "BTS Sukhumvit",
  "bts-silom": "BTS Silom",
  "mrt-blue": "MRT Blue",
};

export const LINE_COLORS: Record<LineId, string> = {
  "bts-sukhumvit": "bg-[#76B729] text-white border-transparent",
  "bts-silom": "bg-[#1E7A4C] text-white border-transparent",
  "mrt-blue": "bg-[#1E3A8A] text-white border-transparent",
};

export const STATIONS: Station[] = [
  { id: "mo-chit", name: "Mo Chit", line: "bts-sukhumvit" },
  { id: "phaya-thai-bts", name: "Phaya Thai", line: "bts-sukhumvit" },
  { id: "victory-monument", name: "Victory Monument", line: "bts-sukhumvit" },
  { id: "asoke-bts", name: "Asoke", line: "bts-sukhumvit" },
  { id: "phrom-phong", name: "Phrom Phong", line: "bts-sukhumvit" },
  { id: "thong-lo", name: "Thong Lo", line: "bts-sukhumvit" },
  { id: "ekkamai", name: "Ekkamai", line: "bts-sukhumvit" },
  { id: "on-nut", name: "On Nut", line: "bts-sukhumvit" },
  { id: "bearing", name: "Bearing", line: "bts-sukhumvit" },
  { id: "national-stadium", name: "National Stadium", line: "bts-silom" },
  { id: "ratchadamri", name: "Ratchadamri", line: "bts-silom" },
  { id: "siam-bts", name: "Siam", line: "bts-sukhumvit" },
  { id: "siam-silom", name: "Siam", line: "bts-silom" },
  { id: "sala-daeng", name: "Sala Daeng", line: "bts-silom" },
  { id: "chong-nonsi", name: "Chong Nonsi", line: "bts-silom" },
  { id: "saphan-taksin", name: "Saphan Taksin", line: "bts-silom" },
  { id: "bang-sue", name: "Bang Sue", line: "mrt-blue" },
  { id: "chatuchak-park", name: "Chatuchak Park", line: "mrt-blue" },
  { id: "phaya-thai-mrt", name: "Phaya Thai", line: "mrt-blue" },
  { id: "sukhumvit-mrt", name: "Sukhumvit", line: "mrt-blue" },
  { id: "sam-yan", name: "Sam Yan", line: "mrt-blue" },
  { id: "silom-mrt", name: "Silom", line: "mrt-blue" },
  { id: "lumphini", name: "Lumphini", line: "mrt-blue" },
  { id: "khlong-toei", name: "Khlong Toei", line: "mrt-blue" },
];

const LINE_ORDER: Record<LineId, string[]> = {
  "bts-sukhumvit": [
    "mo-chit",
    "phaya-thai-bts",
    "victory-monument",
    "siam-bts",
    "asoke-bts",
    "phrom-phong",
    "thong-lo",
    "ekkamai",
    "on-nut",
    "bearing",
  ],
  "bts-silom": [
    "national-stadium",
    "ratchadamri",
    "siam-silom",
    "sala-daeng",
    "chong-nonsi",
    "saphan-taksin",
  ],
  "mrt-blue": [
    "bang-sue",
    "chatuchak-park",
    "phaya-thai-mrt",
    "sukhumvit-mrt",
    "sam-yan",
    "silom-mrt",
    "lumphini",
    "khlong-toei",
  ],
};

const TRANSFERS: Array<[string, string]> = [
  ["mo-chit", "chatuchak-park"],
  ["phaya-thai-bts", "phaya-thai-mrt"],
  ["asoke-bts", "sukhumvit-mrt"],
  ["siam-bts", "siam-silom"],
  ["sala-daeng", "silom-mrt"],
];

export interface GraphEdge {
  from: string;
  to: string;
  line: LineId | "transfer";
  minutes: number;
}

function lineEdges(line: LineId): GraphEdge[] {
  const order = LINE_ORDER[line];
  const edges: GraphEdge[] = [];

  for (let i = 0; i < order.length - 1; i += 1) {
    edges.push({
      from: order[i],
      to: order[i + 1],
      line,
      minutes: 3,
    });
    edges.push({
      from: order[i + 1],
      to: order[i],
      line,
      minutes: 3,
    });
  }

  return edges;
}

export const GRAPH_EDGES: GraphEdge[] = [
  ...lineEdges("bts-sukhumvit"),
  ...lineEdges("bts-silom"),
  ...lineEdges("mrt-blue"),
  ...TRANSFERS.flatMap(([a, b]) => [
    { from: a, to: b, line: "transfer" as const, minutes: 5 },
    { from: b, to: a, line: "transfer" as const, minutes: 5 },
  ]),
];

export function getStation(id: string): Station | undefined {
  return STATIONS.find((station) => station.id === id);
}

export function getUniqueStations(): Station[] {
  const seen = new Set<string>();
  return STATIONS.filter((station) => {
    if (seen.has(station.name)) return false;
    seen.add(station.name);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
}
