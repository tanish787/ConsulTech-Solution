# CIC Member Network Platform

A full-stack web platform for the CIC (Circular Innovation Council) member network. Members can discover other companies, post listings, and track their loyalty tier based on membership duration.

## Tech Stack

- **Backend**: Node.js + Express + SQLite (via better-sqlite3)
- **Frontend**: React + TypeScript + TailwindCSS

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env   # edit JWT_SECRET as needed
npm install
npm start              # runs on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm start              # runs on http://localhost:3000
```

## Default Test Credentials

| Email | Password | Company | Tier |
|---|---|---|---|
| admin@cic.ca | admin123 | CIC Admin Co | Champion (admin) |
| greentech@example.com | password123 | GreenTech Solutions | Contributor |
| eco@example.com | password123 | EcoVentures Inc | Participant |
| circular@example.com | password123 | CircularMaterials Ltd | Champion |
| fresh@example.com | password123 | FreshStart Startup | Explorer |

## Loyalty Tier System

Membership tier is calculated automatically from `membership_start_date`:

| Tier | Duration | Badge | Key Privileges |
|---|---|---|---|
| 🌱 Explorer | 0–3 months | Gray | View network |
| 🔵 Participant | 3–12 months | Blue | + Attend events |
| 🟢 Contributor | 1–3 years | Green | + Create listings |
| ⭐ Champion | 3+ years | Gold | + Featured badge, priority visibility |

## API Endpoints

### Auth
- `POST /api/auth/register` – Register company + user
- `POST /api/auth/login` – Login, returns JWT
- `GET /api/auth/me` – Get current user (requires Bearer token)

### Companies
- `GET /api/companies` – List approved companies (filter: industry, size; sort: name, duration, loyalty)
- `GET /api/companies/:id` – Get company details + listings
- `PUT /api/companies/:id` – Update own company profile

### Listings
- `GET /api/listings` – List all listings (filter: category)
- `POST /api/listings` – Create listing (Contributor+ only)
- `PUT /api/listings/:id` – Edit own listing (Contributor+)
- `DELETE /api/listings/:id` – Delete own listing

### Admin
- `GET /api/admin/pending` – List unapproved companies
- `POST /api/admin/approve/:id` – Approve a company
- `PUT /api/admin/companies/:id/date` – Adjust membership_start_date
- `DELETE /api/admin/listings/:id` – Remove any listing

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.js            # Express app entry
│   │   ├── database.js         # SQLite setup, migrations, seed data
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification
│   │   │   └── loyaltyAuth.js  # Tier-based authorization
│   │   ├── services/
│   │   │   └── loyaltyService.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── companies.js
│   │       ├── listings.js
│   │       └── admin.js
│   └── .env.example
└── frontend/
    └── src/
        ├── api/         # Axios API calls
        ├── contexts/    # AuthContext
        ├── components/  # Navbar, LoyaltyBadge, CompanyCard, etc.
        └── pages/       # LoginPage, DashboardPage, DirectoryPage, etc.
```
