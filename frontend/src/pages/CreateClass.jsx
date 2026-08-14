import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar.jsx";
import api from "../api/axios.js";

const toLocalInputValue = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export default function CreateClass() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduledDate: toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)),
    durationMinutes: 60,
    cameraRequired: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/classes", {
        ...form,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        durationMinutes: Number(form.durationMinutes),
      });
      toast.success("Class scheduled — link ready to share");
      navigate("/tutor");
      // eslint-disable-next-line no-unused-expressions
      data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't schedule class");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-xl px-6 py-10">
        <Link to="/tutor" className="text-sm text-slate-muted hover:text-ink">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold">Schedule a class</h1>
        <p className="mt-1 text-sm text-slate-muted">
          You'll get a unique link the moment you save — share it with students on WhatsApp.
        </p>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6">
          <div>
            <label className="label">Class title</label>
            <input
              required
              className="input"
              placeholder="e.g. Algebra II — Quadratic Equations"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="What will this class cover?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date & time</label>
              <input
                type="datetime-local"
                required
                className="input"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input
                type="number"
                min={15}
                step={5}
                required
                className="input"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-4">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-indigo-deep"
              checked={form.cameraRequired}
              onChange={(e) => setForm({ ...form, cameraRequired: e.target.checked })}
            />
            <span>
              <span className="block text-sm font-semibold">Require cameras on</span>
              <span className="block text-sm text-slate-muted">
                Students will be clearly told this before joining, and you'll be notified if a
                required camera is turned off during class.
              </span>
            </span>
          </label>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Scheduling…" : "Schedule class & get link"}
          </button>
        </form>
      </main>
    </div>
  );
}
