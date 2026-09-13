VINScout

Used Vehicle Opportunity Detection & Screening Platform

Version: 1.0
Status: MVP Technical Specification
Target platform: Cloudflare + GitHub
Primary language: TypeScript
Primary objective: Continuously discover used-vehicle listings, normalize them by VIN, apply a mandatory vehicle-history gate, and rank only eligible vehicles by value, ownership risk, maintenance exposure, and market position.

---

> **Implementation note (2026-09-14):** The repo follows this spec's stack as written — Vite+React on Cloudflare Pages, Cloudflare Workers for the API/cron, and D1 for storage — chosen specifically because it runs entirely on Cloudflare's free tier at hobby scale. Inventory comes from Auto.dev's licensed API rather than scraping (see §12, §48). The core pipeline (discover → normalize → dedup → history gate → manual verify → value/maintenance/opportunity scoring) is implemented and running in production; §48 tracks status line by line.

---

1. Product Objective

VINScout is a web application for identifying unusually good used-vehicle opportunities within a configurable geographic area.

The system shall:

1. Discover vehicles from multiple inventory sources.
2. Normalize listings into a common vehicle model.
3. Deduplicate listings using VIN.
4. Apply a mandatory history gate before any value scoring.
5. Reject vehicles with unacceptable accident/damage/title/history indicators.
6. Estimate market value.
7. Estimate maintenance exposure.
8. Calculate an opportunity score.
9. Track price and listing history.
10. Detect new listings and price reductions.
11. Notify users when a vehicle meets their saved criteria.

The system is intended to answer:

«"Among all vehicles currently available that meet my requirements and have acceptable history, which are actually the best opportunities?"»

It is not intended to simply reproduce marketplace "Great Deal" ratings.

---

2. Core Design Principle

History before value

The evaluation pipeline MUST execute in this order:

DISCOVER
    ↓
NORMALIZE
    ↓
IDENTIFY VIN
    ↓
DEDUPLICATE
    ↓
HISTORY GATE
    ↓
ELIGIBILITY FILTER
    ↓
MARKET VALUE
    ↓
MAINTENANCE RISK
    ↓
OPPORTUNITY SCORE
    ↓
RANK
    ↓
ALERT

A vehicle that fails the history gate MUST NOT receive an opportunity score.

A vehicle with unknown history MUST NOT be treated as clean.

---

3. Scope

MVP

Included

- Used vehicles
- VIN-based identity
- Dealer inventory
- Marketplace inventory adapters
- Geographic filtering
- Price filtering
- Mileage filtering
- Make/model/year/trim filtering
- History gate
- Title-status filtering
- Accident/damage filtering
- Owner-count filtering
- Deal scoring
- Maintenance-risk scoring
- Price history
- Watchlists
- Basic alerts
- Web dashboard

Deferred

- Financing calculations
- Trade-in valuation
- Direct purchasing
- Dealer negotiation automation
- Vehicle inspection scheduling
- Automated VIN decoding from photographs
- Full nationwide inventory
- Mobile native application

---

4. Technology Stack

Frontend

React
TypeScript
Vite
Tailwind CSS

Hosted using:

Cloudflare Pages

Backend

Cloudflare Workers
TypeScript

Database

Cloudflare D1
SQLite

Scheduling

Cloudflare Cron Triggers

Browser automation

Use only when permitted and technically necessary:

Cloudflare Browser Run / Playwright

Source control

GitHub

CI/CD

GitHub Actions

---

