# AI Career Navigator Agent

**Discover Your Career. Build Your Skills. Reach Your Goal.**

AI-powered career discovery, skill-gap analysis and personalized roadmaps for
every undergraduate degree (B.Tech, B.E., BCA, B.Sc, BBA, B.Com, BA…) and
15+ branches — not just computer science.

## Features

- **Student profile** with degree, branch, interests and skill self-ratings
- **AI interest assessment** (10 questions → career families)
- **Career recommendations** with match %, reasons, required vs missing skills
- **Skill gap analysis** — strong / improve / missing / high-priority buckets
- **Personalized roadmap** — staged timeline with goals, tasks, projects
- **Project recommendations** — beginner → advanced, matched to your gaps
- **Resume analyzer** — PDF/DOCX extraction, resume + ATS score, keywords
- **AI career coach** — profile-aware chat in **8 Indian languages**
- **Auth** — email + password **and "Continue with Google"** (OAuth 2.0)
- Dark/light mode, responsive premium SaaS UI

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — app runs fully without any keys
npm run dev                  # http://localhost:3000
```

No AI key is required: the career engine and coach work offline with a
built-in knowledge base and heuristics. Add a key to upgrade coach/resume
grading to a real LLM.

## Authentication

Two ways to sign in, both create the same session:

| Method | Where | Notes |
| --- | --- | --- |
| Email + password | `/signup`, `/login` | scrypt-hashed, stored in `data/users.json` |
| Google OAuth | "Continue with Google" | real OAuth 2.0 when credentials are set |

### Google OAuth setup (optional)

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth client ID** (Web application)
3. Add `http://localhost:3000/api/auth/google/callback` as an **Authorized redirect URI**
4. In `.env.local`:
   ```
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   ```
5. Restart the dev server. The button now redirects through Google's consent
   screen, exchanges the code server-side and signs you in.

**Demo mode (no Google account needed):** set in `.env.local`

```
GOOGLE_DEMO_EMAIL=demo.student@gmail.com
GOOGLE_DEMO_NAME=Demo Student
GOOGLE_DEMO_SEED_PROFILE=1
NEXT_PUBLIC_GOOGLE_DEMO=1
```

A "Try Google sign-in (demo account)" button appears on `/login`; it runs the
same callback/session flow without leaving the server.

**Account linking:** signing in with Google for an email that already has a
password account links them automatically; the reverse (password signup with a
Google-registered email) shows a friendly "use Continue with Google" message.

## Tech

- Next.js 14 (App Router) + TypeScript + Tailwind
- API routes as the backend (`/api/auth`, `/api/profile`, `/api/matches`,
  `/api/coach`, `/api/resume`) — AI keys stay server-side
- JSON file storage (`data/`) — swap `server/auth.ts` for NextAuth + a DB in production

## Demo student

Click **"Try the live demo student"** on the landing page to explore the full
workflow instantly (Ananya, B.Tech AIML).
