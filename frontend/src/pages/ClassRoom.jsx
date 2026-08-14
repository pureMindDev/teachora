import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Track } from "livekit-client";
import toast from "react-hot-toast";
import Loader from "../components/Loader.jsx";
import ClassTimer from "../components/ClassTimer.jsx";
import ControlBar from "../components/ControlBar.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import ParticipantsPanel from "../components/ParticipantsPanel.jsx";
import VideoTile from "../components/VideoTile.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLiveKitRoom } from "../hooks/useLiveKitRoom.js";
import api from "../api/axios.js";

// A plain <video> bound to a raw local MediaStream, used only in dev-preview
// mode where there's no LiveKit room/participant to hand to <VideoTile>.
function DevPreviewTile({ stream, camOn, label }) {
  const ref = React.useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div className="status-ring status-ring--idle relative aspect-video overflow-hidden rounded-2xl bg-[#171B2B]">
      <video
        ref={ref}
        autoPlay
        muted
        playsInline
        className={`h-full w-full object-cover -scale-x-100 ${camOn ? "opacity-100" : "opacity-0"}`}
      />
      {!camOn && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-deep text-lg font-semibold text-white">
            {label?.[0]?.toUpperCase() || "?"}
          </span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur">
        {label} (you)
      </div>
    </div>
  );
}

