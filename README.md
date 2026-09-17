# TrainTrace BKK

An interactive Bangkok BTS/MRT schematic and station-to-station journey planner.

## Run locally

Use Node.js 22.18+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

## Features

- All seven operating BTS/MRT lines: Sukhumvit, Silom, Gold, Blue, Purple, Yellow and Pink, including the Muang Thong Thani branch.
- 173 line-specific station platforms, searchable by English name, station code or line. Interchanges have separate platforms to make transfers explicit.
- Interactive SVG schematic: pan, zoom, line highlighting, station selection, route highlighting and fit-to-route.
- Fastest, lowest estimated fare and fewest train changes; useful alternative routes; expandable station lists and fare breakdowns.
- BTS interchange ticket grouping, walking-only connections, Blue Line loop/junction and Pink branch platform changes.
- Bangkok local clock, refreshed arrival estimates and overnight service warnings.
- Responsive desktop/mobile layout and keyboard-accessible station search and map controls.

## Data and estimates

**No live feed is connected.** Arrivals, journey times and adult single-trip fares are planning estimates, not live train information or ticket quotes. The app explicitly labels this throughout. The clock updates every 30 seconds; that does not represent an operator update.

The network excludes unopened extensions, Airport Rail Link, SRT and other transport modes. Schematic coordinates cannot be used for walking directions or nearest-station calculations. See [data sources and assumptions](docs/DATA.md).

## Implementation

- `src/data/stations.ts`: station catalog, schematic layout, undirected rail graph and explicit interchanges.
- `src/lib/routePlanner.ts`: simple-path search, preference ordering, ticket groups and timing assumptions.
- `src/app/components/NetworkMap.tsx`: interactive network map.
- `src/app/components/StationPicker.tsx`: searchable keyboard-accessible combobox.
- `tests/routePlanner.test.ts`: topology, fare grouping, loop/branch behavior, long routes, timezone checks and routes across all lines.

The current network has seven independent cycles. A depth-first traversal enumerates simple paths, then ranks them using the complete fare/time/transfer model. Unlike the original implementation, there is no 24-station cutoff. A bounded cache keeps repeat queries immediate. Reassess the search strategy if adding a large bus or walking graph.

## Deployment

`npm run build` creates `dist/`. Existing Vercel/Netlify configuration supports the static Vite app. This work does not publish a deployment automatically.