5. High-Level Architecture

                        ┌──────────────────────┐
                        │   INVENTORY SOURCES  │
                        │                      │
                        │ Dealer websites      │
                        │ CarGurus             │
                        │ Cars.com             │
                        │ AutoTrader           │
                        │ TrueCar              │
                        │ Other permitted APIs │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ DISCOVERY ADAPTERS   │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ NORMALIZATION        │
                        │                      │
                        │ VIN                  │
                        │ Year                 │
                        │ Make                 │
                        │ Model                │
                        │ Trim                 │
                        │ Price                │
                        │ Mileage              │
                        │ Dealer               │
                        │ Location             │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ VIN DEDUPLICATION    │
                        └──────────┬───────────┘
                                   │
                                   ▼
              ╔════════════════════════════════════╗
              ║        HISTORY GATE                ║
              ║                                    ║
              ║ Accident?                         ║
              ║ Damage?                            ║
              ║ Structural damage?                 ║
              ║ Airbag deployment?                ║
              ║ Total loss?                        ║
              ║ Salvage/rebuilt?                   ║
              ║ Flood?                             ║
              ║ Lemon/buyback?                     ║
              ║ Odometer problem?                  ║
              ╚═══════════════╤════════════════════╝
                              │
                  ┌───────────┴───────────┐
                  │                       │
                FAIL                     PASS
                  │                       │
                  ▼                       ▼
             REJECTED              VALUE ENGINE
                                          │
                                          ▼
                                  MAINTENANCE ENGINE
                                          │
                                          ▼
                                   DEAL SCORING
                                          │
                                          ▼
                                      RANKING
                                          │
                                          ▼
                                  USER DASHBOARD
                                          │
                                          ▼
                                      ALERTS

---

6. Repository Structure

vinscout/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── worker/
│       ├── src/
│       │   ├── api/
│       │   ├── discovery/
│       │   ├── history/
│       │   ├── scoring/
│       │   ├── maintenance/
│       │   ├── normalization/
│       │   ├── jobs/
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── domain/
│   ├── scoring/
│   ├── adapters/
│   └── validation/
│
├── migrations/
│   ├── 0001_initial.sql
│   ├── 0002_indexes.sql
│   └── 0003_history.sql
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── docs/
│   ├── architecture.md
│   ├── data-sources.md
│   ├── scoring.md
│   └── history-gate.md
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
│
├── wrangler.toml
├── package.json
└── README.md

---

7. Domain Model

Vehicle

interface Vehicle {
  vin: string;

  year: number;
  make: string;
  model: string;
  trim?: string;

  engine?: string;
  transmission?: string;
  drivetrain?: "FWD" | "RWD" | "AWD" | "4WD" | "UNKNOWN";

  mileage: number;

  firstSeenAt: string;
  lastSeenAt: string;

  historyStatus: HistoryStatus;

  accidentReported: boolean;
  damageReported: boolean;
  structuralDamage: boolean;
  airbagDeployment: boolean;
  totalLoss: boolean;
  salvageTitle: boolean;
  rebuiltTitle: boolean;
  floodDamage: boolean;
  lemonBuyback: boolean;
  odometerProblem: boolean;

  ownerCount?: number;

  valueScore?: number;
  maintenanceScore?: number;
  opportunityScore?: number;

  status: VehicleStatus;
}

---

8. History Status

enum HistoryStatus {
  UNKNOWN = "UNKNOWN",
  CLEAN_REPORTED = "CLEAN_REPORTED",
  CLEAN_VERIFIED = "CLEAN_VERIFIED",
  ACCIDENT = "ACCIDENT",
  DAMAGE = "DAMAGE",
  STRUCTURAL_DAMAGE = "STRUCTURAL_DAMAGE",
  TOTAL_LOSS = "TOTAL_LOSS",
  SALVAGE = "SALVAGE",
  REBUILT = "REBUILT",
  FLOOD = "FLOOD",
  LEMON = "LEMON",
  ODOMETER = "ODOMETER"
}

Important:

UNKNOWN != CLEAN

Unknown history does not pass the strict search.

---

9. History Gate

The history gate is a pure function.

interface HistoryDecision {
  eligible: boolean;
  status: HistoryStatus;
  reasons: string[];
}

Example:

