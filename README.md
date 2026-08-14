# Teachora

A production-quality MVP for a tutor-first virtual classroom — scheduling, shareable
class links, a purpose-built live classroom, and post-class attendance reporting.

Teachora is **not** a generic meeting clone. Every screen is built around the
tutor/student relationship: who's required to have a camera on, who raised their
hand, who showed up and for how long.

## Stack

- **Frontend:** React 18 + Vite, Tailwind CSS, `livekit-client`, `react-router-dom`
- **Backend:** Node.js + Express, MongoDB (Mongoose), JWT auth
- **Real-time video/audio:** [LiveKit](https://livekit.io) (Cloud or self-hosted)
- **Real-time signaling (chat, raised hands, camera alerts):** LiveKit data
  channels — no second real-time server to run or scale

## Project structure

```
teachora/
├── backend/                 Express API
│   ├── config/db.js         MongoDB connection
│   ├── models/               User, Class, Attendance
│   ├── controllers/          auth, classes, livekit tokens, attendance
│   ├── middleware/           JWT auth + role guard, error handler
│   ├── routes/
│   └── server.js
└── frontend/                 React + Vite app
    └── src/
        ├── pages/             Landing, Login, Register, Tutor/Student
        │                      dashboards, CreateClass, ClassLobby,
        │                      ClassRoom (the live classroom), ClassReport
        ├── components/        Navbar, ClassCard, VideoTile, ControlBar,
        │                      ChatPanel, ParticipantsPanel, ClassTimer…
        ├── hooks/useLiveKitRoom.js   All LiveKit connection + data-channel logic
        ├── context/AuthContext.jsx
        └── api/axios.js
```

## How it works

1. **Tutor schedules a class** (title, date/time, duration, camera policy) →
   backend creates a `Class` document with a unique `classId`
   (`/api/classes`) and the frontend shows a **Copy Link** button for
   `https://yourapp.com/class/:classId`.
2. **Tutor shares the link** (e.g. via WhatsApp). Anyone who opens it must
   **sign in first** — the link itself grants no access.
3. Once signed in, a student sees a **lobby** with a camera/mic preview and
   class details, and can join once the tutor has started the class. Opening
   the link for the first time marks the student as *authorized* for that
   class.
4. **Starting a class** flips its status to `live` and stamps `startedAt`.
   Joining the classroom exchanges a JWT for a scoped **LiveKit access
   token** (`POST /api/livekit/token/:classId`) — the room name is the
   `classId`, so tutor and students land in the same LiveKit room.
5. Inside the room, camera/mic/screen-share go over LiveKit's WebRTC
   transport. **Chat, raised hands, and camera-required alerts** are sent as
   small JSON payloads over LiveKit's built-in reliable data channel — this
   avoids running a second real-time server.
6. The frontend logs **join/leave timestamps** and **participation events**
   (hand raised, chat sent, camera turned off while required) to
   `/api/attendance/:classId/...` as they happen.
7. **Ending a class** finalizes any open attendance sessions and unlocks a
   **post-class report** (`/api/attendance/:classId/report`) — per-student
   join time, duration, hand raises, chat count, and camera-requirement
   flags. Nothing beyond these explicit signals is tracked or inferred.

## Testing without LiveKit credentials yet

If `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, or `LIVEKIT_URL` aren't set on the
backend, the classroom doesn't fail — it drops into a **local dev-preview
mode**: your own camera/mic still work (via `getUserMedia`), so scheduling,
links, auth, the lobby, and the room UI are all testable end-to-end. A banner
in the classroom makes this explicit, and screen share / chat / raised hands
are disabled in this mode since there's no real room to share them with —
they light up automatically once real LiveKit credentials are added and the
backend is restarted.

## Shared class links & auth

Clicking a shared link (`/class/:classId`) while logged out sends the person
to `/login` (or `/register`, for a student without an account yet) and then
returns them straight to that class afterward — the class link is preserved
through the whole auth round-trip rather than dropping them on a generic
dashboard. A manual "paste your class link" field remains on the student
dashboard as a fallback.

## Design system

- **Palette:** Ink `#10131F` (classroom dark), Paper `#F7F5F0` (dashboard
  light), Indigo Deep `#2B2E6B` (brand/primary), Signal Amber `#F5A623`
  (attention — raised hands, camera policy), Live Emerald `#1FAE7A` (live
  status), Danger Rose `#E1436B` (camera-required violations).
- **Type:** Space Grotesk (display), Inter (body), IBM Plex Mono (timers,
  timestamps, data-dense labels).
- **Signature element — the Status Ring:** every video tile carries a subtle
  ring that encodes state at a glance: pulsing emerald while live, amber
  while a hand is raised, pulsing rose if a required camera is off. The same
  ring language shows up on the landing page preview so the visual identity
  is consistent from marketing to the classroom itself.

## Local setup

### 1. Prerequisites

- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier works well)
- A LiveKit project — [LiveKit Cloud](https://cloud.livekit.io) has a free
  tier and takes about a minute to set up, or run `livekit-server --dev`
  locally

### 2. Backend

```bash
cd backend
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL
npm install
npm run dev        # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev             # http://localhost:5173
```

### 4. Try it end-to-end

1. Register a **tutor** account and a **student** account (use two browser
   profiles or one normal + one incognito window).
2. As the tutor, schedule a class and click **Copy link**.
3. Open the link as the student, sign in, and wait in the lobby.
4. As the tutor, click **Start class**, then **Enter live class**.
5. As the student, click **Join now** from the lobby.
6. Try camera/mic toggles, screen share, raise hand, and chat from both
   sides. If the tutor required cameras on, turning the student's camera off
   triggers a toast alert for the tutor and a flag on the report.
7. As the tutor, click **End class**, then open the generated **report**.

## Notes on scope

This MVP intentionally excludes AI features, payments, recordings, a
marketplace, certificates, gamification, and a parent dashboard, per the
brief — the goal is a clean, real, end-to-end teaching flow for one tutor and
one student first.
