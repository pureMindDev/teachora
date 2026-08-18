import React, { useEffect, useRef, useState } from "react";
import { Track } from "livekit-client";

// Renders a single participant's camera (or screen-share) track and keeps
// itself in sync as tracks are (un)published/(un)muted, using LiveKit's
// attach/detach helpers directly on the underlying <video>/<audio> element.
export default function VideoTile({
  participant,
  source = Track.Source.Camera,
  isLocal = false,
  ringState = "idle", // idle | live | hand | violation
  label,
  muted = false,
  metadata = {},
  expandable = false,
  expanded = false,
  onToggleExpand,
  fill = false, // true when this tile is the fullscreen expanded view
}) {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    if (!participant) return;

    const attach = () => {
      const pub = participant.getTrackPublication?.(source);
      const track = pub?.track;
      if (track && videoRef.current) {
        track.attach(videoRef.current);
        setHasVideo(true);
      } else {
        setHasVideo(false);
      }
    };

    attach();
    participant.on?.("trackSubscribed", attach);
    participant.on?.("trackUnsubscribed", attach);
    participant.on?.("trackMuted", attach);
    participant.on?.("trackUnmuted", attach);

    return () => {
      participant.off?.("trackSubscribed", attach);
      participant.off?.("trackUnsubscribed", attach);
      participant.off?.("trackMuted", attach);
      participant.off?.("trackUnmuted", attach);
      const pub = participant.getTrackPublication?.(source);
      pub?.track?.detach();
    };
  }, [participant, source, isLocal]);

  const ringClass =
    {
      live: "status-ring--live",
      hand: "status-ring--hand",
      violation: "status-ring--violation",
      idle: "status-ring--idle",
    }[ringState] || "status-ring--idle";

  return (
    <div
      className={`status-ring ${ringClass} group relative overflow-hidden bg-ink-soft bg-[#171B2B] ${
        fill ? "h-full w-full rounded-none" : "aspect-video rounded-2xl"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || muted}
        className={`h-full w-full object-cover ${isLocal && source === Track.Source.Camera ? "-scale-x-100" : ""} ${
          hasVideo ? "opacity-100" : "opacity-0"
        }`}
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white"
            style={{ backgroundColor: metadata.avatarColor || "#2B2E6B" }}
          >
            {label?.[0]?.toUpperCase() || "?"}
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/50 px-2 py-1 backdrop-blur">
        <span className="text-xs font-medium text-white">{label}</span>
        {ringState === "hand" && <span className="text-xs">✋</span>}
      </div>

      {expandable && (
        <button
          onClick={onToggleExpand}
          aria-label={expanded ? "Exit fullscreen" : "Expand to fullscreen"}
          title={expanded ? "Exit fullscreen" : "Expand to fullscreen"}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white/80 backdrop-blur transition-opacity hover:bg-black/70 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
        >
          {expanded ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 3H3v6M15 21h6v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
