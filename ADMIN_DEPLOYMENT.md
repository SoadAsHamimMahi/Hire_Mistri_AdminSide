# Hire Mistri Admin – Deployment Checklist

## Environment variables

### Server (HireMistri-Server)

- `MONGODB_URI` – MongoDB connection string
- `FIREBASE_SERVICE_ACCOUNT_PATH` – Path to Firebase service account JSON (for admin token verification)
- `PORT` – API port (default 5000)
- `ADMIN_SEED_UID` – Firebase UID of first admin (for seed script)
- `ADMIN_SEED_EMAIL` – Email of first admin (for seed script)

### Admin frontend (Hire_Mistri_AdminSide)

Same Firebase config as client app (so the same users can sign in):

- `VITE_apiKey`
- `VITE_authDomain`
- `VITE_projectId`
- `VITE_storageBucket`
- `VITE_messagingSenderId`
- `VITE_appId`

Create `.env` from `.env.example` and set these (use the same values as Hire_Mistri_ClientSide if sharing Firebase project).

## First-time admin access

1. Ensure the server has Firebase Admin initialized (valid `FIREBASE_SERVICE_ACCOUNT_PATH`).
2. Seed an admin user:
   ```bash
   cd HireMistri-Server && node scripts/seed-admin-user.js
   ```
3. That user must sign in with the same Firebase project (email/password or Google) used by the client app. Their Firebase UID must match `ADMIN_SEED_UID` in the server `.env`.

## CORS

Server uses `app.use(cors())`. For production, restrict `origin` to the admin frontend origin(s).

## Build and run

- **Admin frontend**
  - Dev: `npm run dev` (port 5174, proxies `/api` to server)
  - Build: `npm run build` → serve `dist/` (e.g. static host or same host as API with reverse proxy)

- **Server**
  - Run: `node index.js` or `npm start`
  - Ensure MongoDB is reachable and Firebase service account file exists.

## Permission matrix

- Users in `adminUsers` with `permissions: ['*']` can access all admin routes.
- Users with a specific permission array can only access routes whose required permission is in that array (see `src/constants/permissions.js` for route-to-permission mapping).
- Unauthenticated or non-admin users get 401/403.

## QA smoke checklist

- [ ] Login with seeded admin → redirect to Dashboard
- [ ] Dashboard shows provider/booking/customer counts and recent bookings table
- [ ] Sidebar: open each section and navigate to every menu item (no 404)
- [ ] Providers: list, filter by status, suspend/activate (with confirm)
- [ ] Bookings: list, filter by status
- [ ] Customers: list with pagination
- [ ] Services: list with pagination
- [ ] Payment Request, Settlements: list
- [ ] Support → User Queries, Promo Codes, FAQs: list loads
- [ ] Logout → redirect to login
