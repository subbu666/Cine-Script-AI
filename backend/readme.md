<div align="center">

```
 ░██████╗░█████╗░██████╗░██╗██████╗░████████╗
 ██╔════╝██╔══██╗██╔══██╗██║██╔══██╗╚══██╔══╝
 ╚█████╗ ██║  ╚═╝██████╔╝██║██████╔╝   ██║
  ╚═══██╗██║  ██╗██╔══██╗██║██╔═══╝    ██║
 ██████╔╝╚█████╔╝██║  ██║██║██║        ██║
 ╚═════╝  ╚════╝ ╚═╝  ╚═╝╚═╝╚═╝        ╚═╝
      ░█████╗░██╗░░░░░░█████╗░██╗░░██╗███████╗███╗░░░███╗██╗░░░██╗
      ██╔══██╗██║░░░░░██╔══██╗██║░░██║██╔════╝████╗░████║╚██╗░██╔╝
      ███████║██║░░░░░██║░░╚═╝███████║█████╗░░██╔████╔██║░╚████╔╝░
      ██╔══██║██║░░░░░██║░░██╗██╔══██║██╔══╝░░██║╚██╔╝██║░░╚██╔╝░░
      ██║░░██║███████╗╚█████╔╝██║░░██║███████╗██║░╚═╝░██║░░░██║░░░
      ╚═╝░░╚═╝╚══════╝░╚════╝░╚═╝░░╚═╝╚══════╝╚═╝░░░░░╚═╝░░░╚═╝░░░
```

