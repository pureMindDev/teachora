import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import ClassCard from "../components/ClassCard.jsx";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function TutorDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const { data } = await api.get("/classes/mine");
    setClasses(data);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!classes) return [];
    if (filter === "all") return classes;
    return classes.filter((c) => c.status === filter);
  }, [classes, filter]);

  const counts = useMemo(() => {
    if (!classes) return {};
    return classes.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
  }, [classes]);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">Tutor dashboard</span>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              Good to see you, {user.name.split(" ")[0]}
            </h1>
          </div>
          <Link to="/tutor/create" className="btn-primary">
            + Schedule a class
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {["all", "scheduled", "live", "ended", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f ? "bg-ink text-white" : "bg-black/5 text-slate-muted hover:bg-black/10"
              }`}
            >
              {f} {f !== "all" && counts[f] ? `· ${counts[f]}` : ""}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {classes === null ? (
            <Loader label="Loading your classes" />
          ) : filtered.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 p-16 text-center">
              <p className="font-display text-lg font-semibold">No classes here yet</p>
              <p className="max-w-xs text-sm text-slate-muted">
                Schedule your first class to get a shareable link you can send to students.
              </p>
              <Link to="/tutor/create" className="btn-primary mt-2">
                + Schedule a class
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((klass) => (
                <ClassCard key={klass._id} klass={klass} onChange={load} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
