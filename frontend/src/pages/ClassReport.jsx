import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import Navbar from "../components/Navbar.jsx";
import Loader from "../components/Loader.jsx";
import api from "../api/axios.js";

const fmtDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

export default function ClassReport() {
  const { classId } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/attendance/${classId}/report`)
      .then(({ data }) => setReport(data))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load report"));
  }, [classId]);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link to="/tutor" className="text-sm text-slate-muted hover:text-ink">
          ← Back to dashboard
        </Link>

        {error ? (
          <div className="card mt-6 p-10 text-center text-slate-muted">{error}</div>
        ) : !report ? (
          <Loader label="Building report" />
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="eyebrow">Post-class report</span>
                <h1 className="mt-1 font-display text-2xl font-semibold">{report.class.title}</h1>
                <p className="mt-1 text-sm text-slate-muted">
                  {format(new Date(report.class.scheduledDate), "EEEE, MMM d · h:mm a")} ·{" "}
                  {report.class.durationMinutes} min scheduled
                  {report.class.cameraRequired && " · Camera required"}
                </p>
              </div>
              <div className="card px-5 py-3 text-center">
                <p className="font-display text-2xl font-semibold">{report.totalStudents}</p>
                <p className="font-mono text-xs uppercase tracking-wide text-slate-muted">
                  Students attended
                </p>
              </div>
            </div>

            <div className="card mt-6 overflow-hidden">
              {report.students.length === 0 ? (
                <p className="p-10 text-center text-sm text-slate-muted">
                  No students joined this class.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-black/5 bg-black/[0.02] font-mono text-xs uppercase tracking-wide text-slate-muted">
                    <tr>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Joined</th>
                      <th className="px-5 py-3">Duration</th>
                      <th className="px-5 py-3">Hand raises</th>
                      <th className="px-5 py-3">Chat</th>
                      <th className="px-5 py-3">Camera flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.students.map((s) => (
                      <tr key={s.user._id} className="border-b border-black/5 last:border-0">
                        <td className="flex items-center gap-2.5 px-5 py-3">
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: s.user.avatarColor }}
                          >
                            {s.user.name?.[0]?.toUpperCase()}
                          </span>
                          <span>
                            <span className="block font-medium">{s.user.name}</span>
                            <span className="block text-xs text-slate-muted">{s.user.email}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-muted">
                          {s.firstJoinedAt ? format(new Date(s.firstJoinedAt), "h:mm a") : "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs">{fmtDuration(s.totalDurationSeconds)}</td>
                        <td className="px-5 py-3">{s.handRaisedCount}</td>
                        <td className="px-5 py-3">{s.chatMessageCount}</td>
                        <td className="px-5 py-3">
                          {s.cameraOffWhileRequiredCount > 0 ? (
                            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                              {s.cameraOffWhileRequiredCount}
                            </span>
                          ) : (
                            <span className="text-slate-faint">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="mt-4 text-center text-xs text-slate-faint">
              This report reflects join/leave times, camera status while required, and chat/hand
              participation captured during the live class. Nothing is inferred beyond these
              signals.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
