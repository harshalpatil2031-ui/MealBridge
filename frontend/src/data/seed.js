/**
 * MealBridge — Central Seed / Mock Data
 * Team NovaNexus · PRISM 26 Socithon
 *
 * Import from any page:
 *   import { donors, recipients, donations, coordinator } from '../data/seed'
 */

/* ─── Users ──────────────────────────────────────────────────── */
export const donors = [
  {
    id: 'U-D01', name: 'Harshal Patil', email: 'harshal@sunrise.in',
    org: 'Sunrise Hostel', location: 'Kothrud, Pune',
    lat: 18.5074, lng: 73.8077, role: 'donor',
    totalDonations: 31, mealsRescued: 1240, rescueRate: 94,
    joinedDate: 'Aug 2025'
  },
  {
    id: 'U-D02', name: 'Meera Shah', email: 'meera@greenleaf.in',
    org: 'Greenleaf Café', location: 'Koregaon Park, Pune',
    lat: 18.5362, lng: 73.8943, role: 'donor',
    totalDonations: 18, mealsRescued: 680, rescueRate: 89,
    joinedDate: 'Sep 2025'
  },
  {
    id: 'U-D03', name: 'Rajesh Kumar', email: 'rajesh@metrokitchen.in',
    org: 'Metro Canteen', location: 'Shivajinagar, Pune',
    lat: 18.5308, lng: 73.8474, role: 'donor',
    totalDonations: 24, mealsRescued: 890, rescueRate: 91,
    joinedDate: 'Jul 2025'
  },
]

export const recipients = [
  {
    id: 'U-R01', name: 'Anita Desai', email: 'anita@ashatrust.org',
    org: 'Asha Trust', type: 'NGO', location: 'Karve Nagar, Pune',
    lat: 18.4912, lng: 73.8245, capacity: 100, emoji: '🏠',
    successRate: 98, pickupsCompleted: 142, color: '#10b981',
    joinedDate: 'Jun 2025'
  },
  {
    id: 'U-R02', name: 'Priya Nair', email: 'priya@hopekitchen.org',
    org: 'Hope Kitchen', type: 'Community Kitchen', location: 'Shivajinagar, Pune',
    lat: 18.5308, lng: 73.8474, capacity: 80, emoji: '🍲',
    successRate: 94, pickupsCompleted: 98, color: '#3b82f6',
    joinedDate: 'Jul 2025'
  },
  {
    id: 'U-R03', name: 'Suresh More', email: 'suresh@greenhope.org',
    org: 'Green Hope NGO', type: 'NGO', location: 'Bavdhan, Pune',
    lat: 18.5121, lng: 73.7857, capacity: 60, emoji: '🌱',
    successRate: 89, pickupsCompleted: 76, color: '#a78bfa',
    joinedDate: 'Aug 2025'
  },
  {
    id: 'U-R04', name: 'Fatima Sheikh', email: 'fatima@cityshelter.org',
    org: 'City Shelter NGO', type: 'Shelter', location: 'Hadapsar, Pune',
    lat: 18.5018, lng: 73.9260, capacity: 120, emoji: '🏡',
    successRate: 87, pickupsCompleted: 63, color: '#f59e0b',
    joinedDate: 'Sep 2025'
  },
  {
    id: 'U-R05', name: 'Vikram Joshi', email: 'vikram@sunrisehome.org',
    org: 'Sunrise Home', type: 'Orphanage', location: 'Baner, Pune',
    lat: 18.5590, lng: 73.7868, capacity: 50, emoji: '🌅',
    successRate: 96, pickupsCompleted: 54, color: '#ec4899',
    joinedDate: 'Oct 2025'
  },
]

export const coordinator = {
  id: 'U-C01', name: 'Coordinator Admin', email: 'admin@mealbridge.in',
  role: 'coordinator', org: 'MealBridge Platform'
}

