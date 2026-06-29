# Kairos — Aggregate Intelligence Platform: Developer & API Reference

Kairos is an aggregate open-source-intelligence (OSINT) analysis platform. It
ingests public content (news, Telegram, Bluesky), runs an NLP pipeline
(sentiment / entities / topics / language), and exposes aggregate analytics
keyed on **places, narratives, events, and sources** — never on individuals.

> **Scope boundary.** Every analytic in this document operates at the
> aggregate level (regions, narratives, events, sources). The platform does
> not provide individual identification, facial recognition, plate/ANPR
> recognition, or per-person location tracking.

---

## Architecture

```
Connectors ──▶ ingest ──▶ sigma_messages ──▶ NLP queue (Redis Streams)
 (News/TG/BSky)                                     │
                                                    ▼
                                           process worker ──▶ sigma_findings
                                                                   │
        ┌──────────────────────────────────────────────────────────┤
        ▼                  ▼               ▼              ▼          ▼
     ATLAS (geo)     ORACLE (risk)   Political (fcst)  Intel (fusion)  SIGMA (search)
```

- **Storage:** Supabase Postgres (`sigma_channels`, `sigma_messages`,
  `sigma_findings`), Upstash Redis (queue, geocode cache, canonical-entity map,
  Bluesky session, watchlist).
- **Models:** Anthropic (NLP + reports + entity canonicalization); optional
  local SLM via Ollama; `franc-min` for language detection.
- **Hosting:** Next.js on Vercel (Hobby: 2 cron slots, 60s function cap).

## Environment variables

| Var | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase (auth) | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB writes (ingest/process) | yes for ingestion |
| `ANTHROPIC_API_KEY` | NLP, reports, canonicalization | yes for analysis |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Queue + caches + watchlist | recommended |
| `CRON_SECRET` | Auth for cron/admin routes | yes |
| `GDELT_API_KEY` | GDELT connector (any non-empty value) | optional |
| `NEWSAPI_KEY` | NewsAPI connector | optional |
| `TELEGRAM_CHANNELS` | Comma-separated public channels | optional |
| `BLUESKY_IDENTIFIER` / `BLUESKY_APP_PASSWORD` | Bluesky connector | optional |
| `MAPBOX_TOKEN` / `GOOGLE_GEOCODING_KEY` | Higher-accuracy geocoding | optional |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | Local SLM NLP tier | optional |
| `TRACKED_QUERIES` | Override default election-topic list | optional |
| `GEOCODER_USER_AGENT` | Nominatim courtesy UA | optional |

Routes marked **🔒 CRON_SECRET** require `?secret=<CRON_SECRET>` or
`Authorization: Bearer <CRON_SECRET>`.

---

## SIGMA — ingestion & search

| Method | Route | Description |
|---|---|---|
| POST | `/api/sigma` | Live search / analyze. Body: `{ query, source?, analyze?, stored? }`. `source` ∈ gdelt, reddit, newsapi, twitter, youtube, telegram, bluesky. `stored:true` reads the Supabase index; `analyze:true` runs NLP. |
| GET | `/api/sigma/ingest` 🔒 | Crawl next batch of Telegram channels → queue. |
| GET | `/api/sigma/process` 🔒 | Drain NLP queue → write findings (`?max=`). |
| GET | `/api/sigma/seed` 🔒 | Load curated channel seed into `sigma_channels`. |
| POST | `/api/sigma/ingest-query` 🔒 | Seed corpus from news for a topic. Body `{ query, analyze? }`. |
| GET | `/api/sigma/ingest-daily` 🔒 | Combined daily cron: channel refresh + tracked queries + geocode top-up. |
| GET | `/api/sigma/queue-status` 🔒 | Queue backend + NLP backlog depth. `?purge=nlp` to clear. |
| GET | `/api/sigma/coordination` | Automated-account / coordination signals over stored corpus. |
| GET | `/api/sigma/backfill` 🔒 | Re-queue stored messages lacking findings (`?offset=`). |

## ATLAS — geographic & event analysis

