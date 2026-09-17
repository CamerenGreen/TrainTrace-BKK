/** Operating BTS/MRT network. Coordinates are schematic. See docs/DATA.md. */
export type LineId =
  | "bts-sukhumvit"
  | "bts-silom"
  | "bts-gold"
  | "mrt-blue"
  | "mrt-purple"
  | "mrt-yellow"
  | "mrt-pink";
export interface Station {
  id: string;
  code: string;
  name: string;
  line: LineId;
  x: number;
  y: number;
}
export const LINES: Record<
  LineId,
  { name: string; short: string; color: string; headway: number }
> = {
  "bts-sukhumvit": {
    name: "BTS Sukhumvit",
    short: "Sukhumvit",
    color: "#78a928",
    headway: 6,
  },
  "bts-silom": {
    name: "BTS Silom",
    short: "Silom",
    color: "#168779",
    headway: 6,
  },
  "bts-gold": {
    name: "Gold Line",
    short: "Gold",
    color: "#b78b29",
    headway: 10,
  },
  "mrt-blue": { name: "MRT Blue", short: "Blue", color: "#3577bf", headway: 7 },
  "mrt-purple": {
    name: "MRT Purple",
    short: "Purple",
    color: "#9262b3",
    headway: 9,
  },
  "mrt-yellow": {
    name: "MRT Yellow",
    short: "Yellow",
    color: "#d5aa18",
    headway: 10,
  },
  "mrt-pink": {
    name: "MRT Pink",
    short: "Pink",
    color: "#dd7b9e",
    headway: 10,
  },
};
export const LINE_IDS = Object.keys(LINES) as LineId[];
type Point = [number, number];
function stations(
  line: LineId,
  rows: string,
  anchors: Record<number, Point>,
): Station[] {
  const points = Object.keys(anchors)
    .map(Number)
    .sort((a, b) => a - b);
  return rows
    .trim()
    .split("\n")
    .map((row, i) => {
      const [code, name] = row.split("|");
      const before = points.filter((n) => n <= i).at(-1)!;
      const after = points.find((n) => n >= i)!;
      const fraction = before === after ? 0 : (i - before) / (after - before);
      const [ax, ay] = anchors[before],
        [bx, by] = anchors[after];
      return {
        id: `${line}:${code}`,
        code,
        name,
        line,
        x: ax + (bx - ax) * fraction,
        y: ay + (by - ay) * fraction,
      };
    });
}
const sukhumvit = stations(
  "bts-sukhumvit",
  `N24|Khu Khot
N23|Yaek Kor Por Aor
N22|Royal Thai Air Force Museum
N21|Bhumibol Adulyadej Hospital
N20|Saphan Mai
N19|Sai Yud
N18|Phahon Yothin 59
N17|Wat Phra Sri Mahathat
N16|11th Infantry Regiment
N15|Bang Bua
N14|Royal Forest Department
N13|Kasetsart University
N12|Sena Nikhom
N11|Ratchayothin
N10|Phahon Yothin 24
N9|Ha Yaek Lat Phrao
N8|Mo Chit
N7|Saphan Khwai
N5|Ari
N4|Sanam Pao
N3|Victory Monument
N2|Phaya Thai
N1|Ratchathewi
CEN|Siam
E1|Chit Lom
E2|Phloen Chit
E3|Nana
E4|Asok
E5|Phrom Phong
E6|Thong Lo
E7|Ekkamai
E8|Phra Khanong
E9|On Nut
E10|Bang Chak
E11|Punnawithi
E12|Udom Suk
E13|Bang Na
E14|Bearing
E15|Samrong
E16|Pu Chao
E17|Chang Erawan
E18|Royal Thai Naval Academy
E19|Pak Nam
E20|Srinagarindra
E21|Phraek Sa
E22|Sai Luat
E23|Kheha`,
  {
    0: [1010, 65],
    7: [1010, 340],
    15: [820, 690],
    16: [820, 750],
    23: [820, 1110],
    27: [1190, 1110],
    31: [1410, 1290],
    38: [1410, 1640],
    46: [1410, 2040],
  },
);
const silom = stations(
  "bts-silom",
  `W1|National Stadium
CEN|Siam
S1|Ratchadamri
S2|Sala Daeng
S3|Chong Nonsi
S4|Saint Louis
S5|Surasak
S6|Saphan Taksin
S7|Krung Thon Buri
S8|Wongwian Yai
S9|Pho Nimit
S10|Talat Phlu
S11|Wutthakat
S12|Bang Wa`,
  {
    0: [690, 1130],
    1: [820, 1130],
    3: [970, 1280],
    7: [730, 1480],
    8: [625, 1480],
    12: [345, 1480],
    13: [280, 1410],
  },
);
const blue = stations(
  "mrt-blue",
  `BL01|Tha Phra
BL02|Charan 13
BL03|Fai Chai
BL04|Bang Khun Non
BL05|Bang Yi Khan
BL06|Sirindhorn
BL07|Bang Phlat
BL08|Bang O
BL09|Bang Pho
BL10|Tao Poon
BL11|Bang Sue
BL12|Kamphaeng Phet
BL13|Chatuchak Park
BL14|Phahon Yothin
BL15|Lat Phrao
BL16|Ratchadaphisek
BL17|Sutthisan
BL18|Huai Khwang
BL19|Thailand Cultural Centre
BL20|Phra Ram 9
BL21|Phetchaburi
BL22|Sukhumvit
BL23|Queen Sirikit National Convention Centre
BL24|Khlong Toei
BL25|Lumphini
BL26|Silom
BL27|Sam Yan
BL28|Hua Lamphong
BL29|Wat Mangkon
BL30|Sam Yot
BL31|Sanam Chai
BL32|Itsaraphap
BL33|Bang Phai
BL34|Bang Wa
BL35|Phetkasem 48
BL36|Phasi Charoen
BL37|Bang Khae
BL38|Lak Song`,
  {
    0: [380, 1280],
    8: [380, 740],
    9: [475, 740],
    12: [840, 770],
    13: [840, 710],
    14: [1170, 710],
    21: [1170, 1090],
    22: [1170, 1280],
    25: [970, 1310],
    26: [845, 1280],
    31: [455, 1280],
    32: [340, 1350],
    33: [280, 1390],
    37: [60, 1590],
  },
);
const purple = stations(
  "mrt-purple",
  `PP01|Khlong Bang Phai
PP02|Talad Bang Yai
PP03|Sam Yaek Bang Yai
PP04|Bang Phlu
PP05|Bang Rak Yai
PP06|Bang Rak Noi Tha It
PP07|Sai Ma
PP08|Phra Nang Klao Bridge
PP09|Yaek Nonthaburi 1
PP10|Bang Krasor
PP11|Nonthaburi Civic Center
PP12|Ministry of Public Health
PP13|Yaek Tiwanon
PP14|Wong Sawang
PP15|Bang Son
PP16|Tao Poon`,
  { 0: [75, 360], 3: [75, 530], 10: [475, 530], 15: [475, 720] },
);
const pink = stations(
  "mrt-pink",
  `PK01|Nonthaburi Civic Center
PK02|Khae Rai
PK03|Sanambin Nam
PK04|Samakkhi
PK05|Royal Irrigation Department
PK06|Yaek Pak Kret
PK07|Pak Kret Bypass
PK08|Chaeng Watthana - Pak Kret 28
PK09|Si Rat
PK10|Muang Thong Thani
PK11|Chaeng Watthana 14
PK12|Government Complex
PK13|National Telecom
PK14|Lak Si
PK15|Phranakhon Rajabhat
PK16|Wat Phra Sri Mahathat
PK17|Ram Inthra 3
PK18|Lat Pla Khao
PK19|Ram Inthra Kor Mor 4
PK20|Maiyalap
PK21|Vacharaphol
PK22|Ram Inthra Kor Mor 6
PK23|Khu Bon
PK24|Ram Inthra Kor Mor 9
PK25|Outer Ring Road - Ram Inthra
PK26|Nopparat
PK27|Bang Chan
PK28|Setthabutbamphen
PK29|Min Buri Market
PK30|Min Buri`,
  {
    0: [495, 530],
    5: [495, 320],
    9: [700, 320],
    15: [1010, 320],
    24: [1650, 320],
    29: [1650, 620],
  },
);
const pinkBranch = stations(
  "mrt-pink",
  `MT01|IMPACT Muang Thong Thani
MT02|Lake Muang Thong Thani`,
  { 0: [700, 195], 1: [700, 110] },
);
const yellow = stations(
  "mrt-yellow",
  `YL01|Lat Phrao
YL02|Phawana
YL03|Chok Chai 4
YL04|Lat Phrao 71
YL05|Lat Phrao 83
YL06|Mahat Thai
YL07|Lat Phrao 101
YL08|Bang Kapi
YL09|Yaek Lam Sali
YL10|Si Kritha
YL11|Hua Mak
YL12|Kalantan
YL13|Si Nut
YL14|Srinagarindra 38
YL15|Suan Luang Rama IX
YL16|Si Udom
YL17|Si Iam
YL18|Si La Salle
YL19|Si Bearing
YL20|Si Dan
YL21|Si Thepha
YL22|Thipphawan
YL23|Samrong`,
  { 0: [1190, 710], 7: [1650, 710], 19: [1650, 1490], 22: [1430, 1640] },
);
const gold = stations(
  "bts-gold",
  `G1|Krung Thon Buri
G2|Charoen Nakhon
G3|Khlong San`,
  { 0: [625, 1500], 1: [625, 1590], 2: [535, 1590] },
);
export const STATIONS = [
  ...sukhumvit,
  ...silom,
  ...gold,
  ...blue,
  ...purple,
  ...yellow,
  ...pink,
  ...pinkBranch,
];
const byId = new Map(STATIONS.map((s) => [s.id, s]));
export const getStation = (id: string) => byId.get(id);
export interface GraphEdge {
  from: string;
  to: string;
  line: LineId | "transfer";
  minutes: number;
}
const edges: GraphEdge[] = [];
function connect(a: Station, b: Station, transfer = false, minutes = 2.5) {
  edges.push(
    { from: a.id, to: b.id, line: transfer ? "transfer" : a.line, minutes },
    { from: b.id, to: a.id, line: transfer ? "transfer" : a.line, minutes },
  );
}
for (const route of [sukhumvit, silom, gold, purple, yellow, pink, pinkBranch])
  route.slice(1).forEach((s, i) => connect(route[i], s));
