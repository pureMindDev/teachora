import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import ClassCard from "../components/ClassCard.jsx";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState(null);
  const [linkInput, setLinkInput] = useState("");

  const load = async () => {
    const { data } = await api.get("/classes/mine");
    setClasses(data);
  };

  useEffect(() => {
    load();
  }, []);

  const openLink = (e) => {
    e.preventDefault();
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    const match = trimmed.match(/([a-zA-Z0-9_-]{6,})\/?$/);
    if (!match) {
      toast.error("That doesn't look like a valid class link");
      return;
    }
    navigate(`/class/${match[1]}`);
  };

  const live = classes?.filter((c) => c.status === "live") || [];
  const upcoming = classes?.filter((c) => c.status === "scheduled") || [];
  const past = classes?.filter((c) => c.status === "ended" || c.status === "cancelled") || [];

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <span className="eyebrow">Student dashboard</span>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          Welcome back, {user.name.split(" ")[0]}
        </h1>

        <form onSubmit={openLink} className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="label">Have a class link from your tutor?</label>
            <input
              className="input"
              placeholder="Paste the link your tutor sent you"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary sm:self-end">
            Open class
          </button>
        </form>

        {classes === null ? (
          <Loader label="Loading your classes" />
        ) : (
          <div className="mt-8 space-y-10">
            {live.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-live">
                  Live now
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {live.map((k) => (
                    <ClassCard key={k._id} klass={k} onChange={load} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-muted">
                Upcoming classes
              </h2>
              {upcoming.length === 0 ? (
                <div className="card p-8 text-center text-sm text-slate-muted">
                  No upcoming classes yet. Ask your tutor for a class link to get started.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((k) => (
                    <ClassCard key={k._id} klass={k} onChange={load} />
                  ))}
                </div>
              )}
            </section>

            {past.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-muted">
                  Past classes
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((k) => (
                    <ClassCard key={k._id} klass={k} onChange={load} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