| Method | Route | Description |
|---|---|---|
| GET | `/api/atlas/geojson` | Region density. `?days=&query=&level=all\|country\|city&format=geojson\|features` |
| GET | `/api/atlas/temporal` | Per-place mention counts bucketed by day. |
| GET | `/api/atlas/region` | Per-region narrative drill-down. `?place=&days=` |
| GET | `/api/atlas/timeline` | Event timeline + burst detection. `?days=&place=&topic=&granularity=day\|hour` |
| GET | `/api/atlas/correlate` | Cross-location event correlation. `?days=&maxHours=&topic=` |
| GET | `/api/atlas/heatmap` | Heatmap export. `?days=&query=&format=geojson\|csv&download=true` |
| GET | `/api/atlas/geocode-build` 🔒 | Live-geocode corpus place names into the cache. |
| GET | `/api/atlas/geocode-health` | Provider probe + outage alerts. |

## ORACLE — forecasting & risk

| Method | Route | Description |
|---|---|---|
| GET | `/api/oracle/regional` | Regional/narrative risk (LOW→CRITICAL), momentum, anomalies. `?days=&report=true&t_guarded=…` |
| POST | `/api/oracle/scenario` | Scenario model. Body `{ target, kind, sentimentDelta?, volumeMultiplier?, coordinationDelta?, days? }` |

## Political — sentiment & forecasting

| Method | Route | Description |
|---|---|---|
| GET | `/api/political/trends` | Entity sentiment time-series + momentum + source mix. `?entity=&days=&curatedOnly=&languages=&maxContentAgeDays=` |
| POST | `/api/political/forecast` | Sentiment-weighted forecast w/ 95% CIs + reliability. Body `{ candidates[], days?, sourceWeighted?, curatedOnly?, languages?, maxContentAgeDays? }` |
| GET/POST | `/api/political/route-check` | SLM↔LLM router decision + tier config. |
| GET | `/api/political/provenance` | Corpus coverage audit (sources, languages, dates, % analyzed). |

## Intel Center — fusion layer

| Method | Route | Description |
|---|---|---|
| GET | `/api/intel/lookup` | **Unified lookup.** `?q=` → trend + sources + diffusion + corroboration. |
| GET | `/api/intel/digest` | **What-changed digest** (ranked fusion). `?days=&format=json\|markdown` |
| GET | `/api/intel/alerts` | Fused alerts (risk/anomaly/emerging/deviation/sentiment). `?days=` |
| GET | `/api/intel/briefing` | Auto-briefing. `?days=&format=json\|markdown` |
| GET | `/api/intel/emerging` | Emerging narratives (new/surging/rising). `?days=` |
| GET | `/api/intel/corroboration` | Cross-source corroboration. `?query=&days=` |
| GET | `/api/intel/graph` | Entity co-occurrence graph. `?days=&minEdge=` |
| GET | `/api/intel/baseline` | Z-score volume deviations vs baseline. `?window=&recent=` |
| GET | `/api/intel/sentiment-shift` | Sentiment direction flips. `?window=&recent=` |
| GET | `/api/intel/diffusion` | Narrative diffusion (origin + propagation). `?topic=&days=` |
| GET | `/api/intel/narrative-correlation` | Cross-narrative co-movement (Pearson). `?days=` |
| GET | `/api/intel/build-canonical` 🔒 | Build LLM cross-language entity map. |
| GET/POST/DELETE | `/api/intel/watchlist` | Watchlist CRUD. |
| GET | `/api/intel/watchlist/status` | Per-item volume/sentiment/momentum/deviation. `?days=` |

---

## Operational notes

- **Throughput (Hobby).** Cron runs daily; the process worker handles ~40
  findings/run. Heavy ingestion outpaces analysis — watch
  `/api/sigma/queue-status` and `/api/political/provenance`.
- **Signal magnitudes** scale with corpus density. On a sparse / date-clustered
  corpus, z-scores and growth ratios read high; mechanisms are unchanged.
- **Geocoding** falls back gazetteer → cache → Mapbox → Google → Nominatim,
  with confidence per provider. Nominatim is paced to ~1 req/s.
- **Statistics used:** Wilson score intervals (forecast CIs), HHI (source
  concentration), z-scores (deviations), Pearson r (co-movement), Jaccard
  shingles (dedup / corroboration).

## Methodology integrity

Every output is designed to surface its own limitations: forecasts carry
confidence intervals and reliability ratings; the provenance panel exposes
source/language/date coverage; corroboration reports independent-source counts.
Treat outputs as analyst decision-support over a known, auditable corpus — not
ground truth.
