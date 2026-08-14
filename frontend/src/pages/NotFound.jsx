import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <span className="font-mono text-xs uppercase tracking-widest text-slate-muted">404</span>
      <h1 className="font-display text-2xl font-semibold">This page doesn't exist</h1>
      <Link to="/" className="btn-primary">
        Go home
      </Link>
    </div>
  );
}
