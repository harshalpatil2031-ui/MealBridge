# MealBridge API Contract — A-01

**Version:** 1.0 (hackathon prototype)  
**Purpose:** Shared frontend/backend contract for the four parallel workstreams.  
**Base URL (local):** `http://localhost:8000`  
**Format:** JSON; UTF-8; datetimes are ISO-8601 with timezone, preferably UTC (`Z`).

> This document freezes routes and JSON shapes for tonight's implementation. If a change is necessary, discuss it with all four owners before changing this file.

## Prototype constraints that affect the contract

The current SQLite schema is the contract's storage basis. It has no dedicated recipient availability, transport, meal safety, per-recipient acceptance for a normal (non-rescue) match, or donor handover confirmation fields. For this prototype:

- `users.capacity` is the recipient's stated maximum meals per pickup for this demo; it is **not** live inventory or current remaining capacity.
- There is no stored live availability field. For the first version, seeded recipients are treated as available for matching. The response labels availability as assumed/demo availability. Registration availability cannot be changed until schema support is added.
- Deadline feasibility means only “the deadline is still in the future.” Travel-time estimation and food-safety certification are out of scope; the UI must not claim them.
- Match ranking is deterministic and rule-based. It is not machine learning and must not be labeled “AI match score.”
- The API authenticates accounts with hashed passwords and revocable 12-hour bearer sessions. Server-side role and record ownership checks control protected routes; clients must not choose a role or submit actor IDs as authority.
- New self-service accounts can be donors or recipients. Coordinator access is restricted to seeded coordinator accounts. Demo accounts have separate role-specific credentials documented in `README.md`.
- `RESCUED` means recipient handover confirmations cover the full donation quantity. The prototype does not collect an independent donor confirmation, so do not claim dual-party confirmation.

## Shared response conventions

### Error object

```json
{
  "detail": "Pickup deadline must be in the future."
}
```

Use `400` for invalid input, `404` for unknown donation/user, and `409` for a validly formed request that conflicts with the current donation/split state. For unexpected server errors return a generic message; do not return SQL, credentials or stack traces.

### IDs and timestamps

- New donation IDs: unique strings such as `D-20261016-<random>`; event, rescue and split IDs are unique strings. Do not reuse seed IDs.
- Timestamps returned by the API use UTC ISO-8601, e.g. `2026-10-16T12:30:00Z`.
- Existing seeded timestamp strings may use `+00:00`; clients should parse either form.
- `latitude`/`longitude` are decimal degrees. `quantity` and `confirmed_quantity` are positive integers. The client sends a single `unit` (`meals` or `portions`) consistently for one donation.

### Core status lifecycle

```text
POST /donations         -> PENDING
POST /match (selected)  -> MATCHED
POST /cancel            -> RESCUE_TRIGGERED
recovery impossible     -> FAILED
all assigned quantity handed over -> RESCUED
```

`accept` is recorded as an event and split status where applicable; the `donations.status` CHECK constraint does not include `ACCEPTED`. For a normal single-recipient handover, status remains `MATCHED` until handover, then becomes `RESCUED`. For rescue, status remains `RESCUE_TRIGGERED` while any split is pending/accepted and becomes `RESCUED` only after confirmed quantities sum to donation quantity.

## Data shapes

### Donation summary

```json
{
  "id": "D-20261016-A1B2C3",
  "donor_id": "U-D01",
  "donor_name": "Sunrise Hostel",
  "food_name": "Cooked Meals",
  "quantity": 80,
  "unit": "meals",
  "status": "MATCHED",
  "created_at": "2026-10-16T12:30:00Z",
  "pickup_deadline": "2026-10-16T14:00:00Z",
  "latitude": 18.5074,
  "longitude": 73.8077,
  "matched_recipient_id": "U-R01",
  "matched_recipient_name": "Asha Trust",
  "confidence": null,
  "notes": "Vegetarian, packed in containers"
}
```

`confidence` is nullable and should remain null unless the implementation has a defined, defensible meaning. Do not copy a mock confidence label into a live response.

### Recipient

```json
{
  "id": "U-R01",
  "name": "Anita Desai",
  "organization": "Asha Trust",
  "organization_type": "NGO",
  "location": "Karve Nagar, Pune",
  "latitude": 18.4912,
  "longitude": 73.8245,
  "capacity": 100,
  "available": true,
  "availability_basis": "demo_assumption"
}
```

The `available` value is an explicit demo assumption: no availability field exists in SQLite. UI should show a compact “availability assumed for demo” note if availability affects an important decision.

### Event

