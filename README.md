# CIC Network - Frontend

A minimalistic, clean member network platform UI for the Circular Innovation Council. Built with React and TailwindCSS.

## Features

- **Clean Design** - Minimalist interface with intuitive navigation
- **Member Directory** - Browse and filter member companies
- **Company Profiles** - View detailed company information and loyalty levels
- **Listing System** - Create and view member listings by category
- **Loyalty Progression** - Visual loyalty tier display with progression tracking
- **Authentication** - Simple login system with demo credentials

## Quick Start

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

**Demo Credentials:**
- Username: `test_user`
- Password: `test_password`

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── NavBar.tsx
│   │   └── LoyaltyBadge.tsx
│   ├── pages/            # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── DirectoryPage.tsx
│   │   ├── CompanyProfilePage.tsx
│   │   └── ListingsPage.tsx
│   ├── services/         # Services and auth logic
│   │   ├── apiService.ts (mock data)
│   │   └── authContext.tsx
│   ├── types/           # TypeScript interfaces
│   └── App.tsx          # Main app with routing
├── tailwind.config.js
└── package.json
```

## Pages

- **Dashboard** - Overview of your company and loyalty progress
- **Directory** - Browse member companies with filters and sorting
- **Company Profile** - Detailed view of any member company
- **Listings** - Create and discover member offerings and opportunities

## Tech Stack

- React 18
- TypeScript
- TailwindCSS
- React Router v6

## Design Philosophy

The frontend uses a **minimalist design** approach:
- Clean typography with ample whitespace
- Subtle color palette
- Simple forms and intuitive navigation
- Card-based layouts for content organization
- Responsive design for all screen sizes

## Customization

Edit colors and styling in `tailwind.config.js`. The design uses a simple, professional color palette suitable for a network platform.

### Key Files to Customize

- `tailwind.config.js` - Colors, fonts, spacing
- `src/components/NavBar.tsx` - Navigation branding
- `src/pages/LoginPage.tsx` - Auth messaging

## Mock Data

The application uses mock data for:
- 4 sample companies with different loyalty tiers
- 3 sample listings across categories
- 2 demo user accounts

See `src/services/apiService.ts` for the mock data definitions.

## Notes

- This is a frontend-only implementation without a backend
- All data is stored in memory (localStorage for auth state only)
- Changes are not persisted across page refreshes (except user login state)
- For production use, integrate with a real backend API