function evaluateHistory(vehicle: Vehicle): HistoryDecision {

  const reasons: string[] = [];

  if (vehicle.accidentReported)
    reasons.push("Reported accident");

  if (vehicle.damageReported)
    reasons.push("Reported damage");

  if (vehicle.structuralDamage)
    reasons.push("Structural damage");

  if (vehicle.airbagDeployment)
    reasons.push("Airbag deployment");

  if (vehicle.totalLoss)
    reasons.push("Total loss");

  if (vehicle.salvageTitle)
    reasons.push("Salvage title");

  if (vehicle.rebuiltTitle)
    reasons.push("Rebuilt title");

  if (vehicle.floodDamage)
    reasons.push("Flood damage");

  if (vehicle.lemonBuyback)
    reasons.push("Manufacturer buyback");

  if (vehicle.odometerProblem)
    reasons.push("Odometer problem");

  if (vehicle.historyStatus === HistoryStatus.UNKNOWN)
    reasons.push("History not verified");

  return {
    eligible: reasons.length === 0,
    status: reasons.length === 0
      ? HistoryStatus.CLEAN_VERIFIED
      : vehicle.historyStatus,
    reasons
  };
}

---

10. History Evidence

History claims must have provenance.

interface HistoryEvidence {
  id: string;
  vin: string;

  provider: string;
  providerRecordId?: string;

  eventType: string;

  eventDate?: string;

  description?: string;

  sourceUrl?: string;

  retrievedAt: string;
}

Every history decision should be reproducible from stored evidence.

---

11. Inventory Source Adapter

Every inventory provider implements:

interface InventorySource {
  name: string;

  discover(
    criteria: SearchCriteria
  ): Promise<RawListing[]>;

  getListing?(
    url: string
  ): Promise<RawListing>;

  supportsIncrementalSync(): boolean;
}

Raw listings are converted to:

interface NormalizedListing {
  vin: string;

  year: number;
  make: string;
  model: string;
  trim?: string;

  mileage: number;
  price: number;

  dealerName: string;
  dealerCity: string;
  dealerState: string;

  listingUrl: string;

  source: string;

  discoveredAt: string;
  observedAt: string;
}

---

12. Source Priority

Initial priority:

1. Official dealer inventory
2. Permitted inventory APIs/feeds
3. Cars.com
4. AutoTrader
5. CarGurus
6. TrueCar
7. Other aggregators

The system MUST respect each source's terms, robots restrictions, authentication requirements, and API policies.

No source should be architecturally mandatory.

---

13. VIN Deduplication

VIN is the canonical vehicle identifier.

A vehicle may have multiple listings:

VIN 5TD...

    ├── Dealer
    ├── CarGurus
    ├── Cars.com
    └── AutoTrader

The database contains one vehicle record and multiple listing records.

This allows:

- duplicate detection
- price comparison
- source comparison
- listing history
- dealer identification
- disappearance detection

---

14. Database Schema

vehicles

CREATE TABLE vehicles (
  vin TEXT PRIMARY KEY,

  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,

  engine TEXT,
  transmission TEXT,
  drivetrain TEXT,

  mileage INTEGER NOT NULL,

  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,

  history_status TEXT NOT NULL DEFAULT 'UNKNOWN',

  accident_reported INTEGER NOT NULL DEFAULT 0,
  damage_reported INTEGER NOT NULL DEFAULT 0,
  structural_damage INTEGER NOT NULL DEFAULT 0,
  airbag_deployment INTEGER NOT NULL DEFAULT 0,
  total_loss INTEGER NOT NULL DEFAULT 0,
  salvage_title INTEGER NOT NULL DEFAULT 0,
  rebuilt_title INTEGER NOT NULL DEFAULT 0,
  flood_damage INTEGER NOT NULL DEFAULT 0,
  lemon_buyback INTEGER NOT NULL DEFAULT 0,
  odometer_problem INTEGER NOT NULL DEFAULT 0,

  owner_count INTEGER,

  value_score REAL,
  maintenance_score REAL,
  opportunity_score REAL,

  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

listings

CREATE TABLE listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  vin TEXT NOT NULL,

  source TEXT NOT NULL,

  dealer_name TEXT,
  dealer_city TEXT,
  dealer_state TEXT,

  price INTEGER NOT NULL,
  mileage INTEGER,

  listing_url TEXT NOT NULL,

  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,

  active INTEGER NOT NULL DEFAULT 1,

  FOREIGN KEY (vin) REFERENCES vehicles(vin)
);

price_history

CREATE TABLE price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  vin TEXT NOT NULL,

  price INTEGER NOT NULL,

  observed_at TEXT NOT NULL,

  source TEXT,

  FOREIGN KEY (vin) REFERENCES vehicles(vin)
);

