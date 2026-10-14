# 🍱 MealBridge — Your Task List
**Hey! Harshal has set up the full skeleton of MealBridge.**
**Your job is to build on top of it. Everything below is independent — no deep logic needed.**

> ✅ Before starting: `git pull origin main` to get the latest code
> 📁 All your work goes inside `frontend/src/pages/` and `frontend/src/components/`

---

## 🔧 Setup (Do this first — 5 mins)

```bash
git clone https://github.com/harshalpatil2031-ui/MealBridge.git
cd MealBridge/frontend
npm install
npm run dev
```

Open → **http://localhost:5173** — you should see the landing page running.

---

## ✅ Issue #9 — Recipient Dashboard
**File to create:** `src/pages/RecipientDashboard.jsx`
**Difficulty:** 🟡 Medium | **Time:** ~1.5 hrs

This is the main screen for NGOs/shelters. They browse available donations and accept them.

**What to build:**

### Section 1 — Top Stats Row
3 cards in a row:
- 🍱 **Meals Collected** this month → `342`
- ✅ **Pickups Confirmed** → `28`
- ⭐ **Success Rate** → `96%`

### Section 2 — Available Donations Feed
A list of cards showing donations near the recipient.

Each card must show:
- 🏪 Donor name + org type (e.g. "Sunrise Hostel")
- 🍛 Food type (e.g. "Cooked Meals")
- 🍽️ Quantity (e.g. "60 portions")
- 📍 Distance (e.g. "1.4 km away")
- ⏱️ Deadline (e.g. "Expires in 38 mins")
- Green **"Accept Donation"** button
- Blue **"View Details"** button

**Use this mock data:**
```js
const available = [
  { id: 1, donor: "Sunrise Hostel", food: "Cooked Meals", qty: 60, distance: "1.4 km", deadline: "38 mins", type: "🍛" },
  { id: 2, donor: "Greenleaf Café", food: "Baked Goods", qty: 30, distance: "2.1 km", deadline: "1 hr 10 mins", type: "🥖" },
  { id: 3, donor: "City Canteen", food: "Rice & Dal", qty: 80, distance: "3.0 km", deadline: "2 hrs", type: "🍚" },
]
```

### Section 3 — My Accepted Pickups
A table/list of donations this recipient has already accepted.

Each row shows:
- Donor name, food type, quantity
- Status badge: `ACCEPTED` (blue) or `COLLECTED` (green)
- **"Mark as Collected"** button (only if status = ACCEPTED)

---

## ✅ Issue #20 — Coordinator Dashboard
**File to create:** `src/pages/CoordinatorDashboard.jsx`
**Difficulty:** 🟡 Medium | **Time:** ~1.5 hrs

This is the admin/overview screen. The coordinator sees everything happening live.

**What to build:**

### Section 1 — Summary Stat Cards (row of 4)
| Stat | Value | Icon |
|---|---|---|
| Total Donations Today | 24 | 🍱 |
| Active Rescues | 3 | ⚡ |
| Rescue Rate | 94% | 🎯 |
| Meals Saved This Week | 1,240 | 🌟 |

### Section 2 — 🚨 Rescue Alert Panel
A red/amber alert panel showing donations currently being rescued.

Each alert card shows:
- ⚠️ Red header: "Pickup Failed — Rescue Triggered"
- Donor name, food type, quantity
- Time remaining till deadline (countdown feel)
- Who failed (original recipient name)
- Status: "Engine searching..." OR "Rescue found"
- Orange **"Override Manually"** button

**Use this mock data:**
```js
const rescues = [
  { id: 1, donor: "Sunrise Hostel", food: "Cooked Meals", qty: 80, timeLeft: "47 mins", failed: "City Shelter NGO", status: "Rescue found" },
  { id: 2, donor: "Metro Canteen", food: "Rice & Sabzi", qty: 45, timeLeft: "22 mins", failed: "Green Hope NGO", status: "Searching..." },
]
```

