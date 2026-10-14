# 🐛 MealBridge — GitHub Issues Tracker
**Team NovaNexus · PRISM 26 Socithon**  
This file tracks every issue/task to complete for the MealBridge prototype. Each issue maps to a GitHub Issue you should create in the repo.

> **Labels used:** `frontend` `backend` `ml` `ai` `infra` `bug` `priority:high` `priority:medium` `priority:low`

---

## 🔴 MILESTONE 1 — Project Setup & Foundation
> Must be done first. Everything else depends on this.

---

### Issue #1 — Initialize Monorepo Structure
**Labels:** `infra` `priority:high`  
**Assignee:** Backend Lead / Any

**Description:**  
Set up the project folder structure so all teammates can work without conflicts.

**Tasks:**
- [ ] Create `/frontend` folder and initialize Vite + React app (`npm create vite@latest`)
- [ ] Create `/backend` folder and initialize FastAPI project
- [ ] Create `/docs` folder and move `PRISM26_Feature_Guide.md` and `ISSUES.md` into it
- [ ] Create root `.gitignore` covering `node_modules/`, `__pycache__/`, `.env`, `*.db`, `pptx_extracted/`
- [ ] Create root `README.md` (already done ✅)
- [ ] Create `LICENSE` file (MIT)

**Acceptance Criteria:**
- Repo can be cloned fresh and both `npm install` and `pip install -r requirements.txt` run without errors

---

### Issue #2 — Backend: FastAPI Project Scaffold
**Labels:** `backend` `priority:high`  
**Assignee:** Backend Dev

**Description:**  
Set up the FastAPI backend with folder structure, database connection, and basic health check route.

**Tasks:**
- [ ] Create `backend/main.py` with FastAPI app and CORS config
- [ ] Create `backend/database.py` with SQLite connection using SQLAlchemy
- [ ] Create `backend/models/` folder with base model classes
- [ ] Create `backend/routers/` folder (empty for now)
- [ ] Create `backend/requirements.txt` with: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `python-jose`, `passlib`, `python-multipart`
- [ ] Add `GET /health` route returning `{"status": "ok"}`
- [ ] Test: `uvicorn main:app --reload` runs cleanly

---

### Issue #3 — Frontend: React + Vite + Tailwind Setup
**Labels:** `frontend` `priority:high`  
**Assignee:** Frontend Lead

**Description:**  
Set up the React frontend with routing, Tailwind CSS, and a base layout component.

**Tasks:**
- [ ] Initialize Vite + React in `/frontend`
- [ ] Install and configure Tailwind CSS
- [ ] Install React Router (`react-router-dom`)
- [ ] Install Axios for API calls
- [ ] Create `src/layouts/AppLayout.jsx` — sidebar + topbar shell
- [ ] Create `src/pages/` folder with placeholder pages: `LandingPage`, `LoginPage`, `DonorDashboard`, `RecipientDashboard`, `CoordinatorDashboard`
- [ ] Set up routing in `src/App.jsx`
- [ ] Add Google Font (Inter or Outfit) to `index.html`
- [ ] Test: `npm run dev` serves app on `localhost:5173`

---

## 🔴 MILESTONE 2 — Authentication & User Roles
> Users must be able to register and log in before anything else works.

---

### Issue #4 — Backend: User Model & Auth Routes
**Labels:** `backend` `priority:high`  
**Assignee:** Backend Dev

**Description:**  
Create the User database model and authentication endpoints.

**Database Schema — `users` table:**
```
id, name, email, password_hash, role (donor/recipient/coordinator),
org_name, location_lat, location_lng, capacity (recipients only),
created_at
```

**API Endpoints to build:**
- [ ] `POST /auth/register` — create a new user with role
- [ ] `POST /auth/login` — returns JWT access token
- [ ] `GET /auth/me` — returns current user info (requires token)

**Tasks:**
- [ ] Create `backend/models/user.py` with SQLAlchemy model
- [ ] Create `backend/routers/auth.py` with above 3 routes
- [ ] Implement password hashing with `passlib[bcrypt]`
- [ ] Implement JWT creation and verification with `python-jose`
- [ ] Create `backend/dependencies.py` with `get_current_user` dependency

**Acceptance Criteria:**
- Can register a donor, recipient, and coordinator with different roles
- Login returns a valid JWT
- Protected routes reject requests without a valid token

---

