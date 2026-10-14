# 🍱 MealBridge — PRISM 26 Prototype Feature Guide
**Team:** NovaNexus | **Hackathon:** Socithon / PRISM 26  
**Theme:** Food Waste Reduction & Hunger Relief (Social Good / Sustainability)  
**Document Purpose:** Complete feature breakdown for all teammates — what to build, what each screen does, what each module handles.

---

## 🧭 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Core User Roles & Dashboards](#2-core-user-roles--dashboards)
3. [Feature Module 1 — AI Surplus Prediction](#3-feature-module-1--ai-surplus-prediction)
4. [Feature Module 2 — Intelligent Recipient Matching](#4-feature-module-2--intelligent-recipient-matching)
5. [Feature Module 3 — Rescue Recovery Engine](#5-feature-module-3--rescue-recovery-engine)
6. [Feature Module 4 — Conversational AI Assistant (watsonx.ai)](#6-feature-module-4--conversational-ai-assistant-watsonxai)
7. [Feature Module 5 — Donation Tracking & Handover Confirmation](#7-feature-module-5--donation-tracking--handover-confirmation)
8. [Tech Stack Breakdown](#8-tech-stack-breakdown)
9. [Screen-by-Screen Breakdown](#9-screen-by-screen-breakdown)
10. [Team Task Split](#10-team-task-split)
11. [Today's Prototype Scope](#11-todays-prototype-scope)

---

## 1. Project Overview

**MealBridge** is an AI-powered food donation coordination platform. It solves the problem of surplus food going to waste even when donors are willing — because:

- No one knows how much food will be left over
- Recipients can't always take the full quantity
- Pickups get cancelled at the last minute
- Everything runs on manual calls with no backup plan

**The Core Innovation: Rescue Recovery Engine**  
Most platforms find a recipient. MealBridge makes sure the donation *actually succeeds* — even when the first plan fails.

> A donation is counted as **rescued** only after a **confirmed handover**.

---

## 2. Core User Roles & Dashboards

MealBridge has **3 types of users**, each with their own dashboard and set of actions.

---

### 👨‍🍳 Role 1: Donor
**Who:** Restaurants, hostel canteens, college cafeterias, event caterers

| Feature | Description |
|---|---|
| **Register Donation** | Input food type, estimated quantity, available time window, location |
| **View Match Status** | See which recipient has been matched to their donation |
| **Receive Alerts** | Get notified if the original recipient cancels (pickup failure) |
| **Confirm Handover** | Mark donation as handed over when the recipient collects |
| **View History** | See past donations, how many were successfully rescued, impact stats |

**Key Screens:**
- Donor Registration / Login
- New Donation Form
- Active Donation Status Card (with countdown timer to deadline)
- Donation History & Impact Dashboard

---

### 🏠 Role 2: Recipient
**Who:** NGOs, community kitchens, orphanages, old-age homes

| Feature | Description |
|---|---|
| **Browse Available Donations** | See nearby donations they are eligible to collect |
| **Accept / Decline** | Accept a matched donation or decline with a reason |
| **Capacity Declaration** | Set their capacity (how many meals they can accept, vehicle availability) |
| **Pickup Confirmation** | Mark a donation as collected and provide handover proof |
| **Notification Alerts** | Get notified when a donation is matched to them or when a backup opportunity opens |

**Key Screens:**
- Recipient Registration / Login
- Available Donations Feed (with distance and quantity)
- Donation Detail Page
- Pickup Confirmation Screen

---

### 🧑‍💼 Role 3: Coordinator
**Who:** Platform admin / NGO coordinator managing the flow

| Feature | Description |
|---|---|
| **Live Donation Overview** | See all active donations, matched pairs, and pending rescues |
| **Manual Override** | Manually trigger the Rescue Recovery Engine for a failing donation |
| **Analytics Dashboard** | View success rates, rescue rates, high-waste sources, top recipients |
| **Recipient Directory** | Manage registered NGOs and their capacity data |
| **AI Assistant Access** | Use the watsonx.ai chat to query donation status and options |

**Key Screens:**
- Coordinator Overview Dashboard (map + list)
- Rescue Alert Panel
- Analytics & Reports Page
- NGO/Recipient Directory

---

## 3. Feature Module 1 — AI Surplus Prediction

**What it does:** Estimates how much food a donor is *likely to have left over* before they even finish cooking — so recipients can be alerted early.

### How it works (simplified for prototype):
1. Donor submits past meal data: how many meals they prepared vs. how many were consumed (last 7–30 days)
2. System applies a **lightweight ML model** (Random Forest / Linear Regression using scikit-learn) on:
   - Day of the week
   - Type of meal (breakfast/lunch/dinner)
   - Special events or holidays
   - Historical attendance patterns
3. Output: **Predicted surplus quantity** (e.g., "~35 meals likely surplus tonight")

### UI Elements:
- **Prediction Badge** on the donor's active donation card (e.g., "AI Estimate: ~35 portions")
- **Confidence level bar** (Low / Medium / High)
- **Historical trend mini-chart** (line graph of past surplus vs. actual)

### For the Prototype (Today):
- Use **hardcoded/mock historical data** for 3–5 sample donors
- Run a simple regression or rule-based estimate
- Display the prediction on the UI — it doesn't need to be perfect ML, just *functional and visual*

---

## 4. Feature Module 2 — Intelligent Recipient Matching

**What it does:** Once a donation is logged, automatically finds the best recipient from the registered NGO/recipient list.

### Matching Criteria (ranked):
| Priority | Factor | Logic |
|---|---|---|
| 1 | **Capacity** | Recipient must be able to handle the quantity |
| 2 | **Distance** | Closer recipients ranked higher (use lat/long + Haversine formula) |
| 3 | **Availability** | Recipient must be available within the pickup time window |
| 4 | **Deadline** | Donation must reach recipient before food safety deadline |
| 5 | **Past Success Rate** | Recipients with high confirmed pickups ranked higher |

### Algorithm (Prototype):
- Simple **weighted scoring** of the above 5 factors
- Returns top 3 matches, auto-assigns rank #1 as the primary recipient
- If rank #1 declines, rank #2 is offered — this triggers the Rescue Engine

### UI Elements:
- **Match Card** showing matched NGO: name, distance, contact, capacity
- **Map View** (Leaflet + OpenStreetMap) with donor pin and recipient pin connected
- "Why this match?" tooltip (short explanation of ranking factors)
- Accept / Decline buttons for recipient

---

## 5. Feature Module 3 — Rescue Recovery Engine

> **This is the core innovation of MealBridge — no other system does this.**

**What it does:** When an original pickup fails (recipient cancels, no-show, or can't take full quantity), the engine finds an alternative *before the food deadline*.

### Trigger Conditions:
- Recipient explicitly declines the donation
- Recipient does not confirm pickup within X minutes of deadline
- Recipient can only take partial quantity (e.g., 50 of 80 meals)

### Recovery Options the Engine Explores:

| Option | Description |
|---|---|
| **Alternative Recipient** | Find the next best-matched recipient from the ranked list |
| **Split Donation** | Split the batch across 2–3 recipients if no single one has enough capacity |
| **Extended Time Window** | Prompt donor to extend the deadline by 30–60 mins if food is still safe |
| **Coordinator Alert** | Escalate to human coordinator if no automated solution found |

### Split Donation Logic:
- If donation = 80 meals and no single recipient can take all 80:
  - Find Recipient A (capacity: 50) + Recipient B (capacity: 30)
  - Assign split: A gets 50, B gets 30
  - Both must confirm independently

### UI Elements:
- **Rescue Alert Banner** — red/orange banner appears when a donation is at risk
- **Rescue Status Timeline** — step-by-step: Original match → Failure → Recovery triggered → New match(es) found
- **Split Donation Card** — shows two or more recipients getting portions
- **Countdown Timer** — shows time remaining until food deadline
- **"Rescue Successful / Failed" Badge** after resolution

---

## 6. Feature Module 4 — Conversational AI Assistant (watsonx.ai)

**What it does:** A chat assistant that helps donors and coordinators understand the current status of a donation and what recovery options are available.

### Sample Conversations:
```
User: "What happened to my 6 PM donation?"
Bot:  "Your 6 PM donation of 60 meals was matched to Hope Kitchen.
       They cancelled at 5:30 PM. The Rescue Engine found two alternatives:
       City Shelter (35 meals) and Green NGO (25 meals). 
       Both have accepted. Pickup confirmed for 5:45 PM."
```

```
User: "Can I split my donation?"
Bot:  "Yes! Based on current availability, we can split your 80-meal 
       donation between Sunrise Home (50) and Asha Trust (30).
       Want me to initiate this?"
```

### Implementation for Prototype:
- Use **IBM watsonx.ai API** (proposed, not yet integrated)
- For today's prototype: Use a **mock chatbot UI** with pre-scripted responses based on donation state
- The chat panel should appear as a floating widget on all dashboard screens
- Responses should be **data-aware** — pull from current donation status

### UI Elements:
- Floating **Chat Widget** (bottom-right corner) on all screens
- Chat history panel with timestamps
- Typing indicator animation
- Quick-reply buttons: "Check my donation", "Find alternatives", "Contact coordinator"

---

## 7. Feature Module 5 — Donation Tracking & Handover Confirmation

**What it does:** Tracks every donation from creation to final confirmed handover. Only a confirmed handover counts as a "rescued" donation.

### Donation Status Lifecycle:
```
PENDING → MATCHED → IN_TRANSIT → RESCUE_TRIGGERED → RESCUED / FAILED
```

| Status | Meaning |
|---|---|
| `PENDING` | Donation logged, matching in progress |
| `MATCHED` | Recipient assigned, awaiting acceptance |
| `ACCEPTED` | Recipient confirmed pickup |
| `IN_TRANSIT` | Pickup underway |
| `RESCUE_TRIGGERED` | Original plan failed, recovery active |
| `RESCUED` | Handover confirmed by both parties |
| `FAILED` | No rescue possible before deadline |

### Handover Confirmation:
- Both donor and recipient must confirm handover
- Optional: Upload a **photo proof** of handover (for coordinators)
- System logs time of confirmation

### Analytics (shown on coordinator dashboard):
- Total donations this week
- Rescue rate (% of at-risk donations successfully recovered)
- Average time-to-rescue
- Top donor institutions
- Top recipient NGOs
- Food saved (in kg / meals)

---

## 8. Tech Stack Breakdown

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | All 3 dashboards, all UI screens |
| **Backend API** | Python FastAPI | Auth, donation records, status tracking |
| **Database** | SQLite (dev) → PostgreSQL (prod) | Store users, donations, matches, statuses |
| **ML/Prediction** | scikit-learn (Random Forest) | Surplus prediction model |
| **Maps** | Leaflet.js + OpenStreetMap | Donor/recipient map, distance calc |
| **AI Chat** | IBM watsonx.ai | Conversational assistant |
| **Auth** | JWT tokens | Role-based login (Donor / Recipient / Coordinator) |

---

## 9. Screen-by-Screen Breakdown

### Screen 1: Landing Page
- Hero: "Don't let food go to waste. MealBridge rescues every donation."
- CTA buttons: "Register as Donor" | "Register as NGO" | "I'm a Coordinator"
- Impact counters (animated): Meals Rescued, Active Donors, NGO Partners

### Screen 2: Login / Register
- Role selector (Donor / Recipient / Coordinator)
- Simple form: name, org name, email, password, location (for recipients: capacity)

### Screen 3: Donor Dashboard
- Active Donation card (with AI surplus estimate, match status, countdown timer)
- New Donation button → opens donation form
- Past Donations table with rescue status badges
- Impact stat cards: "You've helped rescue X meals"

### Screen 4: New Donation Form
- Fields: Food type, estimated quantity, ready time, collection deadline, location
- AI shows prediction: "Based on your history, you may have ~X portions"
- Submit → triggers matching engine

### Screen 5: Recipient Dashboard
- "Donations Near You" feed — sorted by distance, with quantity and deadline
- Each card: Food type, donor name, quantity, distance, deadline, Accept button
- My Accepted Pickups section with pickup confirmation button

### Screen 6: Coordinator Dashboard
- Live map: All active donations plotted (colour-coded by status)
- Alert panel: Donations in RESCUE_TRIGGERED state (red cards)
- Analytics summary: rescue rate, meals saved, active matches
- AI Assistant chat panel

### Screen 7: Rescue Alert Screen
- Triggered when a pickup fails
- Shows: What failed, why, remaining time till deadline
- Engine output: Recovery options listed (alternative recipients / split options)
- Manual override: Coordinator can assign manually

### Screen 8: Donation Detail Page
- Full timeline of the donation lifecycle
- Parties involved: Donor → Primary Recipient → (Rescue Recipients)
- Handover confirmation buttons
- Photo upload (optional)

### Screen 9: Analytics Page (Coordinator)
- Charts: Weekly rescue rate, daily donations, top donors, top recipients
- Filter by date range, food type, location
- Downloadable report button

---

## 10. Team Task Split

> Suggested division — adjust based on your team size

| Area | Responsibility | Screens / Modules |
|---|---|---|
| **Frontend Lead** | React app setup, routing, design system | All screens, Tailwind config |
| **Donor UI Dev** | Donor dashboard, new donation form, history | Screens 3, 4, 8 |
| **Recipient UI Dev** | Recipient dashboard, pickup flow | Screens 5, 8 |
| **Coordinator UI Dev** | Coordinator dashboard, analytics, rescue panel | Screens 6, 7, 9 |
| **Backend Dev** | FastAPI setup, all API endpoints, auth, DB | API routes, models, JWT |
| **ML Dev** | Surplus prediction model, matching algorithm | Module 1, Module 2 |
| **Rescue Engine Dev** | Recovery logic, split donation logic | Module 3 |
| **AI/Chat Dev** | watsonx.ai integration or mock chatbot UI | Module 4 |
| **Maps Dev** | Leaflet integration, map screens | Screen 6, distance calc |
| **QA / Integration** | Wire frontend to backend, test all flows | All screens end-to-end |

---

## 11. Today's Prototype Scope

> Focus on what matters most for a hackathon demo. Ship a working, impressive prototype — not a complete product.

### ✅ Must-Have for Today's Demo:

- [ ] **Landing page** with animated impact counters and role CTAs
- [ ] **Donor Dashboard** — log a new donation, see AI surplus estimate, view match status
- [ ] **Recipient Dashboard** — view available donations, accept one
- [ ] **Matching Engine** — show top 3 matched recipients after a donation is logged
- [ ] **Rescue Recovery Flow** — simulate a cancellation and show the rescue engine finding an alternative
- [ ] **Rescue Alert UI** — countdown timer, rescue status banner, split donation card
- [ ] **Map View** — Leaflet map showing donor and matched recipient location
- [ ] **Donation Status Timeline** — visual lifecycle from PENDING → RESCUED
- [ ] **Mock AI Chatbot** — scripted but visually complete chat widget

### 🟡 Nice-to-Have (if time allows):

- [ ] Coordinator Dashboard with live analytics charts
- [ ] Photo handover proof upload
- [ ] Actual watsonx.ai API connection
- [ ] Real ML model running (vs. mock prediction)
- [ ] Downloadable analytics report

### ❌ Out of Scope for Today:

- Real-time push notifications
- Mobile app
- Payment/incentive system
- Full PostgreSQL migration

---

## 🚀 Demo Flow (for judges)

**Story to tell in 3 minutes:**

1. **"Imagine it's 7 PM."** A hostel canteen logs 80 surplus meals → AI predicts 75 will be surplus → System matches City Shelter NGO (nearest, capacity 80) ✅
2. **"At 6:45 PM, City Shelter cancels."** Rescue Engine triggers → Finds Asha Trust (50) + Hope Kitchen (30) → Split donation initiated → Both accept ✅
3. **"By 7:00 PM, both pickups confirmed."** Handover logged. 80 meals rescued. Zero waste. ✅
4. **Show the coordinator dashboard** — rescue rate 94%, 340 meals saved this week
5. **Show the AI chat assistant** — "What happened to the 7 PM donation?" → Full explanation

---

*Built with ❤️ by NovaNexus for PRISM 26 Socithon*
