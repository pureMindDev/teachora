import React from "react";
import { Track } from "livekit-client";

const qualityLabel = {
  excellent: "Excellent",
  good: "Good",
  poor: "Poor",
  unknown: "Connecting",
};

const qualityColor = {
  excellent: "bg-live",
  good: "bg-signal",
  poor: "bg-danger",
  unknown: "bg-white/30",
};

function Row({ name, isTutor, camOn, micOn, handRaised, quality, violationCount, isLocal, onLowerHand, canModerate }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 hover:bg-white/5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${qualityColor[quality] || qualityColor.unknown}`} title={qualityLabel[quality]} />
        <span className="truncate text-sm text-white">
          {name} {isLocal && <span className="text-white/40">(you)</span>}
        </span>
        {isTutor && (
          <span className="rounded-full bg-indigo-mid/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
            Tutor
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-xs">
        {handRaised && (
          <button
            onClick={canModerate ? onLowerHand : undefined}
            className="rounded-md bg-signal/20 px-1.5 py-0.5 text-signal"
            title={canModerate ? "Lower hand" : "Hand raised"}
          >
            ✋
          </button>
        )}
        {violationCount > 0 && (
          <span className="rounded-md bg-danger/20 px-1.5 py-0.5 text-danger" title="Camera turned off while required">
            ⚠ {violationCount}
          </span>
        )}
        <span className={micOn ? "text-white/60" : "text-danger"}>{micOn ? "🎙️" : "🔇"}</span>
        <span className={camOn ? "text-white/60" : "text-danger"}>{camOn ? "📷" : "🚫"}</span>
      </div>
    </div>
  );
}

export default function ParticipantsPanel({
  localParticipant,
  localIsTutor,
  localName,
  camOn,
  micOn,
  handRaised,
  participants,
  handsQueue,
  violations,
  onLowerHand,
}) {
  const violationCounts = violations.reduce((acc, v) => {
    acc[v.identity] = (acc[v.identity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col overflow-y-auto p-2">
      <Row
        name={localName}
        isTutor={localIsTutor}
        camOn={camOn}
        micOn={micOn}
        handRaised={handRaised}
        quality="excellent"
        violationCount={0}
        isLocal
        canModerate={false}
      />
      {participants.map((p) => {
        const camPub = p.getTrackPublication?.(Track.Source.Camera);
        const micPub = p.getTrackPublication?.(Track.Source.Microphone);
        const hand = handsQueue.find((h) => h.identity === p.identity);
        let metadata = {};
        try {
          metadata = p.metadata ? JSON.parse(p.metadata) : {};
        } catch {
          /* ignore */
        }
        return (
          <Row
            key={p.identity}
            name={p.name || p.identity}
            isTutor={metadata.role === "tutor"}
            camOn={!!camPub && !camPub.isMuted}
            micOn={!!micPub && !micPub.isMuted}
            handRaised={!!hand}
            quality={p.connectionQuality}
            violationCount={violationCounts[p.identity] || 0}
            canModerate={localIsTutor}
            onLowerHand={() => onLowerHand(p.identity)}
          />
        );
      })}
    </div>
  );
}
