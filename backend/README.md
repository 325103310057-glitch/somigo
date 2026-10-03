# Somi Go — Production Node.js & TypeScript Backend

This is the production backend for **Somi Go** (food delivery platform).
It is designed for zero-downtime deployment on [Render](https://render.com) and communicates with:
* **Firebase Authentication (Firebase Admin SDK)** for identity verification
* **Supabase PostgreSQL** as the authoritative relational database

---

## 🛠 Features

- **Authoritative Firebase Verification**: Uses `firebase-admin` to verify ID token signature, issuer, expiration, project (`somi-go`), and UID.
- **Supabase PostgreSQL**: Manages relational tables for `users`, `profiles`, `customer_addresses`, `restaurants`, `menu_items`, `carts`, `cart_items`, `orders`, `order_items`, `payments`, `favorites`, and `reviews`.
- **Render Ready**: Standardized `render.yaml` blueprint with health check at `/api/v1/health`.
- **Security Hardened**: Helmet, strict CORS, express-rate-limit, SQL-safe parameterized queries via Supabase client.

---

## 🚀 Quick Start (Local Development)

1. Navigate to backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Populate `.env`:
   - `FIREBASE_PROJECT_ID=somi-go`
   - `SUPABASE_URL=https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`

4. Run locally:
   ```bash
   npm run dev
   ```
   Server will start on `http://localhost:10000`. Health check: `http://localhost:10000/api/v1/health`.

---

## 🌐 Deploy to Render

### Method 1: Blueprint Deployment via `render.yaml`
1. Push your repository to GitHub.
2. In Render Dashboard, click **New +** -> **Blueprint**.
3. Connect your repository. Render automatically reads `backend/render.yaml`.
4. Fill in the secret environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

### Method 2: Manual Web Service
1. **New Web Service** in Render.
2. Select your repository.
3. Configure:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/api/v1/health`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `FIREBASE_PROJECT_ID`: `somi-go`
   - `SUPABASE_URL`: `https://<YOUR-SUPABASE-PROJECT>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<YOUR_SERVICE_ROLE_KEY>`

---

## 🗄️ Database Setup (Supabase)

Execute the migrations in order in your Supabase SQL Editor:
1. `backend/supabase/migrations/001_create_schema.sql`
2. `backend/supabase/migrations/002_seed_data.sql`
