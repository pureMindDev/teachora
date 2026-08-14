import React, { useEffect, useState } from "react";

export default function ClassTimer({ startedAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = startedAt ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000)) : 0;
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-live/15 px-3 py-1 font-mono text-xs font-semibold text-live">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
      {h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}
    </span>
  );
}
