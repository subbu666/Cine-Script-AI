<div align="center">

```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░                                                                         ░
░    ██████╗██╗███╗   ██╗███████╗███████╗ ██████╗██████╗ ██╗██████╗████████╗  ░
░   ██╔════╝██║████╗  ██║██╔════╝██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝ ░
░   ██║     ██║██╔██╗ ██║█████╗  ███████╗██║     ██████╔╝██║██████╔╝   ██║    ░
░   ██║     ██║██║╚██╗██║██╔══╝  ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║    ░
░   ╚██████╗██║██║ ╚████║███████╗███████║╚██████╗██║  ██║██║██║        ██║    ░
░    ╚═════╝╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝    ░
░                                                                         ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### _Ab har pal ko blockbuster bana do_

#### Turn any moment into a Bollywood masterpiece — powered by AI

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/cloud)
[![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3-F55036?style=for-the-badge)](https://console.groq.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer](https://img.shields.io/badge/Framer-Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://framer.com/motion)
[![License](https://img.shields.io/badge/License-MIT-gold?style=for-the-badge)](LICENSE)

<br/>

[✨ Features](#-features) · [🏗 Architecture](#-architecture) · [⚡ Quick Start](#-quick-start) · [📡 API Reference](#-api-reference) · [🎨 Design System](#-design-system) · [🔐 Security](#-security) · [🚀 Deployment](#-deployment)

</div>

---

## 🎬 What is CineScript?

**CineScript** is a full-stack AI-powered Bollywood script generator. You describe a situation — any situation — choose a dramatic mood, and the app conjures a complete cinematic screenplay: title, tagline, characters, scene-by-scene breakdown, and dialogue. All of it in seconds.

The project is a **monorepo** with two packages:

| Package     | Stack                                                | Purpose                                          |
| ----------- | ---------------------------------------------------- | ------------------------------------------------ |
| `frontend/` | React 19 · TanStack Start · Tailwind · Framer Motion | Cinematic UI — gold-on-black Bollywood aesthetic |
| `backend/`  | Node.js · Express · MongoDB · Groq Llama 3.3 70B     | REST API — auth, AI generation, persistence      |

---

## ✨ Features

### 🎭 Core Experience

- **AI Script Generation** — Describe any situation, pick a mood, get a full screenplay with scenes and dialogue
- **8 Cinematic Moods** — Dramatic · Comedy · Romantic · Action · Thriller · Horror · Inspirational · Noir
- **Script Dashboard** — Beautiful output with character cards, scene cards, and formatted dialogue
- **Script History** — Paginated archive of every script you've ever generated
- **Favorites** — Bookmark your best work for later
- **Statistics** — Track your creative output: total scripts, moods explored, scenes written

### 🔐 Authentication

- Email + password signup with **OTP email verification**
- Secure login with **JWT tokens** (HTTP-only cookies + Authorization header)
- **3-phase forgot-password wizard** — request OTP → verify → reset
- 6-tier **password strength meter** with real-time feedback

### 🛡️ Production-Grade Reliability

- Per-IP and per-email **rate limiting** on every sensitive route
- **Joi schema validation** on every request body
- Graceful fallback to **local mock generator** when backend is unreachable
- Centralized **error handling** with consistent response envelopes
- **Winston + Morgan** logging with daily log rotation

---

## 🏗 Architecture

```
cinescript/
├── frontend/                        # React 19 + TanStack Start
│   ├── src/
│   │   ├── routes/                  # File-based routing
│   │   │   ├── index.tsx            # / — landing + generator
│   │   │   ├── login.tsx            # /login
│   │   │   ├── signup.tsx           # /signup
│   │   │   ├── verify-otp.tsx       # /verify-otp
│   │   │   └── forgot-password.tsx  # /forgot-password (3-phase wizard)
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Auth-aware top navigation
│   │   │   ├── Hero.tsx             # Cinematic landing hero
│   │   │   ├── InputForm.tsx        # Situation + mood + generate
│   │   │   ├── OutputDisplay.tsx    # Full movie dashboard
│   │   │   ├── CharacterCard.tsx    # Glassmorphism character card
│   │   │   ├── SceneCard.tsx        # Scene + dialogue card
│   │   │   ├── HistoryPanel.tsx     # Slide-in history sidebar
│   │   │   ├── AuthCard.tsx         # Shared auth form shell
│   │   │   └── PasswordStrength.tsx # 6-tier strength meter
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Auth state + token persistence
│   │   ├── lib/
│   │   │   ├── api.ts               # Central API client
│   │   │   └── mockScript.ts        # Local fallback generator
│   │   └── styles.css               # Design tokens (gold/black theme)
│   └── .env                         # VITE_API_BASE_URL
│
└── backend/                         # Node.js + Express + MongoDB
    ├── src/
    │   ├── config/
    │   │   ├── database.js          # MongoDB Atlas connection
    │   │   ├── groq.js              # Groq AI client
    │   │   └── brevo.js             # Brevo email client
    │   ├── controllers/
    │   │   ├── authController.js    # Signup · OTP · login · refresh
    │   │   └── scriptController.js  # Generate · history · favorites · stats
    │   ├── models/
    │   │   ├── User.js              # bcrypt + JWT methods
    │   │   ├── Otp.js               # Expiry, attempts, resend tracking
    │   │   └── Script.js            # Embedded scenes schema
    │   ├── services/
    │   │   ├── jwtService.js        # Token generation + cookies
    │   │   ├── emailService.js      # OTP email (cinematic HTML template)
    │   │   └── groqService.js       # Prompt engineering + response parsing
    │   └── middlewares/
    │       ├── auth.js              # JWT verification
    │       ├── rateLimiter.js       # Per-route rate limits
    │       └── validator.js         # Joi validation factory
    └── .env                         # All backend secrets
