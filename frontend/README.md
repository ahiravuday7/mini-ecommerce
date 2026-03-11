# Mini Store Frontend

React + Vite frontend for the Mini Store MERN project.

## Features

- Public shopper pages: Home, Products, Product Details, FAQs, About, Contact, Returns, Shipping, Privacy Policy, Careers
- Authentication: Register, Login, Forgot Password, session restore using cookie-based auth
- User pages: Cart, Checkout, My Orders, Order Details, Account profile/shipping management
- Admin pages: Dashboard, Products, Categories, FAQs, Users, User Details
- Route protection with role-aware guards (`ShopperRoute`, `UserRoute`, `AdminRoute`)

## Tech Stack

- React 19
- Vite 7
- React Router DOM 7
- Axios
- Bootstrap 5 + Bootstrap Icons

## Prerequisites

- Node.js 18+ (recommended)
- Backend API running (default: `http://localhost:5000`)

## Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

If your backend runs on a different host/port, update `VITE_API_URL` accordingly.

## Setup & Run

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite default URL: `http://localhost:5173`

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint

## Client ZIP Handoff Notes

- Share the full project ZIP (`frontend` + `backend`) for easiest setup.
- Do not include `node_modules` folders in ZIP (client should run `npm install`).
- Keep environment values configurable. If needed, provide an `.env.example` instead of private values.
- Ensure backend CORS allows the frontend origin and credentials (cookies), otherwise login/session will fail.

## Quick Start for Client

1. Unzip project.
2. Start backend first (`cd backend && npm install && npm run dev`).
3. Start frontend (`cd frontend && npm install && npm run dev`).
4. Open `http://localhost:5173`.
