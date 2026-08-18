import React, { useEffect, useRef } from "react";
import { Track } from "livekit-client";

// Audio is deliberately rendered separately from <VideoTile> and mounted
// exactly once per remote participant for the whole call. Video tiles get
// swapped around a lot (grid <-> expanded, thumbnail strip, etc.) and every
// swap used to recreate the <audio> element for that participant — which on
// mobile browsers can get silently blocked, since play() wasn't triggered
// directly inside a user-gesture handler. Keeping one stable <audio> element
// per participant, independent of whatever video layout is on screen, means
// switching what's expanded never interrupts sound.
function ParticipantAudio({ participant }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!participant) return;

    const attach = () => {
      const pub = participant.getTrackPublication?.(Track.Source.Microphone);
      const track = pub?.track;
      if (track && ref.current) track.attach(ref.current);
    };

    attach();
    participant.on?.("trackSubscribed", attach);
    participant.on?.("trackUnsubscribed", attach);

    return () => {
      participant.off?.("trackSubscribed", attach);
      participant.off?.("trackUnsubscribed", attach);
      const pub = participant.getTrackPublication?.(Track.Source.Microphone);
      pub?.track?.detach();
    };
  }, [participant]);

  return <audio ref={ref} autoPlay />;
}

export default function RoomAudio({ participants }) {
  return (
    <div className="hidden" aria-hidden="true">
      {participants.map((p) => (
        <ParticipantAudio key={p.identity} participant={p} />
      ))}
    </div>
  );
}
