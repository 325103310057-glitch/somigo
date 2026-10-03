# Somi Go — Production Food Delivery Platform

Production-grade food delivery application featuring:
- **Android App**: Kotlin + Jetpack Compose with Material Design 3, real Google Sign-In with Credential Manager, and Firebase Authentication
- **Render Backend**: Node.js + Express + TypeScript service using Firebase Admin SDK for authoritative identity verification
- **Supabase PostgreSQL**: Authoritative relational database for restaurants, menus, orders, cart items, customer addresses, and reviews

---

## 🏛 Architecture Overview

```
Android Somi Go (Kotlin + Compose)
       │ (Google Sign-In / Credential Manager)
       ▼
Firebase Authentication
       │ (Signed Firebase ID Token)
       ▼
Render Backend API (Node.js + Express)
       │ (Firebase Admin SDK: verifyIdToken)
       ▼
Supabase PostgreSQL (Authoritative DB)
```

> **Security Guarantee**: The privileged `SUPABASE_SERVICE_ROLE_KEY` exists **only** on the Render backend environment. The Android app only holds the Firebase client configuration (`google-services.json`) and public API endpoints.

---

## 📁 Repository Structure

```
SomiGo/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/        # Jetpack Compose UI, ViewModels, Repositories
│   │   │   ├── res/                     # Strings, Drawables, Mipmap Icons
│   │   │   └── AndroidManifest.xml
│   │   └── test/                        # Local JVM & Robolectric CUJ Tests
│   ├── build.gradle.kts                 # applicationId: com.aistudio.bitedash.kfqwzx
│   └── google-services.json             # Firebase configuration (somi-go)
├── backend/
│   ├── src/
│   │   ├── app.ts                       # Express application setup
│   │   ├── server.ts                    # Production server entry point (PORT)
│   │   ├── config/                      # Environment & Firebase Admin initialization
│   │   ├── db/                          # Supabase server-side client provider
│   │   ├── middleware/auth.ts           # requireFirebaseAuth ID token validator
│   │   ├── routes/                      # Health, Auth, Restaurants, Cart, Orders, etc.
│   │   ├── services/                    # Business logic and database operations
│   │   └── tests/                       # Unit & integration tests
│   ├── supabase/
│   │   └── migrations/                  # Numbered SQL migrations for Supabase
│   ├── package.json
│   ├── tsconfig.json
│   ├── render.yaml                      # Render Blueprint deployment definition
│   ├── .env.example                     # Environment template
│   └── README.md
├── gradle/
├── build.gradle.kts
├── settings.gradle.kts
├── metadata.json                        # AI Studio app metadata
└── .gitignore
```

---

## 🔧 Firebase Setup

1. **Firebase Project**: `somi-go`
2. **Android Package**: `com.aistudio.bitedash.kfqwzx`
3. **App ID**: `1:518203389730:android:14e03f4cb14ac024b4577b`
4. **Google Sign-In**:
   - Go to [Firebase Console](https://console.firebase.google.com/) -> Project `somi-go`.
   - In **Authentication** -> **Sign-in method**, enable **Google**.
   - In **Project Settings** -> **Your Apps** -> Android app (`com.aistudio.bitedash.kfqwzx`), add your SHA-1 fingerprint (from your Android debug or upload keystore).
   - Copy the Web Client ID (ending with `.apps.googleusercontent.com`) and paste it into `WEB_CLIENT_ID` in `.env` or the Secrets panel.

---

## 🗄️ Supabase PostgreSQL Setup

1. Create a project at [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard and run the migrations in order:
   - `backend/supabase/migrations/001_create_schema.sql` (Creates enums, tables, foreign keys, and indexes)
   - `backend/supabase/migrations/002_seed_data.sql` (Seeds restaurants, menus, dishes, and coupons)
3. From **Project Settings** -> **API**, copy:
   - **Project URL** -> `SUPABASE_URL`
   - **service_role secret key** -> `SUPABASE_SERVICE_ROLE_KEY` (Used ONLY on Render backend)

---

## 🚀 Render Backend Deployment

1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/):
   - Click **New +** -> **Web Service** (or use the Blueprint from `backend/render.yaml`).
   - Root directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Health check path: `/api/v1/health`
3. Add Environment Variables on Render:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `FIREBASE_PROJECT_ID`: `somi-go`
   - `SUPABASE_URL`: `https://YOUR-PROJECT.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `YOUR_SUPABASE_SERVICE_ROLE_KEY`
   - Optional: `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` (if not using Google Cloud default credentials)
4. After deployment, your live API URL will be:
   `https://<your-render-subdomain>.onrender.com/api/v1/`

---

## 📱 Android Configuration

1. Set your backend URL in `.env` or Secrets panel:
   ```
   BACKEND_API_URL=https://<your-render-subdomain>.onrender.com/api/v1/
   ```
2. Build and launch:
   - In AI Studio, the streaming preview loads automatically.
   - For local CLI: `./gradlew assembleDebug`
