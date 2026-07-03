# Medical Camp Finder

AI-powered healthcare platform that helps patients discover free or affordable medical camps, diagnostic services, and government healthcare schemes.

## Features

- **Camp Discovery** — Browse and filter medical camps by city, specialty, cost, and transport
- **AI / NLP Search** — Natural language queries like "free eye checkup in Mumbai"
- **Smart Recommendations** — Personalized camp suggestions based on location, health needs, and budget
- **Online Slot Booking** — Real-time slot availability and appointment booking
- **Government Schemes** — Database of healthcare schemes (Ayushman Bharat, JSY, RBSK, etc.)
- **Notifications** — Booking confirmations, camp reminders, and new camp alerts
- **Transport Assistance** — Find camps with free pickup and shuttle services
- **Location Services** — Google Maps integration for directions
- **Admin Panel** — Manage camps, view bookings, and platform statistics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | JSON file storage (portable, no native deps) |
| Auth | JWT + bcrypt |
| AI/NLP | Custom NLP parser with medical synonym mapping |
| Recommendations | Scoring engine (location, specialty, budget, availability) |

## Project Structure

```
Helper/
├── backend/
│   ├── db/database.js          # JSON database layer
│   ├── middleware/auth.js      # JWT authentication
│   ├── routes/                 # API routes
│   ├── services/
│   │   ├── nlp.js              # NLP query processing
│   │   ├── recommendation.js   # AI recommendation engine
│   │   └── notifications.js    # Notification service
│   ├── seed.js                 # Sample data
│   └── server.js               # Express server
├── frontend/
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Application pages
│       ├── context/            # Auth context
│       └── services/api.js     # API client
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Seed the database with sample data
npm run seed

# Start backend server (port 5000)
npm start

# In a new terminal — install frontend dependencies
cd frontend
npm install

# Start frontend dev server (port 3000)
npm run dev
```

Open **http://localhost:3000** in your browser.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medcamp.com | admin123 |
| Patient | rahul@email.com | patient123 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new patient |
| POST | /api/auth/login | Login |
| GET | /api/camps | List camps with filters |
| GET | /api/camps/ai/search?q= | NLP-powered search |
| GET | /api/camps/ai/recommendations | Personalized recommendations |
| POST | /api/bookings | Book a camp slot |
| GET | /api/schemes | List government schemes |
| GET | /api/notifications | User notifications |
| GET | /api/admin/stats | Admin dashboard stats |

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | / | Landing page with hero search |
| Find Camps | /camps | Browse and filter all camps |
| AI Search | /ai-search | Natural language camp search |
| Camp Details | /camps/:id | Full camp info with maps |
| Book Slot | /camps/:id/book | Appointment booking |
| Recommendations | /recommendations | AI-personalized camps |
| Govt Schemes | /schemes | Government healthcare programs |
| Dashboard | /dashboard | User bookings and alerts |
| Profile | /profile | Health preferences and location |
| Notifications | /notifications | All notifications |
| Admin | /admin | Camp management (admin only) |

## License

Built for educational and healthcare accessibility purposes.