history_evidence

CREATE TABLE history_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  vin TEXT NOT NULL,

  provider TEXT NOT NULL,
  provider_record_id TEXT,

  event_type TEXT NOT NULL,
  event_date TEXT,

  description TEXT,

  source_url TEXT,

  retrieved_at TEXT NOT NULL,

  FOREIGN KEY (vin) REFERENCES vehicles(vin)
);

rejection_events

CREATE TABLE rejection_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  vin TEXT NOT NULL,

  rejection_type TEXT NOT NULL,

  reason TEXT NOT NULL,

  source TEXT,

  created_at TEXT NOT NULL,

  FOREIGN KEY (vin) REFERENCES vehicles(vin)
);

watchlists

CREATE TABLE watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  name TEXT NOT NULL,

  criteria_json TEXT NOT NULL,

  created_at TEXT NOT NULL
);

---

15. Search Criteria

interface SearchCriteria {
  location: {
    latitude: number;
    longitude: number;
    radiusMiles: number;
  };

  priceMin?: number;
  priceMax?: number;

  mileageMax?: number;

  years?: {
    min?: number;
    max?: number;
  };

  makes?: string[];
  models?: string[];
  trims?: string[];

  drivetrains?: string[];

  requireCleanHistory: boolean;
  requireCleanTitle: boolean;

  maxOwners?: number;
}

---

16. Geographic Search

The initial default search area:

LaGrange, GA
Newnan, GA
Carrollton, GA
Peachtree City, GA

The system should ultimately use coordinates rather than city-name matching.

Distance:

distanceMiles(
  userLatitude,
  userLongitude,
  dealerLatitude,
  dealerLongitude
)

Vehicles outside the configured radius are excluded before scoring.

---

17. Value Engine

The value engine compares the vehicle to market peers.

Inputs:

Make
Model
Year
Trim
Mileage
Drivetrain
Region
Price

Example:

interface MarketComparison {
  askingPrice: number;
  estimatedMarketPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
  comparableCount: number;
}

Example:

Market average:       $25,800
Vehicle asking price: $23,400

Difference:           -$2,400
Difference:           -9.3%

---

18. Opportunity Score

Only history-approved vehicles may receive this score.

Initial weighting:

Market price advantage       30%
Mileage                      20%
Maintenance exposure        15%
Reliability/powertrain       15%
Age                           5%
Trim/equipment               10%
Dealer/listing quality        5%

Score range:

0–100

Interpretation:

90–100  Exceptional
80–89   Excellent
70–79   Strong
60–69   Fair
<60     Weak

---

19. Maintenance Engine

The maintenance engine estimates upcoming maintenance rather than merely looking at historical reliability.

interface MaintenanceRisk {
  score: number;

  upcomingItems: MaintenanceItem[];

  estimatedNearTermCost: number;

  confidence: "HIGH" | "MEDIUM" | "LOW";
}

Example:

Vehicle:
2019 Toyota Highlander
Mileage:
96,000

Potential upcoming:
90k service      completed
100k service     approaching
Brakes           unknown
Tires             unknown

Estimated near-term exposure:
$600–$1,500

Risk:
LOW

The system must distinguish:

Known due
Likely due
Possible due
Unknown

It must not invent service history.

---

20. Model-Specific Maintenance Rules

Rules are versioned.

interface MaintenanceRule {
  make: string;
  model: string;

  yearMin?: number;
  yearMax?: number;

  mileageThreshold?: number;

  description: string;

  estimatedCostLow: number;
  estimatedCostHigh: number;

  severity: "LOW" | "MEDIUM" | "HIGH";
}

Example:

Honda Pilot
Timing belt
~105k interval

Toyota Highlander
Model/year-specific service rules

Toyota RAV4
Model/year-specific service rules

Rules must be based on documented manufacturer schedules or verified service information.

---

21. Price History

Every observation creates a price-history record.

Example:

09/01   $26,995
09/04   $25,995
09/09   $24,995
09/13   $23,995

The UI should calculate:

