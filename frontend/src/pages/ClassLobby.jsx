import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar.jsx";
import Loader from "../components/Loader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function ClassLobby() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [klass, setKlass] = useState(null);
  const [error, setError] = useState(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api
      .get(`/classes/${classId}`)
      .then(({ data }) => setKlass(data))
      .catch((err) => setError(err.response?.data?.message || "Class not found"));
  }, [classId]);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        // Camera/mic permission denied or unavailable — user can still join, just muted/off
        setCamOn(false);
        setMicOn(false);
      });
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [camOn]);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);

  const cameraBlockedForStudent =
    klass && !klass.isTutor && klass.cameraRequired && !camOn;

  const handleJoin = async () => {
    if (!klass) return;
    setJoining(true);
    try {
      if (user.role === "student" && !klass.isAuthorizedStudent) {
        await api.post(`/classes/${classId}/join`);
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      navigate(`/class/${classId}/room`, { state: { camOn, micOn } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't join class");
      setJoining(false);
    }
  };

  const handleStart = async () => {
    setJoining(true);
    try {
      await api.patch(`/classes/${classId}/start`);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      navigate(`/class/${classId}/room`, { state: { camOn, micOn } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't start class");
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        {error ? (
          <div className="card p-10 text-center">
            <p className="font-display text-lg font-semibold">Class not found</p>
            <p className="mt-2 text-sm text-slate-muted">{error}</p>
            <Link to="/" className="btn-secondary mt-5 inline-flex">
              Go home
            </Link>
          </div>
        ) : !klass ? (
          <Loader label="Loading class" />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="status-ring status-ring--idle overflow-hidden rounded-2xl bg-ink aspect-video">
                {camOn ? (
                  <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover -scale-x-100" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/60">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-xl">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs">Camera is off</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => setMicOn((v) => !v)}
                  className={micOn ? "btn-secondary" : "btn-danger"}
                >
                  {micOn ? "🎙️ Mic on" : "🔇 Mic off"}
                </button>
                <button
                  onClick={() => setCamOn((v) => !v)}
                  className={camOn ? "btn-secondary" : "btn-danger"}
                >
                  {camOn ? "📷 Camera on" : "🚫 Camera off"}
                </button>
              </div>

              {cameraBlockedForStudent && (
                <p className="mt-3 text-center text-sm font-medium text-danger">
                  This tutor requires cameras on for this class. Turn your camera on to join.
                </p>
              )}
            </div>

            <div>
              <StatusBadge status={klass.status} />
              <h1 className="mt-3 font-display text-2xl font-semibold leading-tight">{klass.title}</h1>
              {klass.description && (
                <p className="mt-2 text-sm text-slate-muted">{klass.description}</p>
              )}

              <div className="mt-5 space-y-2 font-mono text-sm text-slate-muted">
                <p>with {klass.tutor.name}</p>
                <p>{format(new Date(klass.scheduledDate), "EEEE, MMM d · h:mm a")}</p>
                <p>{klass.durationMinutes} minutes</p>
                {klass.cameraRequired && <p className="text-signal">Camera required for this class</p>}
              </div>

              <div className="mt-8">
                {klass.isTutor ? (
                  klass.status === "live" ? (
                    <button onClick={handleJoin} disabled={joining} className="btn-primary w-full">
                      {joining ? "Joining…" : "Enter live class"}
                    </button>
                  ) : klass.status === "scheduled" ? (
                    <button onClick={handleStart} disabled={joining} className="btn-primary w-full">
                      {joining ? "Starting…" : "Start class"}
                    </button>
                  ) : (
                    <p className="text-sm text-slate-muted">This class has {klass.status}.</p>
                  )
                ) : klass.status === "live" ? (
                  <button
                    onClick={handleJoin}
                    disabled={joining || cameraBlockedForStudent}
                    className="btn-primary w-full"
                  >
                    {joining ? "Joining…" : "Join now"}
                  </button>
                ) : klass.status === "scheduled" ? (
                  <p className="rounded-xl bg-black/5 p-4 text-sm text-slate-muted">
                    This class hasn't started yet. Come back at the scheduled time.
                  </p>
                ) : (
                  <p className="text-sm text-slate-muted">This class has {klass.status}.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