### Section 3 — All Donations Table
A full table of all donations with columns:
- Donor | Food Type | Qty | Status Badge | Matched Recipient | Action

Status badges (coloured):
- 🟡 `PENDING` | 🔵 `MATCHED` | 🔴 `RESCUE_TRIGGERED` | 🟢 `RESCUED` | ⚫ `FAILED`

---

## ✅ Issue #15 — AI Chat Widget
**File to create:** `src/components/ChatWidget.jsx`
**Difficulty:** 🟢 Easy | **Time:** ~1 hr

A floating chat bubble that appears on ALL dashboard pages (bottom-right corner).

**What to build:**

### The Bubble Button
- Fixed position: bottom-right corner
- Round orange button: 💬 icon
- Clicking it opens/closes the chat panel

### The Chat Panel (when open)
- Header: "🤖 MealBridge AI" with a green "online" dot
- Message list area (scrollable)
- Input box + Send button at the bottom
- Typing indicator animation (3 dots bouncing) when "bot is typing"

### Pre-scripted Responses
When user types any message, wait 1 second (fake typing), then reply based on keywords:

```js
const replies = {
  "status":      "Your latest donation of 60 meals is currently MATCHED with Asha Trust NGO. Pickup expected by 7:30 PM. ✅",
  "rescue":      "The Rescue Engine is active! We found 2 alternatives: Asha Trust (35 meals) + Hope Kitchen (25 meals). Both have accepted. 🎯",
  "split":       "Your 80-meal donation has been split: Asha Trust gets 50 meals, Hope Kitchen gets 30 meals. Both confirmed pickup. ✂️",
  "cancel":      "No worries! The Rescue Engine will automatically find a new recipient within 2 minutes. ⚡",
  "help":        "I can help with: donation status, rescue options, split donations, and finding recipients. Just ask! 😊",
  default:       "I'm on it! Let me check the latest donation data for you... 🔍"
}
```

### Quick Reply Chips
3 buttons below the input (clicking sends that message):
- "Check my donation"
- "Rescue options?"
- "How does split work?"

### Add it to dashboards
Import and add `<ChatWidget />` at the bottom of:
- `DonorDashboard.jsx`
- `RecipientDashboard.jsx`
- `CoordinatorDashboard.jsx`

---

## ✅ Issue #18 — Donation Detail & Timeline Page
**File to create:** `src/pages/DonationDetailPage.jsx`
**Difficulty:** 🟢 Easy-Medium | **Time:** ~1 hr

A full detail view for a single donation — shows the complete lifecycle as a visual timeline.

**What to build:**

### Top Section — Donation Summary Card
- Food type, quantity, donor name
- Large status badge (current status)
- Deadline + created time

### Middle Section — Status Timeline
A vertical timeline with these steps (show checkmark ✅ if done, clock 🕐 if pending):

```
✅ Donation Logged       → 6:00 PM — Sunrise Hostel logged 80 meals
✅ Match Found           → 6:02 PM — Matched with City Shelter NGO
❌ Pickup Failed         → 6:45 PM — City Shelter declined
⚡ Rescue Triggered     → 6:46 PM — Engine searching for alternatives
✅ Split Donation        → 6:48 PM — Asha Trust (50) + Hope Kitchen (30)
✅ Handover Confirmed   → 7:15 PM — Both pickups confirmed
🟢 RESCUED              → 80 meals saved
```

### Bottom Section — Handover Confirmation
Two buttons side by side:
- Green **"✅ Confirm Handover (Donor)"**
- Blue **"✅ Confirm Handover (Recipient)"**

Below them: "Handover confirmed by both parties" message (show after both clicked)

---

## ✅ Issue #21 — Analytics Charts Page
**File to create:** `src/pages/AnalyticsPage.jsx`
**Difficulty:** 🟢 Easy | **Time:** ~45 mins

> First install: `npm install recharts`

A charts/reports page for the coordinator.

