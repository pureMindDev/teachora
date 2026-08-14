import React from "react";

export default function Loader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-indigo-deep" />
      <p className="font-mono text-xs uppercase tracking-widest">{label}</p>
    </div>
  );
}
