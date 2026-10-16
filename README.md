# 🍱 MealBridge
### AI-Powered Food Surplus Redistribution Platform

> **PRISM 26 Socithon** · Team **NovaNexus**  
> Theme: *Food Waste Reduction & Hunger Relief (Social Good / Sustainability)*

[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)](.)
[![Hackathon](https://img.shields.io/badge/Hackathon-PRISM%2026%20Socithon-blueviolet?style=flat-square)](.)
[![Team](https://img.shields.io/badge/Team-NovaNexus-blue?style=flat-square)](.)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🚨 The Problem

Restaurants, hostels, and canteens often have surplus food they're happy to donate — **but it still goes to waste** because:

- Nobody knows how much food will be left over in advance
- Recipients can't always take the full quantity
- Pickups get cancelled at the last minute
- Everything runs on manual calls with no backup plan

**The real gap:** Existing systems find a recipient — but *nobody helps when that plan fails.*

---

## 💡 Our Solution

**MealBridge** is an AI-powered platform that doesn't just find a recipient for surplus food.  
**It makes sure the donation succeeds — even when the first plan falls through.**

```
PREDICT → MATCH → RECOVER → TRACK & LEARN
```

| Step | What happens |
|---|---|
| **1. PREDICT** | Estimate potential food surplus using historical meal & consumption data |
| **2. MATCH** | Confirm available quantity and match with eligible recipients by capacity, location, availability & deadline |
| **3. RECOVER** | If a pickup fails, find alternative recipients or propose split donations before the deadline |
| **4. TRACK & LEARN** | Confirm handovers, track donation status, analyse outcomes to improve future matching |

### 🔑 Key Innovation: Rescue Recovery Engine

MealBridge doesn't just find a recipient — it **recovers a donation** when the original plan fails by searching for feasible alternatives before the food collection deadline.

> A donation is counted as **rescued** only after a confirmed physical handover.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Layer 1: User Interface          │
│     React + Vite + Tailwind CSS          │
│  Donor · Recipient · Coordinator Dashboards │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Layer 2: Backend API             │
│          Python FastAPI                  │
│   Auth · Donations · Status · Validation │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│       Layer 3: Intelligence Layer        │
│  ┌─────────────┐ ┌──────────────────┐   │
│  │  Surplus     │ │    Matching      │   │
│  │  Prediction  │ │    Engine        │   │
│  └─────────────┘ └──────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │     Rescue Recovery Engine       │   │  ← Core Innovation
│  └──────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│       Layer 4: Data & Services           │
│  SQLite (dev) · PostgreSQL (prod)        │
│  IBM watsonx.ai · Leaflet/OpenStreetMap  │
└─────────────────────────────────────────┘
```

---

## 👥 User Roles

### 👨‍🍳 Donor (Restaurants, Canteens, Hostels)
- Log surplus food donations with quantity, type, and pickup window
- Get AI-based surplus predictions from historical data
- View match status and receive alerts on pickup changes
- Confirm handovers and track donation impact

### 🏠 Recipient (NGOs, Community Kitchens, Shelters)
- Browse nearby available donations
- Accept/decline matches based on capacity
- Confirm pickups and mark handovers complete

### 🧑‍💼 Coordinator (Platform Admin)
- Monitor all active donations on a live map
- Manually trigger the Rescue Recovery Engine
- View analytics: rescue rates, meals saved, top donors/recipients
- Use the AI assistant to query donation status

---

## 🤖 AI Features

| Feature | Technology | Description |
|---|---|---|
| Surplus Prediction | scikit-learn (Random Forest) | Estimates leftover food using historical meal patterns |
| Recipient Matching | Weighted scoring algorithm | Ranks NGOs by capacity, distance, availability, deadline |
| Rescue Recovery Engine | Custom logic + optimization | Finds alternative recipients or splits donations on failure |
| Conversational Assistant | IBM watsonx.ai | Chat interface to explain donation status and recovery options |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python FastAPI |
| Database | SQLite → PostgreSQL |
| ML / AI | scikit-learn, IBM watsonx.ai |
| Maps | Leaflet.js + OpenStreetMap |
| Auth | JWT (role-based) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- npm / pip

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload
```

`python seed.py` creates or refreshes `backend/mealbridge.db` with repeatable
demo users, donations, rescue timelines, and 60 days of surplus history. Seeded
accounts use hashed passwords and sign in through the same API as registered
users. Donor, NGO, and coordinator demo accounts each use separate passwords.

| Role | Demo email | Demo password |
| --- | --- | --- |
| Donor | `harshal@sunrise.in` | `MealBridgeDonor2026!` |
| NGO recipient | `anita@ashatrust.org` | `MealBridgeNGO2026!` |
| Coordinator | `admin@mealbridge.in` | `MealBridgeCoordinator2026!` |

Public registration allows donor and recipient accounts. Coordinator accounts
are seeded and cannot be created through public registration.

The API hashes passwords with PBKDF2 and issues revocable, 12-hour bearer
sessions. It checks roles and record ownership on protected API routes. This is
a hackathon prototype: email verification, password reset, login rate limiting,
and production session hardening are not implemented. Do not reuse the demo
password or deploy this authentication setup for real users.

### Environment Variables
To enable the live IBM watsonx.ai assistant, copy `backend/.env.example` to
`backend/.env` and fill in the values from your watsonx.ai Developer Access
page. Keep this file local; it is ignored by Git.

```env
WATSONX_API_KEY=your_ibm_cloud_api_key
WATSONX_PROJECT_ID=your_watsonx_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=your_chat_capable_model_id
```

The assistant sends the user's question and a limited snapshot of recent SQLite
donation/recovery records from FastAPI to watsonx.ai. The API key stays on the
backend. Without these settings, the widget clearly reports that IBM is not
connected instead of returning scripted sample answers. Matching and recovery
decisions remain in the MealBridge backend; the model only explains saved data.

The backend loads its local `.env` file at startup, so restart FastAPI after
changing these values. The API exposes `GET /assistant/status` and
`POST /assistant/chat`.

---

## 📁 Project Structure

```
mealbridge/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Dashboard pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── api/            # API call wrappers
│   └── public/
├── backend/                # FastAPI backend
│   ├── routers/            # API route handlers
│   ├── models/             # Database models
│   ├── ml/                 # Prediction & matching modules
│   │   ├── prediction.py   # Surplus prediction model
│   │   ├── matching.py     # Recipient matching engine
│   │   └── rescue.py       # Rescue Recovery Engine
│   └── main.py
├── docs/                   # Documentation & guides
│   ├── PRISM26_Feature_Guide.md
│   └── ISSUES.md
└── README.md
```

---

## 📊 Impact Metrics (Target)

| Metric | Goal |
|---|---|
| Rescue Rate | > 90% of at-risk donations recovered |
| Match Time | < 2 minutes from donation logged to match assigned |
| Split Accuracy | Correct split allocation in > 95% of cases |
| Food Saved | Track in kg and meal equivalents |

---

## 📚 References

- Food Waste in Mumbai & Pune (C4RB, 2024)
- Campus Dining Demand Prediction — Turker, 2025, *Sustainability*
- Game-Theoretic Surplus Distribution — Sanyal et al., 2021, *Appl. Sci.*
- Perishable Waste Prediction — Kudia et al., 2026, *IJIRT*
- Food Waste Prevention Methods Review — Moraes et al., 2021, *J. Environ. Manage.*
- Food Waste-Reducing Platforms Review — Paz et al., 2023, *Environ. Challenges*

---

## 🤝 Contributing

This is a hackathon project by Team NovaNexus. For contributions, please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add: your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