```json
{
  "id": "T-D-20261016-A1B2C3-01",
  "donation_id": "D-20261016-A1B2C3",
  "event_type": "MATCHED",
  "description": "Matched with Asha Trust",
  "occurred_at": "2026-10-16T12:31:00Z",
  "actor_id": "U-C01",
  "metadata": {
    "recipient_id": "U-R01",
    "distance_km": 2.1,
    "rule": "eligible capacity; shortest distance among eligible recipients"
  }
}
```

### Split

```json
{
  "id": "RS-D-20261016-A1B2C3-01",
  "rescue_id": "R-D-20261016-A1B2C3",
  "recipient_id": "U-R01",
  "recipient_name": "Asha Trust",
  "quantity": 50,
  "status": "PROPOSED",
  "accepted_at": null,
  "handover_at": null
}
```

Allowed split statuses: `PROPOSED`, `ACCEPTED`, `HANDED_OVER`, `DECLINED`. Existing seeded rows use `ACCEPTED` and `HANDED_OVER`.

## Endpoints

### Authentication

`POST /auth/register` accepts `{name, organization, email, password, role, location, capacity?}`. Public registration only permits `donor` or `recipient`; recipient accounts must include a positive `capacity`. On success it returns an access token and the new public user profile.

`POST /auth/login` accepts `{email, password}` and returns `{access_token, token_type, expires_at, user}`. The role is read from the account record; there is no client-selected role.

Send `Authorization: Bearer <access_token>` on protected routes. `GET /auth/me` returns the current user's public profile. `POST /auth/logout` revokes the current session. Missing or expired sessions return **401**; role or ownership violations return **403** (or **404** for a record the user cannot view).

`GET /recipients` is limited to donors and coordinators. `GET /donations` returns all records to coordinators, the caller's own records to donors, and only assigned/rescue-split records to recipients. An optional `donor_id` filter is coordinator-only, or may match the authenticated donor's own ID.

### `GET /health`

No request body.

**200**

```json
{"status":"ok"}
```

### `GET /recipients`

No request body. Return only users with role `recipient`, ordered by organization. Never return email or `password_hash`.

**200**

```json
{
  "items": [
    {
      "id": "U-R01",
      "name": "Anita Desai",
      "organization": "Asha Trust",
      "organization_type": "NGO",
      "location": "Karve Nagar, Pune",
      "latitude": 18.4912,
      "longitude": 73.8245,
      "capacity": 100,
      "available": true,
      "availability_basis": "demo_assumption"
    }
  ]
}
```

### `GET /donations`

Role-scoped to the authenticated account as described above. Order newest first. Join organization names. Return `items` even when empty.

**200**

```json
{"items": [/* Donation summary objects */]}
```

Unknown `donor_id` → **404** `{"detail":"Donor not found."}`.

### `GET /donations/{donation_id}`

Return one donation with ordered events, current rescue (if any), and splits, only when the authenticated user owns or is assigned to the record (or is a coordinator).

**200**

```json
{
  "donation": {/* Donation summary */},
  "events": [/* Event objects, ascending occurred_at */],
  "rescue": {
    "id": "R-D-20261016-A1B2C3",
    "original_recipient_id": "U-R02",
    "original_recipient_name": "Hope Kitchen",
    "status": "IN_PROGRESS",
    "triggered_at": "2026-10-16T12:34:00Z",
    "reason": "Vehicle unavailable"
  },
  "splits": [/* Split objects; [] if no rescue */]
}
```

No rescue → `rescue: null`, `splits: []`. Unknown donation → **404**.

### `POST /donations`

Create a donation and its `CREATED` event in one transaction. Donors only may create donations. The donor ID is taken from the authenticated session. The API chooses the ID, creation time and initial status; client must not send them.

**Request**

```json
{
  "food_name": "Cooked Meals",
  "quantity": 80,
  "unit": "meals",
  "pickup_deadline": "2026-10-16T14:00:00Z",
  "latitude": 18.5074,
  "longitude": 73.8077,
  "notes": "Vegetarian, packed in containers"
}
```

`notes` may be null or omitted.

**201**

```json
{
  "donation": {/* newly saved Donation summary, status PENDING */},
  "event": {/* CREATED event */}
}
```

Validation: authenticated role is donor; food name non-empty; quantity positive integer; unit non-empty; deadline valid and in future; coordinates in legal latitude/longitude range. Invalid data → **400**.

### `POST /donations/{donation_id}/match`

