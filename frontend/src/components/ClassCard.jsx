import React from "react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import CopyLinkButton from "./CopyLinkButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import toast from "react-hot-toast";

export default function ClassCard({ klass, onChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTutor = user.role === "tutor";

  const startClass = async () => {
    try {
      await api.patch(`/classes/${klass.classId}/start`);
      toast.success("Class started");
      navigate(`/class/${klass.classId}/room`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't start class");
    }
  };

  const cancelClass = async () => {
    if (!confirm(`Cancel "${klass.title}"? Students will no longer be able to join.`)) return;
    try {
      await api.delete(`/classes/${klass.classId}`);
      toast.success("Class cancelled");
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't cancel class");
    }
  };

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold leading-snug">{klass.title}</h3>
          {!isTutor && klass.tutor?.name && (
            <p className="mt-0.5 text-sm text-slate-muted">with {klass.tutor.name}</p>
          )}
        </div>
        <StatusBadge status={klass.status} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-slate-muted">
        <span>{format(new Date(klass.scheduledDate), "EEE, MMM d · h:mm a")}</span>
        <span>·</span>
        <span>{klass.durationMinutes} min</span>
        {klass.cameraRequired && (
          <>
            <span>·</span>
            <span className="text-signal">Camera required</span>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {isTutor && klass.status === "scheduled" && (
          <>
            <button onClick={startClass} className="btn-primary text-sm">
              Start class
            </button>
            <CopyLinkButton classId={klass.classId} />
            <button onClick={cancelClass} className="btn-ghost text-sm ml-auto">
              Cancel
            </button>
          </>
        )}
        {isTutor && klass.status === "live" && (
          <>
            <Link to={`/class/${klass.classId}/room`} className="btn-signal text-sm">
              Rejoin live class
            </Link>
            <CopyLinkButton classId={klass.classId} />
          </>
        )}
        {isTutor && klass.status === "ended" && (
          <Link to={`/tutor/report/${klass.classId}`} className="btn-secondary text-sm">
            View report
          </Link>
        )}

        {!isTutor && klass.status === "live" && (
          <Link to={`/class/${klass.classId}`} className="btn-signal text-sm">
            Join live class
          </Link>
        )}
        {!isTutor && klass.status === "scheduled" && (
          <span className="text-sm text-slate-muted">Not started yet</span>
        )}
        {!isTutor && klass.status === "ended" && (
          <span className="text-sm text-slate-muted">Class has ended</span>
        )}
      </div>
    </div>
  );
}