### Issue #5 — Frontend: Login & Register Pages
**Labels:** `frontend` `priority:high`  
**Assignee:** Frontend Dev (any)

**Description:**  
Build the login and registration screens with role selection.

**Tasks:**
- [ ] Build `LoginPage.jsx` — email + password form, login button
- [ ] Build `RegisterPage.jsx` — name, org name, email, password, **role selector** (Donor / Recipient / Coordinator), location input
- [ ] Add capacity field that only appears when role = Recipient
- [ ] Store JWT token in `localStorage` after successful login
- [ ] Create `src/context/AuthContext.jsx` to hold user state globally
- [ ] Redirect to correct dashboard after login based on role
- [ ] Show error messages for invalid credentials
- [ ] Style both pages with Tailwind (dark mode, clean card design)

---

## 🔴 MILESTONE 3 — Donation Core Flow
> The fundamental feature: logging a donation and seeing it matched.

---

### Issue #6 — Backend: Donation Model & CRUD Routes
**Labels:** `backend` `priority:high`  
**Assignee:** Backend Dev

**Description:**  
Create the Donation database model and all API routes for creating and reading donations.

**Database Schema — `donations` table:**
```
id, donor_id, food_type, quantity_meals, ready_time, deadline,
location_lat, location_lng, status (PENDING/MATCHED/ACCEPTED/
IN_TRANSIT/RESCUE_TRIGGERED/RESCUED/FAILED), notes, created_at
```

**API Endpoints:**
- [ ] `POST /donations/` — donor creates a new donation
- [ ] `GET /donations/` — list all donations (coordinator)
- [ ] `GET /donations/my` — list donor's own donations
- [ ] `GET /donations/{id}` — get single donation detail
- [ ] `PATCH /donations/{id}/status` — update donation status
- [ ] `GET /donations/nearby` — list donations near a recipient's location

---

### Issue #7 — Frontend: New Donation Form (Donor)
**Labels:** `frontend` `priority:high`  
**Assignee:** Donor UI Dev

**Description:**  
Build the form donors use to log a surplus food donation.

**Form Fields:**
- Food type (text or dropdown: Cooked Meals / Packaged / Raw Produce / Baked Goods)
- Estimated quantity (number input — in meals/portions)
- Ready time (datetime picker)
- Collection deadline (datetime picker)
- Location (pre-filled from profile, editable)
- Notes (optional textarea)

