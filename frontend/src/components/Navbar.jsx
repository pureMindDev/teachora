import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to={user ? (user.role === "tutor" ? "/tutor" : "/student") : "/"} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-deep">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Teachora</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-muted sm:inline">
              {user.role === "tutor" ? "Tutor" : "Student"} · {user.name}
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name?.[0]?.toUpperCase()}
            </span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="btn-ghost !px-3 !py-2 text-sm"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