/* ─── Donations ──────────────────────────────────────────────── */
export const donations = [
  /* ── Active: Rescue Triggered ── */
  {
    id: 'D-001', donorId: 'U-D01', donor: 'Sunrise Hostel',
    food: 'Cooked Meals', type: '🍛', qty: 80, aiEstimate: 75,
    status: 'RESCUE_TRIGGERED',
    deadline: Date.now() + 47 * 60 * 1000,
    createdAt: '6:00 PM', location: 'Kothrud, Pune',
    lat: 18.5074, lng: 73.8077,
    originalRecipient: 'City Shelter NGO',
    failedAt: '6:45 PM', failReason: 'Recipient declined — vehicle unavailable',
    confidence: 'High',
    rescueSplit: [
      { recipientId: 'U-R01', org: 'Asha Trust',    portion: 50, status: 'ACCEPTED' },
      { recipientId: 'U-R02', org: 'Hope Kitchen',  portion: 30, status: 'ACCEPTED' },
    ],
    timeline: [
      { time: '6:00 PM', event: 'Donation logged — 80 meals', status: 'done'   },
      { time: '6:02 PM', event: 'Matched with City Shelter NGO (score: 91)', status: 'done'   },
      { time: '6:45 PM', event: 'City Shelter cancelled pickup', status: 'failed' },
      { time: '6:46 PM', event: 'Rescue Engine triggered — scanning 23 recipients', status: 'active' },
      { time: '6:48 PM', event: 'Split: Asha Trust (50) + Hope Kitchen (30)', status: 'pending' },
      { time: '—',       event: 'Awaiting handover confirmation', status: 'pending' },
    ]
  },

  /* ── Active: Matched ── */
  {
    id: 'D-002', donorId: 'U-D01', donor: 'Sunrise Hostel',
    food: 'Baked Goods', type: '🥖', qty: 40, aiEstimate: 35,
    status: 'MATCHED',
    deadline: Date.now() + 110 * 60 * 1000,
    createdAt: '5:30 PM', location: 'Kothrud, Pune',
    lat: 18.5074, lng: 73.8077,
    originalRecipient: 'Green Hope NGO', confidence: 'Medium',
    rescueSplit: null,
    timeline: [
      { time: '5:30 PM', event: 'Donation logged — 40 portions', status: 'done' },
      { time: '5:32 PM', event: 'Matched with Green Hope NGO (score: 81)', status: 'done' },
      { time: '—',       event: 'Awaiting recipient acceptance', status: 'active' },
    ]
  },

  /* ── Active: Pending (just created) ── */
  {
    id: 'D-003', donorId: 'U-D02', donor: 'Greenleaf Café',
    food: 'Rice & Dal', type: '🍚', qty: 55, aiEstimate: 50,
    status: 'PENDING',
    deadline: Date.now() + 150 * 60 * 1000,
    createdAt: '7:00 PM', location: 'Koregaon Park, Pune',
    lat: 18.5362, lng: 73.8943,
    originalRecipient: null, confidence: 'High',
    rescueSplit: null,
    timeline: [
      { time: '7:00 PM', event: 'Donation logged — 55 portions', status: 'done'   },
      { time: '—',       event: 'Matching engine running…',       status: 'active' },
    ]
  },

  /* ── History: Rescued ── */
  {
    id: 'D-098', donorId: 'U-D01', donor: 'Sunrise Hostel',
    food: '🍛 Rice & Dal', type: '🍛', qty: 60,
    status: 'RESCUED', deadline: null, createdAt: 'Oct 13',
    originalRecipient: 'Asha Trust', rescueSplit: null,
    mealsSaved: 60
  },
  {
    id: 'D-097', donorId: 'U-D01', donor: 'Sunrise Hostel',
    food: '🥖 Bread & Snacks', type: '🥖', qty: 25,
    status: 'RESCUED', deadline: null, createdAt: 'Oct 12',
    originalRecipient: 'Hope Kitchen', rescueSplit: null,
    mealsSaved: 25
  },
  {
    id: 'D-096', donorId: 'U-D01', donor: 'Sunrise Hostel',
    food: '🍲 Mixed Curry', type: '🍲', qty: 90,
    status: 'FAILED', deadline: null, createdAt: 'Oct 11',
    originalRecipient: '—', rescueSplit: null, mealsSaved: 0
  },
  {
    id: 'D-095', donorId: 'U-D02', donor: 'Greenleaf Café',
    food: '🍱 Lunch Boxes', type: '🍱', qty: 50,
    status: 'RESCUED', deadline: null, createdAt: 'Oct 10',
    originalRecipient: 'City Shelter', rescueSplit: null, mealsSaved: 50
  },
  {
    id: 'D-094', donorId: 'U-D03', donor: 'Metro Canteen',
    food: '🥗 Salad & Sides', type: '🥗', qty: 30,
    status: 'RESCUED', deadline: null, createdAt: 'Oct 09',
    originalRecipient: 'Green Hope NGO', rescueSplit: null, mealsSaved: 30
  },
  {
    id: 'D-093', donorId: 'U-D03', donor: 'Metro Canteen',
    food: '🍛 Dal Makhani', type: '🍛', qty: 70,
    status: 'RESCUED', deadline: null, createdAt: 'Oct 08',
    originalRecipient: 'Sunrise Home', rescueSplit: null, mealsSaved: 70
  },
]