Total reduction: $3,000
Reduction: 11.1%
Days listed: 12

This is a major component of deal identification.

---

22. Opportunity Events

The system generates events such as:

NEW_LISTING
PRICE_DROP
PRICE_DROP_MAJOR
BECAME_ELIGIBLE
HISTORY_CHANGED
LISTING_DISAPPEARED
MARKET_VALUE_CHANGED
DEAL_SCORE_CHANGED

---

23. History Change Detection

If a vehicle changes from:

CLEAN_REPORTED

to:

ACCIDENT

the system records:

HISTORY_CHANGED

and removes the vehicle from eligible rankings.

Similarly, if a listing says:

"No accidents"

but a later history check produces:

Reported accident

the vehicle receives:

HISTORY_DISCREPANCY

This should be prominently displayed.

---

24. Dashboard

The main dashboard displays:

VINScout

42 eligible vehicles
8 exceptional opportunities
13 new listings
6 price reductions

-------------------------------------

TOP OPPORTUNITIES

#1 Highlander XLE
$23,495
87,214 miles
Clean history
Value Score: 94

#2 Lexus RX 350
$22,900
91,202 miles
Clean history
Value Score: 91

Filters:

Price
Mileage
Distance
Year
Make
Model
Trim
AWD
Owners
Deal score
Maintenance risk
Days on market
Price reduction

---

25. Vehicle Detail

Display:

Vehicle
────────────────────────
2020 Toyota Highlander XLE AWD

$23,495
87,214 miles
Newnan, GA

HISTORY
────────────────────────
✓ No reported accidents
✓ No reported damage
✓ Clean title
✓ No salvage
✓ No flood
✓ No odometer issue
✓ 1 owner

VALUE
────────────────────────
Market:       $25,700
Asking:       $23,495
Difference:   -$2,205

MAINTENANCE
────────────────────────
Risk: LOW

Estimated near-term:
$500–$1,000

PRICE HISTORY
────────────────────────
$26,995
$25,995
$24,995
$23,495

SOURCES
────────────────────────
Dealer
CarGurus
Cars.com

ACTIONS
────────────────────────
[Open Listing]
[Watch]
[Reject]

---

26. Rejected Vehicle View

Rejected vehicles should remain searchable.

Example:

REJECTED

2017 Toyota 4Runner Limited

$19,147
187,854 miles

REASON

✕ Reported accident

Additional:
High mileage

Rejected:
09/13/2026

This provides historical intelligence and prevents the same vehicle from repeatedly appearing.

---

27. Alerts

Users can create rules:

WHEN

Vehicle passes history gate
AND
Price <= $23,000
AND
Mileage <= 110,000
AND
Opportunity score >= 85

THEN

Send alert

Alert channels initially:

Email
Web notification

Later:

SMS
Push notification

---

28. Scheduled Jobs

Cloudflare Cron:

*/30        Lightweight source refresh
Every 2h    Dealer inventory
Every 4h    Marketplace refresh
Daily       Market recalculation
Daily       History revalidation
Daily       Cleanup

Actual frequency should be adjusted according to source limits and terms.

The system must use incremental updates rather than repeatedly processing the entire inventory universe.

---

29. Discovery Algorithm

async function runDiscovery(criteria: SearchCriteria) {

  const sources = getEnabledSources();

  for (const source of sources) {

    const listings = await source.discover(criteria);

    for (const raw of listings) {

      const listing = normalize(raw);

      if (!listing.vin)
        continue;

      await upsertVehicle(listing);

      await upsertListing(listing);

      await recordPrice(listing);
    }
  }
}

---

30. Evaluation Algorithm

async function evaluateVehicle(vin: string) {

  const vehicle = await getVehicle(vin);

  const history = await verifyHistory(vehicle);

  await saveHistoryEvidence(history);

  const decision = evaluateHistory(vehicle);

  if (!decision.eligible) {

    await rejectVehicle(
      vin,
      decision.status,
      decision.reasons
    );

    return;
  }

  const market = await calculateMarketValue(vehicle);

  const maintenance =
    calculateMaintenanceRisk(vehicle);

  const score =
    calculateOpportunityScore(
      vehicle,
      market,
      maintenance
    );

  await updateVehicleScores(
    vin,
    score,
    maintenance
  );
}