Calculate eligible candidates from stored recipient coordinates/capacity and donation deadline. Persist selected recipient, set status `MATCHED`, and insert a `MATCHED` event if a full-quantity recipient is eligible. Candidate distance is Haversine straight-line distance, not driving distance. Exclude recipients treated as unavailable by the demo rule (initially none) and candidates whose capacity is below full quantity or whose pickup deadline has expired.

**Request**

```json
{"actor_id":"U-C01"}
```

Donor sessions may match only their own donations; coordinators may match any pending donation. Actor attribution comes from the session; `actor_id` in the request, if supplied for backwards compatibility, is ignored.

**200 with selected match**

```json
{
  "donation": {/* updated summary, status MATCHED */},
  "selected_recipient": {/* Recipient object */},
  "candidates": [
    {
      "recipient": {/* Recipient object */},
      "distance_km": 2.1,
      "capacity_fit": "FULL",
      "eligible": true,
      "rank": 1,
      "score": 92,
      "reasons": ["Capacity covers 80 meals", "2.1 km straight-line distance", "Deadline is in the future"]
    }
  ],
  "matching_method": "rule_based"
}
```

Score is a reproducible 0–100 **heuristic for ranking**, not model confidence: document exact formula/weights in code and metadata; never call it AI/ML. Candidate result includes only full-quantity eligible matches. If no full match exists, return **200** with `selected_recipient: null`, `candidates: []`, `matching_method: "rule_based"`, and `no_match_reason`; keep donation `PENDING` so coordinator/user can trigger rescue planning or report no match. Unknown donation → **404**; non-PENDING state → **409**.

### `POST /donations/{donation_id}/cancel`

Record a cancellation/failure of the primary match and create a recovery plan. Do not mark recipient split rows accepted: the plan is proposed until recipients accept.

**Request**

```json
{
  "recipient_id": "U-R04",
  "reason": "Vehicle unavailable",
  "actor_id": "U-C01"
}
```

Recipient sessions may cancel only their own current primary assignment. Coordinator sessions may initiate the same recovery flow. Actor attribution comes from the session. `reason` is required.

**200 with feasible recovery**

```json
{
  "donation": {/* status RESCUE_TRIGGERED */},
  "rescue": {
    "id": "R-D-20261016-A1B2C3",
    "status": "IN_PROGRESS",
    "reason": "Vehicle unavailable"
  },
  "recovery_plan": {
    "feasible": true,
    "strategy": "SPLIT",
    "total_quantity": 80,
    "splits": [
      {"id":"RS-D-20261016-A1B2C3-01","recipient_id":"U-R01","recipient_name":"Asha Trust","quantity":50,"status":"PROPOSED"},
      {"id":"RS-D-20261016-A1B2C3-02","recipient_id":"U-R02","recipient_name":"Hope Kitchen","quantity":30,"status":"PROPOSED"}
    ],
    "explanation": "No single eligible recipient has capacity for 80 meals; these capacities cover the full quantity."
  },
  "events": [/* newly recorded failure and rescue-plan events */]
}
```

`strategy` is `ALTERNATIVE` when one recipient can take all, `SPLIT` when multiple recipients are needed. Split quantities must sum exactly to `total_quantity`; each quantity must be within recipient capacity. Calculate combinations deterministically (e.g. fewest recipients, then shortest total straight-line distance, then stable ID order).

**200 with infeasible recovery**

```json
{
  "donation": {/* status FAILED or RESCUE_TRIGGERED, consistently chosen by implementation */},
  "rescue": {"id":"R-D-20261016-A1B2C3","status":"FAILED","reason":"Vehicle unavailable"},
  "recovery_plan": {
    "feasible": false,
    "strategy": null,
    "total_quantity": 80,
    "splits": [],
    "explanation": "Available recipient capacities cannot cover the full 80 meals before the deadline."
  },
  "events": [/* failure and failed-recovery events */]
}
```

The issue implementation must choose one consistent donation status for infeasible recovery. Recommended: `FAILED`, because no recovery remains active. Never return a success-like plan when `feasible` is false. Unknown donation → **404**; wrong recipient/current status → **409**.

### `POST /donations/{donation_id}/accept`

Record an eligible recipient's acceptance. For ordinary `MATCHED` donations, recipient must equal `matched_recipient_id` and `split_id` is omitted. For a rescue split, recipient and split must belong to that donation and split must be `PROPOSED`.

**Request — ordinary match**

```json
{"recipient_id":"U-R01","actor_id":"U-R01"}
```

**Request — rescue split**

```json
{"recipient_id":"U-R01","split_id":"RS-D-20261016-A1B2C3-01","actor_id":"U-R01"}
```

