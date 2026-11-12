# IntellMeet — AI-Powered Enterprise Meeting & Collaboration Platform

> **Zidio Development • Enterprise Collaboration & AI Meeting Intelligence (v2.0)**

IntellMeet transforms enterprise meetings into actionable, trackable workflows by combining **real-time WebRTC video conferencing**, **live speech transcription**, **AI-powered executive summaries**, **automatic Kanban action item extraction**, and **productivity analytics**.

---

## Key Features (F-01 through F-07)

| ID | Capability | Highlights |
| :--- | :--- | :--- |
| **F-01** | **Authentication & Profiles** | NextAuth JWT sessions, `bcryptjs` password hashing, rate-limited registration, plus zero-friction **Demo Mode** |
| **F-02** | **Real-Time Video Meetings** | WebRTC camera/mic, screen sharing (`getDisplayMedia`), local `.webm` recording (`MediaRecorder`), mute/video controls |
| **F-03** | **AI Meeting Intelligence** | Live Web Speech API captions, OpenAI `gpt-4o-mini` structured summaries (with deterministic NLP fallback), auto-extracted action items |
| **F-04** | **Real-Time Chat & Notes** | Persistent in-meeting chat with typing indicators, `BroadcastChannel` multi-tab sync, shared notes, quick task creation |
| **F-05** | **Post-Meeting Dashboard** | Searchable & filterable meeting history, single-meeting intelligence view, Markdown (`.md`) & Print/PDF export |
| **F-06** | **Workspaces & Kanban Board** | Team workspaces, member invitations, interactive `To Do` / `In Progress` / `Done` Kanban board |
| **F-07** | **Analytics & Insights** | KPI overview, priority & status breakdowns, contributor ownership leaderboard, CSV report export |

---

## Technology Stack

* **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
* **Styling & Icons:** Tailwind CSS + `lucide-react`
* **Database & ORM:** PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) with automatic in-memory demo fallback
* **Authentication & Validation:** NextAuth.js (JWT), `bcryptjs`, `zod`
* **AI & Real-Time:** OpenAI SDK (`gpt-4o-mini`), WebRTC, Web Speech API, `BroadcastChannel`
* **DevOps:** Docker multi-stage build, GitHub Actions CI/CD

---

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables** in `.env`:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret"
   NEXTAUTH_URL="http://localhost:4000"
   OPENAI_API_KEY="sk-..." # Optional: smart fallback works without a key
   ```
3. **Push Prisma schema & generate client:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. **Run the development server:**
   ```bash
   npm run dev -- -p 4000
   ```
   Open [http://localhost:4000](http://localhost:4000) in your browser.

---

## Verification Commands

```bash
npx tsc --noEmit   # TypeScript typecheck
npm run lint       # ESLint check
npm test           # Unit tests
npm run build      # Production Next.js build
```