/* ─── Analytics ──────────────────────────────────────────────── */
export const analytics = {
  summary: {
    totalDonations: 24,
    activeRescues: 3,
    rescueRate: 94,
    mealsSavedWeek: 1240,
    avgMatchTime: '1.6s',
    avgRescueTime: '3.2 min',
  },
  weekly: [
    { day: 'Mon', donations: 18, rescued: 17 },
    { day: 'Tue', donations: 22, rescued: 21 },
    { day: 'Wed', donations: 15, rescued: 14 },
    { day: 'Thu', donations: 28, rescued: 26 },
    { day: 'Fri', donations: 31, rescued: 29 },
    { day: 'Sat', donations: 12, rescued: 11 },
    { day: 'Sun', donations: 8,  rescued: 8  },
  ],
  topDonors: [
    { name: 'Sunrise Hostel',  meals: 340 },
    { name: 'City Canteen',    meals: 280 },
    { name: 'Greenleaf Café',  meals: 195 },
    { name: 'Metro Kitchen',   meals: 160 },
    { name: 'Campus Dining',   meals: 120 },
  ],
  topRecipients: [
    { name: 'Asha Trust',      meals: 420 },
    { name: 'Hope Kitchen',    meals: 310 },
    { name: 'City Shelter',    meals: 240 },
    { name: 'Green Hope NGO',  meals: 180 },
    { name: 'Sunrise Home',    meals: 90  },
  ],
  outcomes: [
    { name: 'Rescued',  value: 78, color: '#10b981' },
    { name: 'Pending',  value: 16, color: '#f97316' },
    { name: 'Failed',   value: 6,  color: '#ef4444' },
  ],
}

/* ─── AI Chat Pre-scripted Responses ─────────────────────────── */
export const chatReplies = {
  status:   `Your latest donation <strong>D-001</strong> (80 meals) had a pickup failure at 6:45 PM. The Rescue Engine found a split solution: Asha Trust (50 meals) + Hope Kitchen (30 meals). Both have accepted. ✅`,
  rescue:   `Rescue Engine triggered at 6:46 PM. Scanned 23 recipients in 1.8 seconds. No single recipient had capacity for all 80 meals, so a 2-way split was initiated. Recovery rate: 100% of original quantity. ⚡`,
  split:    `Your 80-meal donation is split: <strong>Asha Trust gets 50 meals</strong> (1.2 km, 98% success rate) and <strong>Hope Kitchen gets 30 meals</strong> (2.1 km, 94% success rate). Both have confirmed pickup. ✂️`,
  cancel:   `No worries! When a recipient cancels, the Rescue Recovery Engine automatically activates within seconds. It finds alternatives or splits the donation — before your food deadline. ⚡`,
  predict:  `Based on your last 30 days: Tuesdays average <strong>75–80 portions</strong> surplus. Confidence: High. Today's estimate matches your historical pattern. 🔮`,
  match:    `Matching uses 5 weighted factors: Capacity (30%), Distance (25%), Availability (20%), Deadline fit (15%), and Past success rate (10%). Top match: Asha Trust scored 94/100. 🎯`,
  help:     `I can help with:\n• Donation status & history\n• Rescue options & split details\n• Matching score explanations\n• Surplus predictions\n• Handover confirmation\n\nJust ask! 😊`,
  default:  `Let me check the latest donation data for you… Found 2 active donations: D-001 (RESCUE_TRIGGERED) and D-002 (MATCHED). Would you like details on either? 🔍`,
}

/* ─── Demo Scenarios (for Demo Panel) ───────────────────────── */
export const demoScenarios = [
  {
    id: 1,
    title: 'Normal Donation Flow',
    emoji: '🍱',
    desc: 'Donor logs 80 meals → AI predicts surplus → Engine matches City Shelter NGO',
    steps: ['Donor logs donation', 'AI shows ~75 portion estimate', 'Engine scans 23 recipients', 'City Shelter matched (score: 91)'],
    route: '/donor',
    color: '#10b981'
  },
  {
    id: 2,
    title: 'Rescue Recovery Engine',
    emoji: '⚡',
    desc: 'City Shelter cancels → Engine triggers → Split donation: Asha Trust + Hope Kitchen',
    steps: ['City Shelter declines at 6:45 PM', 'Rescue Engine fires in <2s', 'Split found: 50+30 meals', 'Both recipients accept'],
    route: '/rescue',
    color: '#ef4444'
  },
  {
    id: 3,
    title: 'Matching Engine Results',
    emoji: '🎯',
    desc: 'See ranked recipients with AI scores, factor breakdown, and distance map',
    steps: ['Top match: Asha Trust (94/100)', 'Factor bars: capacity, distance, deadline', 'Assign button → confirmation flow', 'Map shows donor + recipient pins'],
    route: '/matching',
    color: '#3b82f6'
  },
]