---

31. Data Freshness

Every data element should contain timestamps.

Required:

discoveredAt
observedAt
lastSeenAt
historyCheckedAt
marketCalculatedAt

The UI should indicate:

Updated 12 minutes ago

rather than implying real-time data when it isn't.

---

32. Source Confidence

Every field should have an optional confidence level.

type Confidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

Example:

VIN             HIGH
Price           HIGH
Mileage         HIGH
Trim            MEDIUM
History         HIGH
Maintenance     MEDIUM
Market value    MEDIUM

---

33. Security

Secrets MUST NOT be stored in GitHub source code.

Use:

Cloudflare Worker Secrets
GitHub Actions Secrets

Examples:

HISTORY_API_KEY
MARKET_DATA_API_KEY
EMAIL_API_KEY

No API keys should be stored in D1.

---

34. API

GET /api/vehicles

Parameters:

minPrice
maxPrice
maxMileage
minYear
maxYear
make
model
trim
maxDistance
minScore

Returns eligible vehicles.

---

GET /api/vehicles/:vin

Returns:

Vehicle
Listings
History
Price history
Market analysis
Maintenance analysis
Score

---

POST /api/searches

Creates a saved search.

---

GET /api/searches

Returns saved searches.

---

POST /api/watchlist/:vin

Adds vehicle to watchlist.

---

DELETE /api/watchlist/:vin

Removes vehicle from watchlist.

---

35. Testing Requirements

Unit tests

Required for:

History gate
VIN normalization
Price normalization
Mileage normalization
Distance calculation
Scoring
Maintenance rules
Deduplication

Example:

test(
  "vehicle with accident fails history gate",
  () => {
    const vehicle = fixture({
      accidentReported: true
    });

    expect(
      evaluateHistory(vehicle).eligible
    ).toBe(false);
  }
);

---

36. Integration Tests

Test:

Source → normalization
Normalization → D1
D1 → history gate
History gate → scoring
Scoring → dashboard

Also test:

Same VIN from multiple sources

Expected:

1 vehicle
3 listings

not:

3 vehicles

---

37. CI/CD

GitHub Actions:

Push
  ↓
Install
  ↓
Lint
  ↓
TypeScript compile
  ↓
Unit tests
  ↓
Integration tests
  ↓
Build frontend
  ↓
Deploy Worker
  ↓
Deploy Pages

Production deployment should only occur after tests pass.

---

38. Observability

Track:

Listings discovered
Listings normalized
VINs extracted
Vehicles created
Vehicles updated
History checks
History failures
Rejected vehicles
Eligible vehicles
Scoring failures
Source failures
API latency

A source failure must not stop the entire pipeline.

Example:

CarGurus adapter: FAILED

Dealer adapters: OK
Cars.com adapter: OK
AutoTrader adapter: OK

The system continues operating.

---

39. Source Adapter Failure Handling

Each adapter has:

interface AdapterHealth {
  source: string;
  lastSuccessfulRun?: string;
  consecutiveFailures: number;
  lastError?: string;
}

After repeated failures:

DISABLED

until manually or automatically recovered.

---

40. Data Retention

Keep:

Current vehicle
Current listings
Price history
History evidence
Rejection events
Scoring history

Old listings should not immediately be deleted.

They provide valuable information about:

- days on market
- price reductions
- dealer behavior
- sold/disappeared vehicles
- recurring inventory

---

41. Privacy

MVP should not require sensitive personal information.

User profile contains only:

Search preferences
Saved searches
Watchlists
Notification preferences

No driver's license, financial account, payment information, or identity documents.

---

42. Cost Strategy

MVP should target:

GitHub                 $0
GitHub Actions          $0
Cloudflare Pages        $0
Cloudflare Workers      $0
Cloudflare D1           $0

At low volume.

The likely paid component is external data:

Vehicle history
Market valuation
Premium inventory APIs
Large-scale browser automation
Email/SMS

Therefore all external providers must be abstracted behind interfaces.

---