**Tasks:**
- [ ] Build `NewDonationForm.jsx` component
- [ ] Wire form to `POST /donations/` API
- [ ] Show success state after submission with donation ID
- [ ] Show **AI surplus prediction badge** on the form (see Issue #11)
- [ ] Add form validation (required fields, deadline must be after ready time)

---

### Issue #8 — Frontend: Donor Dashboard
**Labels:** `frontend` `priority:high`  
**Assignee:** Donor UI Dev

**Description:**  
Main dashboard for donors showing their active and past donations.

**Tasks:**
- [ ] Build `DonorDashboard.jsx` page
- [ ] Show **Active Donation Card** for each live donation:
  - Food type, quantity, status badge (colour-coded)
  - Matched recipient name (if matched)
  - Countdown timer to deadline
  - AI prediction badge
- [ ] "Log New Donation" button → opens `NewDonationForm`
- [ ] **Donation History Table** — past donations with status and rescue outcome
- [ ] **Impact Stats Row** — total meals donated, rescue rate, NGOs helped
- [ ] Fetch data from `GET /donations/my`

---

### Issue #9 — Frontend: Recipient Dashboard
**Labels:** `frontend` `priority:high`  
**Assignee:** Recipient UI Dev

**Description:**  
Main dashboard for recipients to browse and accept donations.

**Tasks:**
- [ ] Build `RecipientDashboard.jsx` page
- [ ] **Available Donations Feed** — cards sorted by distance showing:
  - Food type, quantity, donor org name
  - Distance from recipient, deadline
  - "Accept" button
- [ ] **My Accepted Pickups** section — donations accepted by this recipient
  - Status badge, pickup time, "Mark as Collected" button
- [ ] Fetch available donations from `GET /donations/nearby`
- [ ] Wire "Accept" to `PATCH /donations/{id}/status` → status = ACCEPTED

---

## 🔴 MILESTONE 4 — Matching Engine
> The system must automatically match donors to recipients.

---

### Issue #10 — Backend: Recipient Matching Engine
**Labels:** `backend` `ml` `priority:high`  
**Assignee:** ML Dev / Backend Dev

**Description:**  
Build the intelligent matching algorithm that ranks eligible recipients for a new donation.

**Matching Algorithm:**

Score each recipient using weighted factors:

| Factor | Weight | Logic |
|---|---|---|
| Capacity | 30% | `min(recipient_capacity / donation_quantity, 1.0)` |
| Distance | 25% | `1 - (distance_km / max_distance)` |
| Availability | 20% | Is recipient available in the pickup window? (1 or 0) |
| Deadline fit | 15% | Does deadline allow enough time for pickup? |
| Past success | 10% | Recipient's historical pickup confirmation rate |

**Tasks:**
- [ ] Create `backend/ml/matching.py` with `score_recipient()` and `get_top_matches()` functions
- [ ] Use Haversine formula for distance calculation
- [ ] Create `backend/models/match.py` — `matches` table: `donation_id, recipient_id, rank, score, status`
- [ ] Create `POST /donations/{id}/match` — triggers matching, stores top 3 results
- [ ] Create `GET /donations/{id}/matches` — returns ranked matches
- [ ] Auto-trigger matching when a new donation is created (call from donation POST route)

**Acceptance Criteria:**
- Creating a donation automatically creates match records
- Top match is returned with a score and explanation of ranking factors

---

### Issue #11 — Backend + Frontend: AI Surplus Prediction
**Labels:** `backend` `ml` `frontend` `priority:high`  
**Assignee:** ML Dev

**Description:**  
Build the surplus food prediction model using historical data.

**Model:**
- Input: day_of_week, meal_type, past 7-day surplus average, event flag
- Model: Linear Regression or Random Forest (scikit-learn)
- Output: Predicted surplus quantity (integer, meals)
- For prototype: seed with mock historical data for 3–5 sample donors

**Tasks:**
- [ ] Create `backend/ml/prediction.py` with `predict_surplus(donor_id, meal_type, datetime)` function
- [ ] Create mock training data CSV for 3 sample donors (30 rows each)
- [ ] Train and save model as `surplus_model.pkl`
- [ ] Create `GET /donors/{id}/prediction?meal_type=lunch&date=2025-01-15` API route
- [ ] Frontend: Show prediction badge on Donor Dashboard and New Donation Form
  - Format: "🤖 AI Estimate: ~42 portions" with confidence bar (Low/Medium/High)

---

## 🔴 MILESTONE 5 — Rescue Recovery Engine
> The core innovation. This is what makes MealBridge unique.

---

### Issue #12 — Backend: Rescue Recovery Engine
**Labels:** `backend` `ml` `priority:high`  
**Assignee:** ML Dev / Backend Dev

**Description:**  
Build the engine that recovers failing donations by finding alternatives or splitting the batch.

**Trigger Conditions:**
- Recipient declines → status = MATCHED, recipient sets `decline = true`
- Pickup timeout — deadline < 60 minutes away and status still ACCEPTED (not IN_TRANSIT)
- Partial capacity — recipient confirms only partial quantity

**Recovery Logic:**
```
1. Re-run matching on remaining quantity (exclude failed recipient)
2. If single alternative found → assign as new primary recipient
3. If no single recipient has enough capacity → split across 2–3 recipients
4. If no solution → escalate to coordinator with COORDINATOR_ALERT status
5. Log every recovery attempt with timestamp
```

**Split Donation Logic:**
- Find combination of recipients whose combined capacity ≥ remaining quantity
- Prefer minimum number of splits (2 over 3)
- Create child donation records for each split

**Tasks:**
- [ ] Create `backend/ml/rescue.py` with `trigger_rescue(donation_id)` function
- [ ] Create `backend/models/rescue_log.py` — track each rescue attempt and outcome
- [ ] Create `POST /donations/{id}/rescue` — manually trigger rescue (coordinator)
- [ ] Auto-trigger rescue when recipient declines via `PATCH /donations/{id}/decline`
- [ ] Create split donation records in `donations` table (parent_id foreign key)
- [ ] Return rescue result: `{type: "alternative"|"split"|"escalated", recipients: [...], portions: [...]}`

**Acceptance Criteria:**
- Declining a donation auto-triggers rescue within 5 seconds
- Split donations create correct child records with summed quantities = original
- Coordinator escalation fires if no match found

---

### Issue #13 — Frontend: Rescue Alert UI
**Labels:** `frontend` `priority:high`  
**Assignee:** Coordinator UI Dev / Donor UI Dev

**Description:**  
Build all UI components related to the Rescue Recovery Engine.

**Components to build:**

1. **Rescue Alert Banner** — red/amber banner on active donation cards
   - Text: "⚠️ Original pickup failed. Rescue in progress..."
   - Countdown to deadline

2. **Rescue Status Timeline** — step-by-step flow visual
   - Steps: Original Match → ❌ Failure → 🔄 Recovery Triggered → ✅ New Match(es)

3. **Split Donation Card** — shows 2–3 recipients each getting a portion
   - Recipient name, portion size, acceptance status

4. **Rescue Outcome Badge**
   - 🟢 "Rescued" — green badge
   - 🔴 "Failed" — red badge with reason

**Tasks:**
- [ ] Build `RescueAlertBanner.jsx` component
- [ ] Build `RescueTimeline.jsx` component
- [ ] Build `SplitDonationCard.jsx` component
- [ ] Build `RescueBadge.jsx` component
- [ ] Integrate all into `DonorDashboard` and `CoordinatorDashboard`
- [ ] Poll `GET /donations/{id}` every 10 seconds to update rescue status in real-time

---

## 🟡 MILESTONE 6 — Maps & Location
> Visual map showing donors and recipients.

---

### Issue #14 — Frontend: Leaflet Map Integration
**Labels:** `frontend` `priority:medium`  
**Assignee:** Maps Dev / Frontend Dev

**Description:**  
Integrate Leaflet.js with OpenStreetMap to show donation locations and matches on a map.

**Tasks:**
- [ ] Install `leaflet` and `react-leaflet`
- [ ] Build `DonationMap.jsx` component
- [ ] Plot **donor pin** (orange) and **matched recipient pin** (green) with a line between them
- [ ] On coordinator dashboard: plot ALL active donations with colour by status
  - 🟡 PENDING, 🟠 MATCHED, 🔴 RESCUE_TRIGGERED, 🟢 RESCUED
- [ ] Clicking a pin shows a popup: food type, quantity, status, deadline
- [ ] Center map on user's location by default
- [ ] Mobile responsive

---

## 🟡 MILESTONE 7 — Conversational AI Assistant
> The IBM watsonx.ai-powered chat interface.

---

### Issue #15 — Frontend: Chat Widget UI
**Labels:** `frontend` `ai` `priority:medium`  
**Assignee:** AI Dev / Frontend Dev

**Description:**  
Build the floating chat widget that appears on all dashboard screens.

**Tasks:**
- [ ] Build `ChatWidget.jsx` — floating button (bottom-right), expands to chat panel
- [ ] Chat panel: message history, input box, send button, typing indicator
- [ ] Add **quick-reply chips**: "Check my donation", "Find alternatives", "Contact coordinator"
- [ ] Messages have timestamps and sender label (You / MealBridge AI)
- [ ] Chat state persists within session (don't reset on page navigation)
- [ ] Smooth open/close animation

---

### Issue #16 — Backend: AI Chat Endpoint (Mock + watsonx.ai)
**Labels:** `backend` `ai` `priority:medium`  
**Assignee:** AI Dev / Backend Dev

**Description:**  
Build the chat API endpoint. Start with a mock/scripted version, then integrate watsonx.ai.

**Phase 1 — Mock (for prototype demo):**
Rule-based responses based on keywords + current donation state:
```
"status" → Look up latest donation, return status summary
"cancel" / "failed" → Describe rescue options
"split" → Explain split donation if applicable
"help" → List available commands
```

**Phase 2 — watsonx.ai Integration (if time allows):**
- Connect to IBM watsonx.ai API
- Pass system prompt: "You are MealBridge AI. You help donors and coordinators understand donation status. Only use information from the donation data provided."
- Pass donation context as structured data in the prompt

**Tasks:**
- [ ] Create `POST /chat/message` — accepts `{message, donation_id}`, returns `{reply}`
- [ ] Implement Phase 1 mock rule-based responses
- [ ] Wire `ChatWidget.jsx` to `POST /chat/message`
- [ ] (Optional) Implement Phase 2 watsonx.ai integration

---

## 🟡 MILESTONE 8 — Donation Tracking & Handover
> Track every donation to confirmed handover.

---

### Issue #17 — Backend: Handover Confirmation Routes
**Labels:** `backend` `priority:medium`  
**Assignee:** Backend Dev

**Tasks:**
- [ ] Create `POST /donations/{id}/handover` — donor + recipient both call this to confirm
- [ ] Only mark as RESCUED when **both** parties have confirmed
- [ ] Create `backend/models/handover.py` — `handovers` table: `donation_id, confirmed_by_donor, confirmed_by_recipient, confirmed_at, photo_url`
- [ ] (Optional) `POST /donations/{id}/handover/photo` — upload proof photo

---

### Issue #18 — Frontend: Donation Detail & Timeline Page
**Labels:** `frontend` `priority:medium`  
**Assignee:** Any Frontend Dev

**Description:**  
Full detail view for a single donation showing its complete lifecycle.

**Tasks:**
- [ ] Build `DonationDetailPage.jsx`
- [ ] Show status timeline: PENDING → MATCHED → ACCEPTED → IN_TRANSIT → RESCUED
  - Each step: timestamp, party involved, action taken
- [ ] Show rescue steps if applicable (rescue triggered, alternative match found)
- [ ] "Confirm Handover" button (for both donor and recipient)
- [ ] Show split donation children if applicable

---

## 🟢 MILESTONE 9 — Analytics & Coordinator Tools
> Coordinator visibility into the full platform.

---

### Issue #19 — Backend: Analytics Endpoints
**Labels:** `backend` `priority:medium`  
**Assignee:** Backend Dev

**API Endpoints:**
- [ ] `GET /analytics/summary` — total donations, rescue rate, meals saved, active matches
- [ ] `GET /analytics/weekly` — daily donation counts for last 7 days
- [ ] `GET /analytics/top-donors` — top 5 donor orgs by meals donated
- [ ] `GET /analytics/top-recipients` — top 5 recipient orgs by meals collected

---

### Issue #20 — Frontend: Coordinator Dashboard
**Labels:** `frontend` `priority:medium`  
**Assignee:** Coordinator UI Dev

**Tasks:**
- [ ] Build `CoordinatorDashboard.jsx`
- [ ] **Summary stat cards**: Total donations, Rescue rate %, Meals saved, Active rescues
- [ ] **Rescue Alert Panel** — list of donations in RESCUE_TRIGGERED state (red cards)
  - Each card: donor name, food type, quantity, time to deadline, "Trigger Rescue" button
- [ ] **Live Map** (from Issue #14)
- [ ] **All Donations Table** — filterable by status, date, location
- [ ] **Chat Panel** — AI assistant (from Issue #15)

---

### Issue #21 — Frontend: Analytics Charts Page
**Labels:** `frontend` `priority:low`  
**Assignee:** Coordinator UI Dev / Any

**Tasks:**
- [ ] Install `recharts` or `chart.js`
- [ ] Build `AnalyticsPage.jsx`
- [ ] Line chart: Daily donations this week
- [ ] Bar chart: Top 5 donors by meals
- [ ] Donut chart: Rescue rate (Rescued vs Failed vs Pending)
- [ ] Stats: Average match time, average rescue time

---

## 🟢 MILESTONE 10 — Landing Page & Polish
> The first impression for judges.

---

### Issue #22 — Frontend: Landing Page
**Labels:** `frontend` `priority:high`  
**Assignee:** Frontend Lead

**Description:**  
Build the public landing page — this is what judges see first.

**Tasks:**
- [ ] Hero section: Headline, subheadline, CTA buttons (Register as Donor / NGO / Coordinator)
- [ ] **Animated impact counters**: Meals Rescued, Active Donors, NGO Partners (count up on scroll)
- [ ] **"How it Works"** section: 4-step flow (PREDICT → MATCH → RECOVER → TRACK)
- [ ] **Key Innovation** section: Rescue Recovery Engine explainer
- [ ] **Problem → Solution** narrative section
- [ ] Dark mode design, smooth scroll, animated hero
- [ ] Mobile responsive

---

### Issue #23 — Frontend: UI Polish & Animations
**Labels:** `frontend` `priority:low`  
**Assignee:** Frontend Lead

**Tasks:**
- [ ] Add page transition animations (fade in on route change)
- [ ] Add skeleton loading states for all data-fetching components
- [ ] Add toast notifications for success/error actions
- [ ] Ensure all status badges have correct colour coding
- [ ] Make all pages mobile responsive
- [ ] Dark mode toggle (optional)
- [ ] Consistent spacing, typography, and colour system across all pages

---

## 🔵 MILESTONE 11 — Testing & Demo Prep

---

### Issue #24 — Seed Database with Demo Data
**Labels:** `backend` `priority:high`  
**Assignee:** Backend Dev

**Description:**  
Create a seed script that populates the database with realistic demo data so the app looks fully functional for judges.

**Seed data to create:**
- [ ] 3 Donor accounts (hostel, restaurant, college canteen)
- [ ] 5 Recipient accounts (NGOs at various distances)
- [ ] 1 Coordinator account
- [ ] 3 active donations in different states (PENDING, MATCHED, RESCUE_TRIGGERED)
- [ ] 1 completed rescued donation with full timeline
- [ ] Mock historical surplus data for prediction model
- [ ] Create `backend/seed.py` and run it: `python seed.py`

---

### Issue #25 — End-to-End Demo Flow Test
**Labels:** `priority:high`  
**Assignee:** QA / All

**Description:**  
Walk through the full demo story and verify every step works end-to-end.

**Demo Flow to Test:**
- [ ] Step 1: Log in as Hostel Donor → create new donation (80 meals, deadline 7 PM)
- [ ] Step 2: Verify AI surplus prediction shows on form
- [ ] Step 3: Verify matching engine auto-assigns City Shelter NGO
- [ ] Step 4: Log in as City Shelter Recipient → decline donation
- [ ] Step 5: Verify Rescue Engine triggers automatically
- [ ] Step 6: Verify split donation created: Asha Trust (50) + Hope Kitchen (30)
- [ ] Step 7: Both recipients accept their splits
- [ ] Step 8: Both confirm handover → donation status = RESCUED
- [ ] Step 9: Log in as Coordinator → verify analytics shows rescue
- [ ] Step 10: Use AI chat → ask "What happened to the 7 PM donation?"

---

## 📋 Summary Table

| Issue | Title | Milestone | Priority | Labels |
|---|---|---|---|---|
| #1 | Initialize Monorepo | Setup | 🔴 High | `infra` |
| #2 | FastAPI Scaffold | Setup | 🔴 High | `backend` |
| #3 | React + Vite + Tailwind | Setup | 🔴 High | `frontend` |
| #4 | User Model & Auth | Auth | 🔴 High | `backend` |
| #5 | Login & Register Pages | Auth | 🔴 High | `frontend` |
| #6 | Donation Model & CRUD | Core Flow | 🔴 High | `backend` |
| #7 | New Donation Form | Core Flow | 🔴 High | `frontend` |
| #8 | Donor Dashboard | Core Flow | 🔴 High | `frontend` |
| #9 | Recipient Dashboard | Core Flow | 🔴 High | `frontend` |
| #10 | Matching Engine | Matching | 🔴 High | `backend` `ml` |
| #11 | AI Surplus Prediction | Matching | 🔴 High | `backend` `ml` `frontend` |
| #12 | Rescue Recovery Engine | Rescue | 🔴 High | `backend` `ml` |
| #13 | Rescue Alert UI | Rescue | 🔴 High | `frontend` |
| #14 | Leaflet Map | Maps | 🟡 Medium | `frontend` |
| #15 | Chat Widget UI | AI Chat | 🟡 Medium | `frontend` `ai` |
| #16 | Chat API Endpoint | AI Chat | 🟡 Medium | `backend` `ai` |
| #17 | Handover Confirmation | Tracking | 🟡 Medium | `backend` |
| #18 | Donation Detail Page | Tracking | 🟡 Medium | `frontend` |
| #19 | Analytics Endpoints | Analytics | 🟡 Medium | `backend` |
| #20 | Coordinator Dashboard | Analytics | 🟡 Medium | `frontend` |
| #21 | Analytics Charts Page | Analytics | 🟢 Low | `frontend` |
| #22 | Landing Page | Polish | 🔴 High | `frontend` |
| #23 | UI Polish & Animations | Polish | 🟢 Low | `frontend` |
| #24 | Seed Demo Data | Testing | 🔴 High | `backend` |
| #25 | End-to-End Demo Test | Testing | 🔴 High | all |

---

*MealBridge · Team NovaNexus · PRISM 26 Socithon*