### _Turn any situation into a cinematic masterpiece_

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud)
[![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3-F55036?style=flat-square)](https://console.groq.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## What is Cine Script AI?

Cine Script AI is a **production-grade REST API** that transforms everyday situations into full cinematic scripts — complete with scenes, dialogue, and a title — powered by Groq's Llama 3.3 70B LLM. Users sign up with OTP-verified email, generate scripts in 8 moods, and manage their creative history.

> _"A first date gone wrong"_ → a **romantic script** with 4 scenes, punchy dialogue, and a tagline that belongs on a movie poster.

---

## Features at a Glance

| Feature                     | Details                                          |
| --------------------------- | ------------------------------------------------ |
| 🔐 **Auth**                 | Signup → OTP email verification → JWT login      |
| 🎬 **AI Script Generation** | Groq Llama 3.3 70B · 8 moods · scenes + dialogue |
| 📜 **History & Favorites**  | Paginated history, favorite toggle, delete       |
| 📊 **Stats**                | Per-user mood breakdown and script analytics     |
| 🛡️ **Security**             | bcrypt · JWT (HTTP-only cookies) · Helmet · CORS |
| ⚡ **Rate Limiting**        | Per-IP and per-email limits on every route       |
| 🧪 **Validation**           | Joi schemas on every request body                |
| 📋 **Logging**              | Winston + Morgan with daily log rotation         |

---

## Project Structure

```
backend/
├── server.js                    # Entry point with graceful shutdown
├── .env.example                 # Environment variable template
└── src/
    ├── app.js                   # Express app (middleware, routes, errors)
    ├── config/
    │   ├── env.js               # Centralized env validation
    │   ├── database.js          # MongoDB Atlas connection
    │   ├── groq.js              # Groq AI client (Llama 3.3 70B)
    │   └── brevo.js             # Brevo email client
    ├── controllers/
    │   ├── authController.js    # Signup, OTP, login, refresh, logout
    │   └── scriptController.js  # Generate, history, favorites, stats
    ├── models/
    │   ├── User.js              # User schema (bcrypt + JWT methods)
    │   ├── Otp.js               # OTP schema (expiry, attempts, resends)
    │   └── Script.js            # Script schema (embedded scenes)
    ├── routes/
    │   ├── authRoutes.js        # 7 auth endpoints
    │   └── scriptRoutes.js      # 6 script endpoints
    ├── services/
    │   ├── jwtService.js        # Token generation & cookie management
    │   ├── emailService.js      # Brevo OTP emails (HTML template)
    │   └── groqService.js       # AI prompt engineering + response parsing
    ├── middlewares/
    │   ├── auth.js              # JWT verification (required + optional)
    │   ├── errorHandler.js      # Centralized error handling
    │   ├── rateLimiter.js       # OTP, login, AI, general rate limits
    │   ├── validator.js         # Joi validation factory
    │   └── requestLogger.js     # Morgan + Winston HTTP logging
    └── utils/
        ├── ApiResponse.js       # Standardized response format
        ├── AppError.js          # Custom error classes (400–503)
        ├── asyncHandler.js      # Eliminates try-catch boilerplate
        ├── validators.js        # Joi schemas for all inputs
        └── logger.js            # Winston with daily rotation
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- A [MongoDB Atlas](https://www.mongodb.com/cloud) cluster
- A [Groq API key](https://console.groq.com)
- A [Brevo](https://www.brevo.com) account (for OTP emails)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/script-alchemy.git
cd script-alchemy/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in your credentials (see Environment Variables below)
```

### 3. Run

```bash
# Development (auto-restart on change)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:5000`.

---

## Environment Variables

| Variable        | Required | Description                     | Example                     |
| --------------- | -------- | ------------------------------- | --------------------------- |
| `NODE_ENV`      | No       | Runtime environment             | `development`               |
| `PORT`          | No       | Server port                     | `5000`                      |
| `CLIENT_URL`    | No       | Frontend origin (CORS)          | `http://localhost:5173`     |
| `MONGODB_URI`   | **Yes**  | MongoDB Atlas connection string | `mongodb+srv://...`         |
| `JWT_SECRET`    | **Yes**  | Secret for signing JWTs         | `super-secret-key`          |
| `JWT_EXPIRE`    | No       | Token expiry duration           | `7d`                        |
| `BREVO_API_KEY` | **Yes**  | Brevo email API key             | `xkeysib-...`               |
| `FROM_EMAIL`    | No       | Sender address                  | `noreply@scriptalchemy.app` |
| `GROQ_API_KEY`  | **Yes**  | Groq API key                    | `gsk_...`                   |
| `GROQ_MODEL`    | No       | LLM model name                  | `llama-3.3-70b-versatile`   |

---

## API Reference

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

---

### Authentication Endpoints

| Method | Endpoint           | Description                         | Auth |
| ------ | ------------------ | ----------------------------------- | ---- |
| `POST` | `/auth/signup`     | Register — sends OTP to email       | —    |
| `POST` | `/auth/verify-otp` | Verify OTP → create account + token | —    |
| `POST` | `/auth/resend-otp` | Resend verification OTP             | —    |
| `POST` | `/auth/login`      | Login with email + password         | —    |
| `GET`  | `/auth/me`         | Get current user profile            | ✅   |
| `POST` | `/auth/logout`     | Logout and clear token              | ✅   |
| `POST` | `/auth/refresh`    | Refresh JWT token                   | ✅   |

<details>
<summary><strong>POST /auth/signup</strong></summary>

**Request**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Signup initiated. Check your email for the verification code.",
  "data": {
    "email": "john@example.com",
    "expiresAt": "2026-05-16T10:35:00.000Z"
  }
}
```

</details>

<details>
<summary><strong>POST /auth/verify-otp</strong></summary>

**Request**

```json
{ "email": "john@example.com", "otp": "123456" }
```

**Response `201`**

```json
{
  "success": true,
  "message": "Account verified successfully! Welcome to Cine Script AI.",
  "data": {
    "user": {
      "id": "64f1...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

</details>

<details>
<summary><strong>POST /auth/login</strong></summary>

**Request**

```json
{ "email": "john@example.com", "password": "SecurePass123" }
```

**Response `200`**

```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "user": {
      "id": "64f1...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

</details>

---

### Script Endpoints

| Method   | Endpoint               | Description                               | Auth |
| -------- | ---------------------- | ----------------------------------------- | ---- |
| `POST`   | `/script/generate`     | Generate a script from a situation        | ✅   |
| `GET`    | `/script/history`      | Paginated script history (filter by mood) | ✅   |
| `GET`    | `/script/stats`        | User script statistics                    | ✅   |
| `GET`    | `/script/:id`          | Get a single script                       | ✅   |
| `PATCH`  | `/script/:id/favorite` | Toggle favorite status                    | ✅   |
| `DELETE` | `/script/:id`          | Delete a script                           | ✅   |

<details>
<summary><strong>POST /script/generate</strong></summary>

**Request**

```json
{
  "situation": "A first date at a coffee shop that goes wrong",
  "mood": "romantic"
}
```

**Available moods:** `dramatic` · `comedy` · `romantic` · `action` · `thriller` · `horror` · `inspirational` · `noir`

**Response `201`**

```json
{
  "success": true,
  "message": "Script generated successfully!",
  "data": {
    "id": "64f2...",
    "title": "Espresso of Destiny",
    "tagline": "One cup. One chance. One love that almost slipped away.",
    "situation": "A first date at a coffee shop that goes wrong",
    "mood": "romantic",
    "scenes": [
      {
        "sceneIndex": 1,
        "description": "Wide shot: A cozy coffee shop with warm amber lighting...",
        "dialogue": "Rohan: I ordered the house blend. Just like you recommended.\nPriya: (smiling) And what do you think?\nRohan: I think... I should have come here sooner."
      }
    ],
    "sceneCount": 2,
    "createdAt": "2026-05-16T10:30:00.000Z",
    "generationTimeMs": 2341
  }
}
```

</details>

<details>
<summary><strong>GET /script/history</strong></summary>

**Query Parameters**

| Param   | Type   | Default | Description             |
| ------- | ------ | ------- | ----------------------- |
| `page`  | number | `1`     | Page number             |
| `limit` | number | `10`    | Items per page (max 50) |
| `mood`  | string | —       | Filter by mood          |

**Response `200`**

```json
{
  "success": true,
  "data": [ { "title": "Espresso of Destiny", "mood": "romantic", ... } ],
  "meta": {
    "pagination": { "page": 1, "limit": 10, "total": 25, "pages": 3, "hasNext": true }
  }
}
```

</details>

<details>
<summary><strong>GET /script/stats</strong></summary>

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

## Rate Limiting

| Endpoint            | Limit        | Window     |
| ------------------- | ------------ | ---------- |
| OTP (signup/resend) | 3 requests   | 5 minutes  |
| Login               | 5 attempts   | 15 minutes |
| AI Generation       | 10 requests  | 1 minute   |
| General API         | 100 requests | 15 minutes |

Rate limit state is returned in response headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1715856000
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Email is already registered.",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists",
      "value": "john@example.com"
    }
  ],
  "stack": "..."
}
```

| Status | Meaning             | Trigger                          |
| ------ | ------------------- | -------------------------------- |
| `400`  | Bad Request         | Validation failed, invalid input |
| `401`  | Unauthorized        | Missing or invalid JWT           |
| `403`  | Forbidden           | Insufficient permissions         |
| `404`  | Not Found           | Resource doesn't exist           |
| `409`  | Conflict            | Duplicate resource (e.g. email)  |
| `429`  | Too Many Requests   | Rate limit exceeded              |
| `500`  | Server Error        | Unexpected internal error        |
| `503`  | Service Unavailable | Groq or Brevo is down            |

---

## Security

| Mechanism        | Implementation                             |
| ---------------- | ------------------------------------------ |
| Password hashing | bcrypt · 12 salt rounds                    |
| OTP hashing      | bcrypt · 10 salt rounds                    |
| OTP expiry       | 5 minutes · auto-deleted after use         |
| OTP attempts     | Max 5 attempts · max 3 resends             |
| JWT delivery     | HTTP-only cookies + `Authorization` header |
| Cookie flags     | `httpOnly` · `secure` · `sameSite`         |
| Security headers | [Helmet.js](https://helmetjs.github.io)    |
| Input validation | Joi schemas on every endpoint              |
| CORS             | Restricted to `CLIENT_URL` only            |
| Rate limiting    | Per-IP and per-email                       |

---

## Frontend Integration

### Base API Helper

```javascript
const API_BASE_URL = "http://localhost:5000/api";

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!data.success) throw new Error(data.message);
    return data;
  },
  get: (url) => api.request(url, { method: "GET" }),
  post: (url, body) =>
    api.request(url, { method: "POST", body: JSON.stringify(body) }),
  patch: (url, body) =>
    api.request(url, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (url) => api.request(url, { method: "DELETE" }),
};
```

### Auth Flow

```javascript
// Signup
const signup = (name, email, password) =>
  api.post("/auth/signup", { name, email, password }).then((r) => r.data);

// Verify OTP → stores token
const verifyOtp = async (email, otp) => {
  const { data } = await api.post("/auth/verify-otp", { email, otp });
  localStorage.setItem("token", data.token);
  return data.user;
};

// Login → stores token
const login = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", data.token);
  return data.user;
};

// Logout → clears token
const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
};
```

### Script Generation

```javascript
// Generate
const generateScript = (situation, mood = "dramatic") =>
  api.post("/script/generate", { situation, mood }).then((r) => r.data);

// History with pagination
const getHistory = (page = 1, limit = 10, mood = null) => {
  const q = new URLSearchParams({ page, limit });
  if (mood) q.append("mood", mood);
  return api.get(`/script/history?${q}`).then((r) => ({
    scripts: r.data,
    pagination: r.meta.pagination,
  }));
};

// Toggle favorite
const toggleFavorite = (id) =>
  api.patch(`/script/${id}/favorite`).then((r) => r.data);
```

### React Loading Hook

```javascript
import { useState, useCallback } from "react";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, call };
};
```

---

## External Service Setup

<details>
<summary><strong>MongoDB Atlas</strong></summary>

1. Create an account at [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Create a free-tier cluster
3. Under **Database Access**, create a database user
4. Under **Network Access**, add `0.0.0.0/0` (or your server IP)
5. Click **Connect → Drivers → Node.js**, copy the connection string
6. Replace `<password>` and set as `MONGODB_URI` in `.env`
</details>

<details>
<summary><strong>Groq API</strong></summary>

1. Sign up at [console.groq.com](https://console.groq.com)
2. Navigate to **API Keys → Create New Key**
3. Set the key as `GROQ_API_KEY` in `.env`
</details>

<details>
<summary><strong>Brevo (Email)</strong></summary>

1. Create an account at [brevo.com](https://www.brevo.com)
2. Go to **SMTP & API → API Keys → Create Key**
3. The key starts with `xkeysib-` — set as `BREVO_API_KEY` in `.env`
4. Verify your sender email address in the Brevo dashboard
</details>

---