43. Provider Abstraction

History:

interface VehicleHistoryProvider {
  lookup(vin: string): Promise<VehicleHistory>;
}

Market valuation:

interface MarketValueProvider {
  getMarketValue(
    vehicle: Vehicle
  ): Promise<MarketValuation>;
}

Notification:

interface NotificationProvider {
  send(
    notification: Notification
  ): Promise<void>;
}

This prevents vendor lock-in.

---

44. MVP Acceptance Criteria

The MVP is complete when it can:

Discovery

- [ ] Import inventory from at least two sources
- [ ] Extract VIN
- [ ] Normalize price/mileage
- [ ] Identify dealer/location

Deduplication

- [ ] Combine identical VINs
- [ ] Maintain multiple listings

History

- [ ] Retrieve history evidence
- [ ] Reject accidents
- [ ] Reject damage
- [ ] Reject salvage
- [ ] Reject rebuilt
- [ ] Reject flood
- [ ] Reject total loss
- [ ] Reject lemon/buyback
- [ ] Reject odometer problems
- [ ] Reject unknown history

Ranking

- [ ] Calculate market value
- [ ] Calculate maintenance exposure
- [ ] Calculate opportunity score
- [ ] Rank eligible vehicles

Tracking

- [ ] Track price changes
- [ ] Track listing disappearance
- [ ] Track history changes
- [ ] Track days on market

UI

- [ ] Search
- [ ] Filter
- [ ] Rank
- [ ] Vehicle detail
- [ ] Rejected vehicles
- [ ] Watchlist

Automation

- [ ] Scheduled discovery
- [ ] Scheduled evaluation
- [ ] New-deal alerts

---

45. Phase 2 Features

After MVP:

VIN decoding
OEM maintenance schedules
Tire/brake estimation
Dealer negotiation analysis
Price-drop prediction
Days-on-market prediction
Comparable vehicle clustering
Regional price heat maps
VIN history discrepancy detection
Dealer markup detection

---

46. Phase 3 — Personal Deal Assistant

The system can eventually answer:

«"Should I drive to Newnan to look at this?"»

with:

YES

Why:
• 9.2% below market
• clean history
• one owner
• 82k miles
• low maintenance exposure
• price reduced twice
• 17 days on market
• 8 comparable vehicles are more expensive

Recommended offer:
$21,800

Likely acceptable:
$22,300

Walk-away:
$23,000

That is the ultimate product objective.

---

47. Architectural Principle

The application should never confuse:

CHEAP

with:

GOOD DEAL

The system's job is to identify:

CLEAN
+
RELIABLE
+
APPROPRIATE
+
LOW MAINTENANCE EXPOSURE
+
UNDER MARKET
=
OPPORTUNITY

A vehicle with a major accident can be $5,000 below market and still receive:

OPPORTUNITY SCORE:
N/A

STATUS:
REJECTED

That behavior is intentional.

---

48. Recommended First Implementation

Build in this order:

1. Repository — ✅ Done
2. D1 schema — ✅ Done (`migrations/0001_initial.sql` through `0004_listing_photo_count.sql`). Applied to both local and production D1.
3. Domain models — ✅ Done (`packages/domain`)
4. History gate — ✅ Done, unit tested (`packages/scoring/src/historyGate.ts`)
5. Vehicle/listing API — ✅ Done for the current feature set. `GET /api/vehicles` (ranked, scored vehicles), `GET /api/vehicles/:vin`, `GET /api/vehicles/:vin/evidence`, `GET /api/review-queue`, and `PATCH /api/vehicles/:vin/history` (`apps/worker/src/api/`) are all live and backed by real D1 data. No watchlist endpoints yet (step 16).
6. React dashboard — 🟡 Partial. Two working sections (`apps/web`): a ranked "Opportunities" table (filterable by make/price/mileage, click a row for a detail view with price, dealer, listing link, score breakdown, and the full history evidence log) and a "Needs Review" queue with surfaced history-report links and an interactive verification form. No watchlists yet.
7. One inventory adapter — ✅ Done. `AutoDevInventorySource` (`packages/adapters/src/autoDevSource.ts`) pulls real listings from Auto.dev's licensed Vehicle Listings API (free tier, spec §12 priority 2), including any Carfax link the dealer published — verified end-to-end against production-schema local D1 with real vehicles from real dealers, all correctly `REJECTED` pending manual history review. AutoNation was evaluated and rejected as a scrape target (`robots.txt` disallows the search endpoint, and the site runs active bot detection) — see `docs/data-sources.md`. `FixtureInventorySource` remains for local pipeline testing, gated off in production.
8. VIN deduplication — ✅ Done. `apps/worker/src/jobs/persistListing.ts` upserts one `vehicles` row per VIN and one `listings` row per (VIN, source, URL); verified idempotent — rerunning discovery doesn't create duplicate rows or spurious price-history entries.
9. History provider abstraction — 🟡 Partial, deliberately manual. No free/legal automatable history API exists (NMVTIS costs per-lookup via approved providers; Carfax/AutoCheck are paid; NICB VINCheck's terms don't allow automation) — see `docs/history-gate.md`. Instead: any Carfax/AutoCheck link a dealer publishes on their own listing is auto-surfaced as `HistoryEvidence` (`recordHistoryReportLink`), never auto-fetched.
10. History verification — ✅ Done, as a human-in-the-loop step. `PATCH /api/vehicles/:vin/history` (`apps/worker/src/history/verifyHistory.ts`) takes a person's manual review, re-runs the real history gate, and persists the result + an audit-trail evidence row. Surfaced in the dashboard's "Needs Review" section.
11. Market-value engine — ✅ Done, v1. `estimateMarketValue`/`marketPriceAdvantageScore` (`packages/scoring/src/marketValue.ts`) average comparable prices within a ±30% mileage band and map to a 0-100 sub-score; `apps/worker/src/scoring/computeMarketValue.ts` wires it to D1 (same make/model, ±1 model year) and writes `vehicles.value_score` right after history verification. Verified against real Auto.dev inventory (three 2017 Jeep Wranglers). Not yet refreshed as new comparables arrive later.
12. Maintenance engine — ✅ Done, v1 rule set. `evaluateMaintenanceRisk` (`packages/scoring/src/maintenanceRules.ts`) matches a small, intentionally conservative `MaintenanceRule` set (two generic wear items always shown as `UNKNOWN` dueness, matching the spec's own worked example, plus one well-documented model-specific rule) and produces a 0-100 sub-score. `apps/worker/src/maintenance/computeMaintenanceRisk.ts` writes it to `vehicles.maintenance_score`, triggered alongside the value engine right after history verification. Confidence is always `LOW` — no VIN-specific service records exist. Verified against the spec's own Highlander example (scores 96) and confirmed the Honda Pilot timing-belt rule's year range correctly excludes newer generations.
13. Opportunity scoring — ✅ Done. All 7 factors now compute for real (`apps/worker/src/scoring/computeOpportunityScore.ts`): market price advantage and maintenance exposure from steps 11-12, mileage and age from simple pure functions, reliability/powertrain from NHTSA's free public Recalls API (recall count as a rough proxy — see `docs/scoring.md`), trim/equipment from a naming-convention heuristic, and dealer/listing quality from Auto.dev's photo count. Verified end-to-end against real Auto.dev inventory: two real vehicles produced correct `opportunity_score`s and appeared correctly ranked in `GET /api/vehicles` — the "Opportunities" dashboard list is no longer permanently empty.
14. Second/third inventory adapters — ⬜ Not started
15. Cron scheduling — ✅ Done. `apps/worker/wrangler.toml`'s Cron Trigger (every 6 hours) runs `discoverListings` against the live Auto.dev source in production — confirmed pulling real inventory into production D1. The fixture source remains registered-but-gated-off there (`ENABLE_FIXTURE_SOURCE=false`).
16. Alerts — ⬜ Not started
17. Price-history analytics — ⬜ Not started

The history gate should be implemented before the scoring engine. This guarantees the architecture cannot accidentally rank an accident vehicle as a superior bargain. That invariant is enforced in code today: `scoreOpportunity` refuses to return a score when the history gate's decision is ineligible.