**What to build:**

### Chart 1 — Line Chart: Daily Donations (this week)
```js
const weekData = [
  { day: "Mon", donations: 18, rescued: 16 },
  { day: "Tue", donations: 22, rescued: 21 },
  { day: "Wed", donations: 15, rescued: 14 },
  { day: "Thu", donations: 28, rescued: 26 },
  { day: "Fri", donations: 31, rescued: 29 },
  { day: "Sat", donations: 12, rescued: 11 },
  { day: "Sun", donations: 8,  rescued: 8  },
]
```
Orange line = total donations, Green line = rescued

### Chart 2 — Bar Chart: Top 5 Donors
```js
const topDonors = [
  { name: "Sunrise Hostel", meals: 340 },
  { name: "City Canteen",   meals: 280 },
  { name: "Greenleaf Café", meals: 195 },
  { name: "Metro Kitchen",  meals: 160 },
  { name: "Campus Dining",  meals: 120 },
]
```

### Chart 3 — Donut Chart: Rescue Outcomes
```js
const outcomes = [
  { name: "Rescued",  value: 78, color: "#10b981" },
  { name: "Failed",   value: 6,  color: "#ef4444" },
  { name: "Pending",  value: 16, color: "#f97316" },
]
```

---

## ✅ Issue #23 — UI Polish & Animations
**Difficulty:** 🟢 Easy | **Time:** ~30–45 mins

Final quality pass over all pages. Go through each page and:

- [ ] Add **hover effects** on all cards (slight lift: `transform: translateY(-4px)`)
- [ ] Add **loading skeleton** on any data list (grey animated bars while "loading")
- [ ] Add **toast notifications** — green toast when "Donation Accepted ✅", red toast on errors
- [ ] Make sure all pages look good on **mobile** (stack columns, reduce font sizes)
- [ ] Make sure all **status badges** are colour-coded consistently:
  - 🟡 PENDING · 🔵 MATCHED · 🔴 RESCUE_TRIGGERED · 🟢 RESCUED · ⚫ FAILED
- [ ] Check that **fonts** are Inter/Space Grotesk everywhere (not browser default)

---

## 🗂️ Summary — Your Issues

| # | Issue | Time | Difficulty |
|---|---|---|---|
| #9 | Recipient Dashboard | ~1.5 hr | 🟡 Medium |
| #20 | Coordinator Dashboard | ~1.5 hr | 🟡 Medium |
| #15 | AI Chat Widget | ~1 hr | 🟢 Easy |
| #18 | Donation Detail & Timeline | ~1 hr | 🟢 Easy-Medium |
| #21 | Analytics Charts | ~45 mins | 🟢 Easy |
| #23 | UI Polish | ~45 mins | 🟢 Easy |
| | **Total** | **~6.5 hrs** | |

---

## 📐 Design Rules (follow these exactly so everything looks consistent)

- **Background:** `#080d1a` (dark navy)
- **Cards:** `background: rgba(17,24,39,0.7); border: 1px solid rgba(255,255,255,0.07); border-radius: 22px`
- **Orange accent:** `#f97316`
- **Green accent:** `#10b981`
- **Text primary:** `#f1f5f9`
- **Text secondary:** `#94a3b8`
- **Font:** Inter for body, Space Grotesk for headings (already loaded in `index.css`)
- Use the CSS classes already defined: `.glass-card`, `.btn-primary`, `.btn-green`, `.btn-secondary`, `.badge-orange`, `.badge-green`, `.gradient-text`

---

## 🚀 How to submit your work

```bash
git checkout -b feat/friend-dashboards
# ... do your work ...
git add .
git commit -m "feat: Recipient dashboard, Coordinator dashboard, Chat widget, Analytics"
git push origin feat/friend-dashboards
```

Then open a PR on GitHub → assign Harshal as reviewer.

---

*MealBridge · Team NovaNexus · PRISM 26 Socithon* 🍱