```

### Request Flow

```
Browser
  │
  ├─► React UI (TanStack Router)
  │       │
  │       ├─► src/lib/api.ts  ──────── JWT Bearer token ──────────►  Express API
  │       │                                                              │
  │       └─► src/lib/mockScript.ts  ◄── fallback (no backend)          ├─► Auth Middleware
  │                                                                      ├─► Rate Limiter
  │                                                                      ├─► Joi Validator
  │                                                                      │
  │                                                                      ├─► authController
  │                                                                      │       ├─► MongoDB (User/OTP)
  │                                                                      │       └─► Brevo (OTP Email)
  │                                                                      │
  │                                                                      └─► scriptController
  │                                                                              ├─► Groq Llama 3.3 70B
  │                                                                              └─► MongoDB (Script)
  │
  ◄──────────────────────── JSON { success, message, data, meta } ──────────────
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 20+ and **Bun** (frontend runtime)
- **MongoDB Atlas** cluster — [free tier](https://www.mongodb.com/cloud) works
- **Groq API key** — [console.groq.com](https://console.groq.com)
- **Brevo account** — [brevo.com](https://www.brevo.com) (for OTP emails)

---

### 1 — Clone

```bash
git clone https://github.com/subbu666/cine-script-ai.git
cd cinescript
```

---

### 2 — Configure Backend

```bash
cd backend
cp .env.example .env
```

```env
# backend/.env

NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:8080

MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/cinescript
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

BREVO_API_KEY=xkeysib-...
FROM_EMAIL=noreply@cinescript.app

GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

```bash
npm install
npm run dev        # starts on http://localhost:5000
```

---

### 3 — Configure Frontend

```bash
cd ../frontend
cp .env.example .env
```

```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:5000/api
```

```bash
npm install
npm run dev        # starts on http://localhost:8080
```

> **No backend yet?** Leave `VITE_API_BASE_URL` blank. The frontend silently falls back to its local mock generator — the full UI works without a running server.

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

All responses use a unified envelope:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": {}
}
```

All errors return:

```json
{
  "success": false,
  "message": "Human-readable description",
  "errors": [{ "field": "email", "message": "Email is required" }]
}
```

---

### Authentication Routes

| Method | Endpoint           | Description                   | Auth Required |
| ------ | ------------------ | ----------------------------- | :-----------: |
| `POST` | `/auth/signup`     | Register — triggers OTP email |       —       |
| `POST` | `/auth/verify-otp` | Verify OTP → issue JWT        |       —       |
| `POST` | `/auth/resend-otp` | Resend verification OTP       |       —       |
| `POST` | `/auth/login`      | Login with email + password   |       —       |
| `GET`  | `/auth/me`         | Get current user profile      |      ✅       |
| `POST` | `/auth/logout`     | Logout + clear token          |      ✅       |
| `POST` | `/auth/refresh`    | Refresh JWT                   |      ✅       |

<details>
<summary><strong>POST /auth/signup</strong> — Register & send OTP</summary>

**Request**

```json
{
  "name": "Karan Johar",
  "email": "karan@studio.com",
  "password": "SecurePass123"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Signup initiated. Check your email for the verification code.",
  "data": {
    "email": "karan@studio.com",
    "expiresAt": "2026-05-16T10:35:00.000Z"
  }
}
```

**Errors** — `409` email exists · `400` validation failed · `500` email service down

</details>

<details>
<summary><strong>POST /auth/verify-otp</strong> — Verify OTP & create account</summary>

**Request**

```json
{ "email": "karan@studio.com", "otp": "482915" }
```

**Response `201`**

```json
{
  "success": true,
  "message": "Account verified successfully! Welcome to CineScript.",
  "data": {
    "user": {
      "id": "64f1...",
      "name": "Karan Johar",
      "email": "karan@studio.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors** — `400` invalid/expired OTP · `429` max attempts exceeded

</details>

<details>
<summary><strong>POST /auth/login</strong> — Authenticate user</summary>

**Request**

```json
{ "email": "karan@studio.com", "password": "SecurePass123" }
```

**Response `200`**

```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "user": {
      "id": "64f1...",
      "name": "Karan Johar",
      "email": "karan@studio.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors** — `401` invalid credentials · `429` too many attempts

</details>

---

### Forgot Password — 3-Phase Wizard

The `/forgot-password` page guides users through three discrete phases. During development, the generated OTP is returned as `devOtp` in the response so QA can complete the flow without an inbox. **Remove `devOtp` before production.**

<details>
<summary><strong>Phase 1 — POST /auth/forgot-password</strong> — Send OTP</summary>

Always returns success to prevent account enumeration.

**Request**

```json
{ "email": "karan@studio.com" }
```

**Response `200`**

```json
{ "ok": true, "message": "If that email exists, a code has been sent." }
```

> Dev only: `"devOtp": "482915"` — never ship this to production.

**Error** — `429` rate limit (3 requests / 15 min per email or IP)

</details>

<details>
<summary><strong>Phase 2 — POST /auth/verify-otp</strong> — Verify & get reset token</summary>

**Request**

```json
{ "email": "karan@studio.com", "otp": "482915" }
```

**Response `200`**

```json
{ "resetToken": "a1b2c3d4e5f6..." }
```

**Errors** — `400` incorrect OTP · `400` OTP expired · `429` max attempts

</details>

<details>
<summary><strong>Phase 3 — POST /auth/reset-password</strong> — Set new password</summary>

Consumes the `resetToken`, updates the password, invalidates all existing sessions.

**Request**

```json
{ "resetToken": "a1b2c3d4e5f6...", "password": "NewBlockbuster#2025" }
```

**Response `200`**

```json
{ "ok": true }
```

**Errors** — `400` invalid/expired token · `422` password requirements not met

</details>

---

### Script Routes

| Method   | Endpoint               | Description              | Auth Required |
| -------- | ---------------------- | ------------------------ | :-----------: |
| `POST`   | `/script/generate`     | Generate a new script    |      ✅       |
| `GET`    | `/script/history`      | Paginated script history |      ✅       |
| `GET`    | `/script/stats`        | User statistics          |      ✅       |
| `GET`    | `/script/:id`          | Fetch a single script    |      ✅       |
| `PATCH`  | `/script/:id/favorite` | Toggle favorite          |      ✅       |
| `DELETE` | `/script/:id`          | Delete a script          |      ✅       |

**Available moods:** `dramatic` · `comedy` · `romantic` · `action` · `thriller` · `horror` · `inspirational` · `noir`

<details>
<summary><strong>POST /script/generate</strong> — Generate a screenplay</summary>

**Request**

```json
{ "situation": "I missed my train and met a stranger…", "mood": "dramatic" }
```

**Response `201`**

```json
{
  "success": true,
  "message": "Script generated successfully!",
  "data": {
    "id": "64f2...",
    "title": "Jab Tak Tum Ho",
    "tagline": "Har lamha ek toofan hai…",
    "mood": "dramatic",
    "situation": "I missed my train…",
    "scenes": [
      {
        "sceneIndex": 1,
        "description": "Rain drums on the windows as two strangers lock eyes.",
        "dialogue": "Aarav: Tum yahaan?\nPriya: Main bhi pooch sakti hoon..."
      }
    ],
    "sceneCount": 4,
    "createdAt": "2026-05-16T10:30:00.000Z",
    "generationTimeMs": 2341
  }
}
```

**Errors** — `401` not authenticated · `429` AI rate limit · `400` invalid mood · `503` AI service down

</details>

<details>
<summary><strong>GET /script/history</strong> — Paginated history with mood filter</summary>

**Query Parameters**

| Param   | Type   | Default | Description       |
| ------- | ------ | ------- | ----------------- |
| `page`  | number | `1`     | Page number       |
| `limit` | number | `10`    | Per page (max 50) |
| `mood`  | string | —       | Filter by mood    |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "title": "Jab Tak Tum Ho",
      "mood": "dramatic",
      "isFavorite": false,
      "...": "..."
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

</details>

<details>
<summary><strong>GET /script/stats</strong> — User statistics</summary>

**Response `200`**

```json
{
  "success": true,
  "data": {
    "totalScripts": 25,
    "favoriteScripts": 3,
    "averageScenesPerScript": 4.2,
    "moodsExplored": 5,
    "moodBreakdown": ["dramatic", "comedy", "romantic", "thriller", "action"]
  }
}
```

</details>

---

## 🚦 Rate Limits

| Endpoint              | Limit        | Window     |
| --------------------- | ------------ | ---------- |
| OTP (signup / resend) | 3 requests   | 5 minutes  |
| Forgot password       | 3 requests   | 15 minutes |
| Login                 | 5 attempts   | 15 minutes |
| AI Generation         | 10 requests  | 1 minute   |
| General API           | 100 requests | 15 minutes |

Rate limit state is returned in response headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1715856000
```

---

## 🔐 Security

| Mechanism        | Implementation                                            |
| ---------------- | --------------------------------------------------------- |
| Password hashing | bcrypt · 12 salt rounds                                   |
| OTP hashing      | bcrypt · 10 salt rounds                                   |
| OTP lifetime     | 5 minutes · auto-deleted after use                        |
| OTP limits       | Max 5 verification attempts · max 3 resends               |
| JWT delivery     | HTTP-only cookies + `Authorization: Bearer` header        |
| Cookie flags     | `httpOnly` · `secure` · `sameSite=strict`                 |
| Security headers | Helmet.js                                                 |
| Input validation | Joi schemas on every endpoint                             |
| CORS             | Restricted to `CLIENT_URL` only                           |
| Rate limiting    | Per-IP and per-email on sensitive routes                  |
| Reset tokens     | Single-use · 10 min TTL · invalidates all sessions on use |

### Password Rules

Enforced on the frontend (strength meter score ≥ 3 required) and must be mirrored server-side:

| Rule                                             | Status      |
| ------------------------------------------------ | ----------- |
| 8+ characters                                    | ✅ Required |
| Uppercase letter                                 | ✅ Required |
| Lowercase letter                                 | ✅ Required |
| Number                                           | ✅ Required |
| Symbol                                           | ✅ Required |
| 12+ characters                                   | ⭐ Bonus    |
| No common words (`password`, `qwerty`, `admin`…) | ✅ Required |
| No 3+ character repeats (`aaaa`, `1111`…)        | ✅ Required |

---

## 🎨 Design System

CineScript uses a cinematic **gold-on-black** aesthetic. All tokens live in `frontend/src/styles.css` as `oklch` values.

| Token        | Value              | Role                            |
| ------------ | ------------------ | ------------------------------- |
| Background   | `#0A0A0A`          | App canvas                      |
| Gold start   | `#C9A227`          | Gradient from                   |
| Gold end     | `#FFD700`          | Gradient to                     |
| Display font | Cormorant Garamond | Titles, taglines, scene headers |
| Body font    | Inter              | UI labels, body text            |

**Custom Tailwind utilities:**

| Class                | Effect                            |
| -------------------- | --------------------------------- |
| `text-gold-gradient` | Animated gold shimmer text        |
| `glass`              | Frosted glass card background     |
| `glass-gold`         | Gold-tinted frosted glass         |
| `glow-gold`          | Gold drop-shadow on focus / hover |
| `shimmer`            | CSS keyframe shimmer overlay      |

All interactive elements respond with a gold glow on hover/focus. Page transitions and card reveals are handled by **Framer Motion**.

---

## 🚀 Deployment

### Backend (e.g. Railway / Render / Fly.io)

```bash
cd backend
npm install
npm start
```

Set all production environment variables in your host's dashboard. Ensure `NODE_ENV=production` and `CLIENT_URL` points to your deployed frontend domain.

### Frontend (e.g. Vercel / Netlify)

```bash
cd frontend
bun run build       # outputs to dist/
```

Set `VITE_API_BASE_URL` to your deployed backend URL in the host's environment settings.

> **CORS**: The backend's CORS policy is locked to `CLIENT_URL`. Update this env var to match your production frontend domain or requests will be blocked.

---

## 🛠 External Service Setup

<details>
<summary><strong>MongoDB Atlas</strong></summary>

1. Create an account at [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Create a free-tier cluster
3. Under **Database Access**, create a database user with read/write privileges
4. Under **Network Access**, add `0.0.0.0/0` (or your server IP for tighter security)
5. Click **Connect → Drivers → Node.js**, copy the connection string
6. Replace `<password>` and set as `MONGODB_URI` in `backend/.env`
</details>

<details>
<summary><strong>Groq API (AI Engine)</strong></summary>

1. Sign up at [console.groq.com](https://console.groq.com)
2. Navigate to **API Keys → Create New Key**
3. Set as `GROQ_API_KEY` in `backend/.env`
4. Optionally override the model with `GROQ_MODEL` (default: `llama-3.3-70b-versatile`)
</details>

<details>
<summary><strong>Brevo (OTP Emails)</strong></summary>

1. Create an account at [brevo.com](https://www.brevo.com)
2. Go to **SMTP & API → API Keys → Create Key**
3. The key starts with `xkeysib-` — set as `BREVO_API_KEY` in `backend/.env`
4. Verify your sender address under **Senders & IP** in the Brevo dashboard
5. Set it as `FROM_EMAIL` in `backend/.env`
</details>

---

## 📦 Full Environment Reference

### `backend/.env`

| Variable        | Required | Description                     | Example                   |
| --------------- | -------- | ------------------------------- | ------------------------- |
| `NODE_ENV`      | No       | Runtime mode                    | `development`             |
| `PORT`          | No       | Server port                     | `5000`                    |
| `CLIENT_URL`    | No       | Frontend origin (CORS)          | `http://localhost:8080`   |
| `MONGODB_URI`   | **Yes**  | MongoDB Atlas connection string | `mongodb+srv://...`       |
| `JWT_SECRET`    | **Yes**  | JWT signing secret              | `super-secret-key`        |
| `JWT_EXPIRE`    | No       | Token expiry                    | `7d`                      |
| `BREVO_API_KEY` | **Yes**  | Brevo email API key             | `xkeysib-...`             |
| `FROM_EMAIL`    | No       | Sender address                  | `noreply@cinescript.app`  |
| `GROQ_API_KEY`  | **Yes**  | Groq API key                    | `gsk_...`                 |
| `GROQ_MODEL`    | No       | LLM model override              | `llama-3.3-70b-versatile` |

### `frontend/.env`

| Variable            | Required | Description          | Example                     |
| ------------------- | -------- | -------------------- | --------------------------- |
| `VITE_API_BASE_URL` | **Yes**  | Backend API base URL | `http://localhost:5000/api` |

---
