# Network data and estimation model

Sources reviewed: **2026-09-17**. Station names/codes and connectivity are manually curated from operator network maps. Coordinates in the app are an original schematic, not latitude/longitude. Counts are line-specific platforms: BTS Sukhumvit 47, Silom 14, Gold 3; MRT Blue 38, Purple 16, Yellow 23, Pink 32. Repeated interchange names are deliberately disambiguated by line and code.

## Operator references

- BTS system and fare planner: https://www.bts.co.th/routemap.html
- BTS fare information: https://www.bts.co.th/tickets/ticket-rabbit-farerate.html
- BEM Blue/Purple network and service information: https://metro.bemplc.co.th/MRT-System-Map?lang=en
- BEM Blue fare announcement, effective 3 July 2026–2 July 2028, adult range ฿17–44: https://metro.bemplc.co.th/Metro-News-Detail?id=40995&lang=th
- BEM fare/card conditions, including card-dependent Purple/Red daily-cap programs: https://metro.bemplc.co.th/FAQs-Card?lang=en
- NBM network map (also depicts future services, which are excluded from this app): https://nbm.co.th/assets/pdf/PK_SystemMap_03.pdf
- NBM station maps: https://nbm.co.th/en/areamap/
- MRTA Pink extension project: https://www.mrta.co.th/en/search-result?category_id=623&category_pid=138&page=1&search=1
- Yellow Line operator: https://www.ebm.co.th/

## Connectivity decisions

- Omit unopened Sena Ruam (N6), Orange Line, and proposed Blue/Purple/Gold extensions.
- Blue BL32 (Itsaraphap) connects to BL01 (Tha Phra), then BL33 (Bang Phai); it must not jump directly to BL33. A journey between BL02 and another BL01 branch includes a platform change at Tha Phra.
- Pink MT01/MT02 branch from PK10 (Muang Thong Thani). Through journeys between the main line and branch include a platform change.
- BTS National Stadium connects to Siam, then Ratchadamri. Phaya Thai is not an MRT Blue station.
- Walking interchange links are explicit, with 3–7 minutes of modeled walking time. Train changes and walking endpoints are separate concepts.

## Fare estimates, not fare matrices

All fare functions are **simplified planning heuristics**. The source review does not make these exact operator quotes. Published fare ranges bound the model; actual distance-based tables, paid-area rules, ticket type, concessions, rebates and promotions can yield different prices. The optimizer's “Lowest fare” means lowest under this model among simple network paths, not a guaranteed cheapest ticket.

- BTS Green: progressive stop bands; modeled northern/far-eastern extension-only journeys ฿15, modeled core+extension surcharge ฿15 and cap ฿62. The two Green lines share one ticket group through Siam. This does not reproduce the operator's full station-pair fare matrix.
- Gold: modeled flat ฿16 per rail journey.
- Blue: stop bands within the current published ฿17–44 range. No extra ticket for a platform change at Tha Phra.
- Purple: modeled ฿14 plus ฿2 per stop, capped at ฿42. Card-dependent daily caps and Blue/Purple entry rebates are not applied.
- Pink/Yellow: modeled ฿15 plus ฿3 per stop, capped at ฿45. Branch segments remain in the same Pink ticket group; actual branch distance charges differ from the stop heuristic.
- Walking-only interchanges cost ฿0. Cross-system rail journeys sum ticket groups. No discount eligibility is inferred.

For production fare accuracy, obtain licensed/current operator station-pair matrices and replace the estimator with those tables, with effective dates and ticket categories.

## Time estimates

Assume 2.5 minutes per rail edge (4 minutes PK10–MT01), 3–7 minutes for walking/platform changes, and half an assumed headway per boarding (Green 6 min, Gold 10, Blue 7, Purple 9, Pink/Yellow 10). These are planning assumptions, not schedules. Service notices use a broad 06:00–00:00 Bangkok window; actual first/last trains and frequency vary by line, station, direction and day. No departures are fabricated during closed hours.

## Future live integration

There is no live status, arrival, position, disruption or timetable feed in this version. A future integration needs an authorized operator/provider source and a server-side adapter (credentials must never be bundled into Vite client code). Freshness timestamps, stale-data fallbacks and explicit disruption-aware graph rules should be added with that feed. Until then, keep “Estimate mode” visible.
