<div align="center">

```
 ██████╗██╗███╗   ██╗███████╗███████╗ ██████╗██████╗ ██╗██████╗ ████████╗
██╔════╝██║████╗  ██║██╔════╝██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝
██║     ██║██╔██╗ ██║█████╗  ███████╗██║     ██████╔╝██║██████╔╝   ██║
██║     ██║██║╚██╗██║██╔══╝  ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║
╚██████╗██║██║ ╚████║███████╗███████║╚██████╗██║  ██║██║██║        ██║
 ╚═════╝╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝
```

### _Ab har pal ko blockbuster bana do_

### _Turn every moment into a Bollywood blockbuster_

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TanStack](https://img.shields.io/badge/TanStack-Start-FF4154?style=flat-square&logo=reactquery&logoColor=white)](https://tanstack.com/start)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)
[![Bun](https://img.shields.io/badge/Runtime-Bun-FBF0DF?style=flat-square&logo=bun&logoColor=black)](https://bun.sh)

</div>

---

## What is CineScript AI?

**CineScript AI** is a cinematic, premium React frontend that transforms everyday moments into full-blown Bollywood screenplays — complete with characters, dramatic scenes, and dialogue — powered by AI. Drop in a situation, pick a mood, and watch the magic unfold.

> _"I missed my train and met a stranger…"_ → a **Dramatic** script with characters, scenes, and lines worth putting on the big screen.

---

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | React 19                            |
| Routing     | TanStack Start (file-based)         |
| Styling     | Tailwind CSS + custom design tokens |
| Animation   | Framer Motion                       |
| HTTP Client | Fetch API via `src/lib/api.ts`      |
| Runtime     | npm                                 |
| Build       | Vite                                |

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template and fill in your backend URL
cp .env.example .env

# Start the dev server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

> **No backend?** No problem. If `VITE_API_BASE_URL` is unset or the server is unreachable, the app automatically falls back to a local mock generator so the UI stays fully functional.

---

## Environment Variables

```env
# .env
VITE_API_BASE_URL=http://localhost:5000/api
```

| Variable            | Required | Description                            |
| ------------------- | -------- | -------------------------------------- |
| `VITE_API_BASE_URL` | Yes      | Base URL of the Cine Script AI backend |

> ⚠️ All `VITE_*` variables are **inlined at build time** and shipped to the browser — never store secrets here.

Restart the dev server after any `.env` change.

---

## Folder Structure

```
cinescript_frontend/
├── .env                              # VITE_API_BASE_URL lives here
├── .env.example                      # Template for new environments
├── package.json
├── vite.config.ts
├── public/
└── src/
    ├── routes/                       # File-based routing (TanStack Router)
    │   ├── __root.tsx                # Root layout — HTML shell + providers
    │   ├── index.tsx                 # / — landing + generator
    │   ├── login.tsx                 # /login
    │   ├── signup.tsx                # /signup
    │   ├── verify-otp.tsx            # /verify-otp
    │   └── forgot-password.tsx       # /forgot-password — 3-phase wizard
    │
    ├── components/
    │   ├── Navbar.tsx                # Top nav (auth-aware)
    │   ├── Hero.tsx                  # Cinematic hero section
    │   ├── InputForm.tsx             # Situation + mood + generate button
    │   ├── OutputDisplay.tsx         # Full movie dashboard
    │   ├── CharacterCard.tsx         # Glassmorphism character card
    │   ├── SceneCard.tsx             # Scene description + dialogue card
    │   ├── HistoryPanel.tsx          # Slide-in history sidebar
    │   ├── Loader.tsx                # Spinner + skeleton screens
    │   ├── ConfirmDialog.tsx         # Deleting the scripts
    │   ├── Toast.tsx                 # Error toast notifications
    │   ├── AuthCard.tsx              # Shared login / signup form shell
    │   └── PasswordStrength.tsx      # 6-tier strength meter + rule checklist
    │
    ├── context/
    │   └── AuthContext.tsx           # Auth state + token persistence
    │
    ├── lib/
    │   ├── api.ts                    # Central API client (all HTTP calls)
    │   ├── mockScript.ts             # Local fallback script generator
    │   └── utils.ts                  # Shared helpers
    │
    ├── styles.css                    # Design system tokens (gold / black)
    ├── router.tsx
    └── routeTree.gen.ts              # ⚠️ Auto-generated — do not edit
```

---

## API Contract

All HTTP calls originate from **`src/lib/api.ts`**. The JWT returned by `/auth/login` or `/auth/signup` is stored in `localStorage` and automatically attached to every request as:

```
Authorization: Bearer <token>
```

Base URL: value of `VITE_API_BASE_URL`

---

### Authentication

#### `POST /auth/signup`

Register a new account.

<details>
<summary>Request / Response</summary>

**Request**

```json
{
  "name": "Karan Johar",
  "email": "karan@studio.com",
  "password": "secret123"
}
```

**Response `200`**

```json
{
  "token": "jwt.token.here",
  "user": {
    "id": "usr_1",
    "name": "Karan Johar",
    "email": "karan@studio.com"
  }
}
```

</details>

---

#### `POST /auth/login`

Authenticate an existing user.

<details>
<summary>Request / Response</summary>

**Request**

```json
{ "email": "karan@studio.com", "password": "secret123" }
```

**Response `200`** — same shape as signup.

</details>

---

#### `GET /auth/me`

Get the currently authenticated user. Requires `Authorization` header.

<details>
<summary>Response</summary>

```json
{
  "user": { "id": "usr_1", "name": "Karan Johar", "email": "karan@studio.com" }
}
```

</details>

---

#### `POST /auth/logout`

Invalidate the current token server-side. Requires `Authorization` header.

**Response `200`** → `{ "ok": true }`

---

### Forgot Password — 3-Phase Wizard

The full reset flow lives at `/forgot-password` and is wired via `passwordApi` in `src/lib/api.ts`.

**During development**, if the backend is unreachable, the flow is fully mocked in-memory: the generated OTP is logged to the browser console **and** returned as `devOtp` so QA can complete the wizard without a real inbox. Remove `devOtp` before going to production.

---

#### Phase 1 — `POST /auth/forgot-password`

Generate a 6-digit OTP, persist with ~10 min TTL, and email it. Always returns success to prevent account enumeration.

<details>
<summary>Request / Response</summary>

**Request**

```json
{ "email": "karan@studio.com" }
```

**Response `200`**

```json
{ "ok": true, "message": "If that email exists, a code has been sent." }
```

> 🔧 Dev-only field: `devOtp` (the 6-digit code) — **never** return this from production.

**Error cases**

- `429` — Rate limit exceeded (suggested: 3 requests / 15 min per email or IP)
</details>

---

#### Phase 2 — `POST /auth/verify-otp`

Verify the OTP and exchange it for a single-use `resetToken` (~10 min TTL). Delete the OTP on success.

<details>
<summary>Request / Response</summary>

**Request**

```json
{ "email": "karan@studio.com", "otp": "482915" }
```

**Response `200`**

```json
{ "resetToken": "a1b2c3d4e5f6..." }
```

**Error cases**

- `400` `{ "message": "Incorrect OTP" }`
- `400` `{ "message": "OTP expired" }`
- `429` after N failed attempts
</details>

---

#### Phase 3 — `POST /auth/reset-password`

Consume the `resetToken`, hash and store the new password, invalidate all existing sessions, delete the token.

<details>
<summary>Request / Response</summary>

**Request**

```json
{ "resetToken": "a1b2c3d4e5f6...", "password": "NewBlockbuster#2025" }
```

**Response `200`**

```json
{ "ok": true }
```

**Error cases**

- `400` `{ "message": "Invalid or expired reset link" }`
- `422` `{ "message": "Password does not meet requirements" }`
</details>

---

#### Password Rules

The strength meter in `PasswordStrength.tsx` scores 0–5. A minimum score of **3** is required to submit. The same rules must be mirrored server-side.

| Rule                                             | Required |
| ------------------------------------------------ | -------- |
| 8+ characters                                    | ✅       |
| Uppercase letter                                 | ✅       |
| Lowercase letter                                 | ✅       |
| Number                                           | ✅       |
| Symbol                                           | ✅       |
| 12+ characters                                   | ⭐ bonus |
| No common words (`password`, `qwerty`, `admin`…) | ✅       |
| No 3+ character repeats (`aaaa`, `1111`…)        | ✅       |

---

### Scripts

#### `POST /scripts/generate`

Generate a new Bollywood script from a situation and mood.

**Available moods:** `Dramatic` · `Action` · `Comedy` · `Romantic` · `Tragic`

<details>
<summary>Request / Response</summary>

**Request**

```json
{
  "situation": "I missed my train and met a stranger…",
  "mood": "Dramatic"
}
```

**Response `200`**

```json
{
  "id": "scr_1",
  "title": "Jab Tak Tum Ho",
  "tagline": "Har lamha ek toofan hai…",
  "mood": "Dramatic",
  "situation": "I missed my train…",
  "characters": [
    {
      "name": "Aarav Khanna",
      "role": "The Protagonist",
      "description": "A restless soul searching for meaning in motion."
    }
  ],
  "scenes": [
    {
      "number": 1,
      "title": "The Encounter",
      "description": "Rain drums on the windows as two strangers lock eyes.",
      "dialogues": [{ "character": "Aarav", "line": "Tum yahaan?" }]
    }
  ],
  "createdAt": 1715800000000
}
```

</details>

---

#### `GET /scripts`

List the authenticated user's scripts, newest first. Requires auth.

**Response `200`** → `Script[]` (same shape as generate response)

---

#### `GET /scripts/:id`

Fetch a single script by ID. Requires auth.

---

#### `DELETE /scripts/:id`

Delete a script. Requires auth.

**Response `200`** → `{ "ok": true }`

---

## Error Format

All non-2xx responses return JSON with a human-readable message field, surfaced directly by the `Toast` component and inline form errors:

```json
{ "message": "Invalid credentials" }
```

---

## Design System

CineScript uses a cinematic **gold-on-black** aesthetic. All tokens are defined in `src/styles.css` using `oklch` values.

| Token        | Value              | Usage            |
| ------------ | ------------------ | ---------------- |
| Background   | `#0A0A0A`          | App background   |
| Gold (start) | `#C9A227`          | Gradient start   |
| Gold (end)   | `#FFD700`          | Gradient end     |
| Display font | Cormorant Garamond | Titles, headings |
| Body font    | Inter              | UI text, body    |

**Custom Tailwind utilities:**

| Class                | Effect                   |
| -------------------- | ------------------------ |
| `text-gold-gradient` | Gold shimmer text        |
| `glass`              | Frosted glass card       |
| `glass-gold`         | Gold-tinted glass card   |
| `glow-gold`          | Gold drop shadow glow    |
| `shimmer`            | Animated shimmer overlay |

All interactive elements use gold glow on focus/hover, with Framer Motion handling page transitions and card reveals.

---

## Backend Requirements

Any HTTP server implementing the contract above works. Recommended building blocks:

- **Auth** — JWT (HS256) issued on signup/login, verified via middleware
- **Database** — PostgreSQL with `users` and `scripts` tables (or MongoDB)
- **AI** — OpenAI / Gemini / Anthropic / Groq — generate the JSON shape returned by `/scripts/generate`
- **Email** — Brevo / Resend / SendGrid for OTP delivery

> See the [Cine Script AI Backend README](../backend/README.md) for a production-ready implementation using Node.js + Express + MongoDB + Groq.

---