export default function ClassRoom() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [klass, setKlass] = useState(null);
  const [panel, setPanel] = useState(null); // null | "chat" | "people"
  const [unreadChat, setUnreadChat] = useState(0);
  const [ending, setEnding] = useState(false);

  const {
    connecting,
    connectError,
    devMode,
    localStream,
    isTutor,
    cameraRequired,
    localParticipant,
    participants,
    camOn,
    micOn,
    screenSharing,
    handRaised,
    messages,
    handsQueue,
    violations,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    toggleHand,
    sendChatMessage,
    lowerHandFor,
    endClassForEveryone,
    leave,
  } = useLiveKitRoom({
    classId,
    initialCamOn: location.state?.camOn ?? true,
    initialMicOn: location.state?.micOn ?? true,
  });

  useEffect(() => {
    api.get(`/classes/${classId}`).then(({ data }) => setKlass(data)).catch(() => {});
  }, [classId]);

  useEffect(() => {
    if (panel !== "chat" && messages.length > 0) {
      setUnreadChat((n) => n + 1);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (panel === "chat") setUnreadChat(0);
  }, [panel]);

  useEffect(() => {
    const onEnded = () => {
      toast("The tutor ended this class", { icon: "👋" });
      navigate(`/student`);
    };
    window.addEventListener("teachora:ended", onEnded);
    return () => window.removeEventListener("teachora:ended", onEnded);
  }, [navigate]);

  // Notify tutor about camera-required violations as they happen
  const lastViolationCount = React.useRef(0);
  useEffect(() => {
    if (isTutor && violations.length > lastViolationCount.current) {
      const latest = violations[violations.length - 1];
      toast.error(`${latest.name} turned their camera off (camera required)`, { icon: "⚠️" });
    }
    lastViolationCount.current = violations.length;
  }, [violations, isTutor]);

  const devModeNotice = () =>
    toast("This needs a configured LiveKit project to work with other participants.", {
      icon: "🧪",
    });

  const handleToggleScreenShare = () => (devMode ? devModeNotice() : toggleScreenShare());
  const handleToggleHand = () => (devMode ? devModeNotice() : toggleHand());
  const handleSendChat = (text) => (devMode ? devModeNotice() : sendChatMessage(text));

  const handleLeave = () => {
    leave();
    navigate(user.role === "tutor" ? "/tutor" : "/student");
  };

  const handleEndClass = async () => {
    if (!confirm("End this class for everyone? Students will be disconnected.")) return;
    setEnding(true);
    try {
      endClassForEveryone();
      await api.patch(`/classes/${classId}/end`);
      leave();
      navigate(`/tutor/report/${classId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't end class");
      setEnding(false);
    }
  };

  const tutorParticipant = useMemo(() => {
    if (isTutor) return { participant: localParticipant, isLocal: true, name: user.name };
    const found = participants.find((p) => {
      try {
        return JSON.parse(p.metadata || "{}").role === "tutor";
      } catch {
        return false;
      }
    });
    return found ? { participant: found, isLocal: false, name: found.name } : null;
  }, [isTutor, localParticipant, participants, user.name]);

  const studentTiles = useMemo(() => {
    const remoteStudents = participants
      .filter((p) => p !== tutorParticipant?.participant)
      .map((p) => ({ participant: p, isLocal: false, name: p.name }));
    if (!isTutor) {
      return [{ participant: localParticipant, isLocal: true, name: user.name }, ...remoteStudents];
    }
    return remoteStudents;
  }, [participants, tutorParticipant, isTutor, localParticipant, user.name]);

  const ringStateFor = (identity, isLocalTile) => {
    const localIdentity = localParticipant?.identity;
    const effectiveIdentity = isLocalTile ? localIdentity : identity;
    if (violations.some((v) => v.identity === effectiveIdentity)) return "violation";
    if (handsQueue.some((h) => h.identity === effectiveIdentity)) return "hand";
    return "idle";
  };

  if (connecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader label="Connecting to classroom" />
      </div>
    );
  }

  if (connectError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink text-white">
        <p className="font-display text-lg font-semibold">Couldn't join the classroom</p>
        <p className="text-sm text-white/60">{connectError}</p>
        <Link to="/" className="btn-secondary">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-ink text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="truncate font-display text-sm font-semibold sm:text-base">
            {klass?.title || "Live class"}
          </span>
          {klass?.startedAt && <ClassTimer startedAt={klass.startedAt} />}
          {cameraRequired && (
            <span className="hidden rounded-full bg-signal/15 px-2.5 py-1 text-xs font-semibold text-signal sm:inline">
              Camera required
            </span>
          )}
          {devMode && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/70">
              Dev preview
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-white/50">
          <span className="h-2 w-2 rounded-full bg-live" />
          {devMode ? 1 : participants.length + 1} in class
        </div>
      </header>

      {devMode && (
        <div className="border-b border-white/10 bg-signal/10 px-5 py-2 text-center text-xs text-signal">
          LiveKit isn't configured on the server yet, so this is a local preview only — camera and
          mic work, but live video with other participants, chat, and raised hands need a real
          LiveKit project. See the README for setup.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {devMode ? (
            <div className="mx-auto w-full max-w-md">
              <DevPreviewTile stream={localStream} camOn={camOn} label={user.name} />
            </div>
          ) : (
            <>
          {tutorParticipant && (
            <div className="mx-auto w-full max-w-3xl">
              <VideoTile
                participant={tutorParticipant.participant}
                isLocal={tutorParticipant.isLocal}
                label={tutorParticipant.name}
                ringState={ringStateFor(tutorParticipant.participant?.identity, tutorParticipant.isLocal)}
                metadata={{}}
              />
              {screenSharing && tutorParticipant.isLocal && (
                <div className="mt-3">
                  <VideoTile
                    participant={localParticipant}
                    source={Track.Source.ScreenShare}
                    isLocal
                    label="Your screen"
                    ringState="idle"
                  />
                </div>
              )}
            </div>
          )}

          {studentTiles.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {studentTiles.map((t) => (
                <VideoTile
                  key={t.isLocal ? "local" : t.participant.identity}
                  participant={t.participant}
                  isLocal={t.isLocal}
                  label={t.name}
                  ringState={ringStateFor(t.participant?.identity, t.isLocal)}
                />
              ))}
            </div>
          )}

            </>
          )}

          {cameraRequired && !isTutor && !camOn && (
            <div className="mx-auto mt-2 flex max-w-md items-center gap-2 rounded-xl bg-danger/15 px-4 py-2.5 text-sm text-danger">
              ⚠ This tutor requires cameras on. Turn yours back on to stay in good standing.
            </div>
          )}
        </main>

        {panel && (
          <aside className="hidden w-80 shrink-0 border-l border-white/10 bg-ink-soft bg-[#171B2B] sm:flex sm:flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="font-display text-sm font-semibold capitalize">
                {panel === "chat" ? "Class chat" : `Participants (${participants.length + 1})`}
              </span>
              <button onClick={() => setPanel(null)} className="text-white/40 hover:text-white">
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1">
              {panel === "chat" ? (
                <ChatPanel
                  messages={messages}
                  onSend={handleSendChat}
                  currentIdentity={localParticipant?.identity}
                />
              ) : (
                <ParticipantsPanel
                  localParticipant={localParticipant}
                  localIsTutor={isTutor}
                  localName={user.name}
                  camOn={camOn}
                  micOn={micOn}
                  handRaised={handRaised}
                  participants={participants}
                  handsQueue={handsQueue}
                  violations={violations}
                  onLowerHand={lowerHandFor}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      <footer className="flex justify-center border-t border-white/10 p-4">
        <ControlBar
          micOn={micOn}
          camOn={camOn}
          screenSharing={screenSharing}
          handRaised={handRaised}
          chatOpen={panel === "chat"}
          peopleOpen={panel === "people"}
          unreadChat={unreadChat}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleHand={handleToggleHand}
          onToggleChat={() => setPanel((p) => (p === "chat" ? null : "chat"))}
          onTogglePeople={() => setPanel((p) => (p === "people" ? null : "people"))}
          onLeave={handleLeave}
          isTutor={isTutor}
          onEndClass={handleEndClass}
        />
      </footer>
      {ending && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/80">
          <Loader label="Ending class" />
        </div>
      )}
    </div>
  );
}
