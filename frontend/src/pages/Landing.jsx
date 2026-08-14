import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const FEATURES = [
  {
    title: "Schedule in seconds",
    body: "Set a title, date, time and camera policy. Teachora generates a unique link the moment you save.",
  },
  {
    title: "One link, sent anywhere",
    body: "Copy the class link and drop it in WhatsApp. Students authenticate before they ever see the room.",
  },
  {
    title: "A room built for teaching",
    body: "Tutor spotlight, student grid, screen share, raised hands and chat — powered by LiveKit's real-time engine.",
  },
  {
    title: "Attendance without guesswork",
    body: "Join time, leave time, camera status and participation, summarized the moment class ends.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="eyebrow">For tutors who teach live</span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Run your classroom,
              <br />
              not a generic meeting.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-muted">
              Teachora gives tutors a scheduling dashboard, a shareable class link, and a live
              room built specifically for teaching — cameras, hands, chat and attendance, all in
              one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">
                Start teaching free
              </Link>
              <Link to="/login" className="btn-secondary">
                I have an account
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="status-ring status-ring--live card overflow-hidden bg-ink p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs text-live">● Live · 24:18</span>
                <span className="font-mono text-xs text-white/50">Algebra II — Ch.4</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 aspect-video rounded-xl bg-indigo-deep/40 ring-1 ring-white/10" />
                <div className="flex flex-col gap-2">
                  <div className="status-ring status-ring--hand aspect-video rounded-xl bg-white/5" />
                  <div className="status-ring status-ring--violation aspect-video rounded-xl bg-white/5" />
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="status-ring status-ring--idle aspect-video rounded-xl bg-white/5" />
                ))}
              </div>
            </div>
            <p className="mt-3 text-center font-mono text-xs text-slate-faint">
              Status rings show live, raised-hand and camera-required states at a glance
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-black/5 bg-white/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div key={f.title}>
                <span className="font-mono text-xs text-slate-faint">0{i + 1}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 text-center font-mono text-xs text-slate-faint">
        Teachora — built for real classrooms, not sales demos.
      </footer>
    </div>
  );
}