The server derives actor attribution from the authenticated recipient session and ignores `actor_id` if supplied for backwards compatibility. **200** returns `{"donation":{/*summary*/},"split":{/*split or null*/},"event":{/*event*/}}`. Record `RECIPIENT_ACCEPTED`; for split, set split status `ACCEPTED` and `accepted_at`. Donation status remains `MATCHED` for ordinary acceptance or `RESCUE_TRIGGERED` for rescue acceptance; neither implies pickup/handover. Invalid participant/status → **409**.

### `POST /donations/{donation_id}/handover`

Record a recipient-confirmed physical handover. This demo endpoint records recipient confirmation only; it does not independently verify proof or collect donor confirmation.

**Request — ordinary match**

```json
{
  "recipient_id":"U-R01",
  "confirmed_quantity":80,
  "actor_id":"U-R01"
}
```

**Request — rescue split**

```json
{
  "recipient_id":"U-R01",
  "split_id":"RS-D-20261016-A1B2C3-01",
  "confirmed_quantity":50,
  "actor_id":"U-R01"
}
```

The server derives actor attribution from the authenticated recipient session and ignores `actor_id` if supplied for backwards compatibility. Handover requires the ordinary match/split to be accepted first; it must belong to this donation and recipient. Reject duplicate handover, non-positive quantity or confirmed amount above assigned amount with **409/400**. For rescue, only mark a split `HANDED_OVER` when the assigned quantity is confirmed. The schema has one `handover_at` per split, so partial handover is unsupported: require `confirmed_quantity == assigned quantity` in this version.

**200**

```json
{
  "donation": {/* updated summary; RESCUED only when all assigned amounts handed over */},
  "split": {/* updated split, or null for ordinary match */},
  "confirmed_total": 50,
  "required_total": 80,
  "rescued": false,
  "event": {/* HANDOVER_CONFIRMED event */}
}
```

When all required portions are handed over, return `rescued: true`, donation status `RESCUED`, and set rescue status `COMPLETED`. Record an event with confirmed quantity/unit. For ordinary match, the matched recipient confirms the whole donation; `confirmed_total == required_total`, so status becomes `RESCUED`.

## Rule-based matching and split logic (implementation guidance)

- Haversine distance is an approximation using straight-line coordinates. Display “approx. distance,” not driving distance/ETA.
- Eligible full match: recipient's stored capacity ≥ donation quantity and donation deadline remains in the future.
- Suggested transparent ranking score: `100 - min(distance_km * 5, 50) + min(capacity_surplus / donation_quantity * 10, 10)` then clamp 0–100. Alternatively use rank by shortest distance then least excess capacity. Pick one, implement it in A-03, and explain it in `reasons`; do not expose a score as a probability.
- Rescue planning should first pick one remaining eligible recipient with enough capacity. Otherwise search capacity combinations over the five seeded recipients; choose the smallest combination with total capacity ≥ quantity, stable tie-break by distance/ID; allocate portions without exceeding capacities and with portions summing exactly to quantity.
- Filter out failed recipient and reject any plan computed after pickup deadline. Since travel/safety data are absent, the API cannot promise arrival by deadline; state this limitation in presentation/demo.
- The current schema's `rescues` table permits one rescue per donation only if implementation chooses to enforce that; `GET detail` should return the latest/active rescue or document the chosen behavior.

## Frontend function names (for Person B's shared client)

Person B should export these functions from `frontend/src/api/donations.js`; Person C/D import them without editing the client:

```js
getRecipients()
getDonations({ donorId })          // omit donorId to fetch all
getDonation(donationId)
createDonation(payload)
matchDonation(donationId, payload = {})
cancelDonation(donationId, payload)
acceptDonation(donationId, payload)
confirmHandover(donationId, payload)
```

Each returns parsed JSON or throws an Error with the server `detail` string.

## Required implementation handoff from A-01

1. Person A posts: “A-01 contract ready; API contract is `backend/API_CONTRACT.md`; routes use `donationId` query parameter.”
2. B confirms client function names above. C/D use these function names and paths in their page code; no parallel API clients.
3. If a mismatch or missing field appears, raise it in the team chat. Only change the contract after all four agree, and update all affected issue owners at once.

## A-01 acceptance checklist

- [ ] Contract file is committed and contains every route, payload, response, error and state transition.
- [ ] JSON uses existing SQLite columns or clearly documents any response-only demo assumptions.
- [ ] Scoring, availability, split and handover constraints are explicit and explainable.
- [ ] Frontend owners confirm they can implement without guessing.
- [ ] Contract has been communicated to all teammates before they open integration PRs.
