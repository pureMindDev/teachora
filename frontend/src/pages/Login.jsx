import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const from = location.state?.from;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form);
      toast.success(`Welcome back, ${data.name.split(" ")[0]}`);
      // If they arrived here via a shared class link, send them straight back to it.
      navigate(from || (data.role === "tutor" ? "/tutor" : "/student"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't sign in");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-deep">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          </span>
          <span className="font-display text-lg font-semibold">Teachora</span>
        </Link>

        <div className="card p-8">
          <h1 className="font-display text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-slate-muted">
            {from?.startsWith("/class/")
              ? "Sign in to continue to your class."
              : "Pick up where you left off."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-muted">
          New to Teachora?{" "}
          <Link to="/register" state={{ from }} className="font-semibold text-indigo-deep">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
