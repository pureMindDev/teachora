import React from "react";

const STYLES = {
  scheduled: "bg-indigo-deep/10 text-indigo-deep",
  live: "bg-live/15 text-live",
  ended: "bg-black/5 text-slate-muted",
  cancelled: "bg-danger/10 text-danger",
};

const LABELS = {
  scheduled: "Scheduled",
  live: "Live now",
  ended: "Ended",
  cancelled: "Cancelled",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] || STYLES.scheduled}`}
    >
      {status === "live" && <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />}
      {LABELS[status] || status}
    </span>
  );
}
