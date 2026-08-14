import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await register(form);
      toast.success(`Welcome to Teachora, ${data.name.split(" ")[0]}`);
      navigate(from || (data.role === "tutor" ? "/tutor" : "/student"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't create account");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-deep">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          </span>
          <span className="font-display text-lg font-semibold">Teachora</span>
        </Link>

        <div className="card p-8">
          <h1 className="font-display text-xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-muted">
            {from?.startsWith("/class/")
              ? "Create an account to join your class."
              : "Teach live or join a class in minutes."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {["student", "tutor"].map((role) => (
              <button
                type="button"
                key={role}
                onClick={() => setForm({ ...form, role })}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                  form.role === role
                    ? "border-indigo-deep bg-indigo-deep text-white"
                    : "border-black/10 text-slate-muted hover:border-black/20"
                }`}
              >
                I'm a {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ada Lovelace"
              />
            </div>
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
                minLength={6}
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account…" : `Create ${form.role} account`}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-muted">
          Already have an account?{" "}
          <Link to="/login" state={{ from }} className="font-semibold text-indigo-deep">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