// Tha Phra joins the Blue loop and the Lak Song tail; BL32 does not skip it.
blue.slice(1, 32).forEach((s, i) => connect(blue[i], s));
connect(blue[31], blue[0]);
connect(blue[0], blue[32]);
blue.slice(33).forEach((s, i) => connect(blue[i + 32], s));
connect(pink[9], pinkBranch[0], false, 4);
export const INTERCHANGES: [string, string, number][] = [
  ["bts-sukhumvit:CEN", "bts-silom:CEN", 3],
  ["bts-sukhumvit:N8", "mrt-blue:BL13", 6],
  ["bts-sukhumvit:N9", "mrt-blue:BL14", 7],
  ["bts-sukhumvit:E4", "mrt-blue:BL22", 6],
  ["bts-silom:S2", "mrt-blue:BL26", 6],
  ["bts-silom:S12", "mrt-blue:BL34", 5],
  ["bts-silom:S7", "bts-gold:G1", 4],
  ["mrt-blue:BL10", "mrt-purple:PP16", 4],
  ["mrt-purple:PP11", "mrt-pink:PK01", 7],
  ["bts-sukhumvit:N17", "mrt-pink:PK16", 5],
  ["mrt-blue:BL15", "mrt-yellow:YL01", 7],
  ["bts-sukhumvit:E15", "mrt-yellow:YL23", 5],
];
INTERCHANGES.forEach(([a, b, minutes]) =>
  connect(byId.get(a)!, byId.get(b)!, true, minutes),
);
export const GRAPH_EDGES = edges;
export const ADJACENCY = new Map(
  STATIONS.map((s) => [s.id, edges.filter((e) => e.from === s.id)]),
);
export const getUniqueStations = () =>
  [...STATIONS].sort(
    (a, b) => a.name.localeCompare(b.name) || a.line.localeCompare(b.line),
  );
