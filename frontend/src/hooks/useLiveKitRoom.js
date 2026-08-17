import { useCallback, useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  createLocalTracks,
  DataPacket_Kind,
} from "livekit-client";
import api from "../api/axios.js";

// Encapsulates connecting to a LiveKit room for a given class and exposes
// reactive participant state + simple data-channel messaging helpers for
// chat and raise-hand, so the UI components stay dumb/presentational.
//
// If the backend reports LiveKit isn't configured yet, this drops into a
// local "dev preview" mode instead of failing: camera/mic still work via
// getUserMedia so the rest of the app stays testable, but there's no real
// room, so multi-user video, chat, and raised hands are disabled until real
// LiveKit credentials are set.
export function useLiveKitRoom({ classId, initialCamOn = true, initialMicOn = true }) {
  const roomRef = useRef(null);
  const localStreamRef = useRef(null); // used only in dev-preview mode
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState(null);
  const [devMode, setDevMode] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [isTutor, setIsTutor] = useState(false);
  const [cameraRequired, setCameraRequired] = useState(false);

  const [localParticipant, setLocalParticipant] = useState(null);
  const [participants, setParticipants] = useState([]); // remote participants
  const [camOn, setCamOn] = useState(initialCamOn);
  const [micOn, setMicOn] = useState(initialMicOn);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenSharerIdentity, setScreenSharerIdentity] = useState(null);
  const [screenShareSupported] = useState(
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia
  );
  const [handRaised, setHandRaised] = useState(false);

  const [messages, setMessages] = useState([]);
  const [handsQueue, setHandsQueue] = useState([]); // identities with hand raised
  const [violations, setViolations] = useState([]); // { identity, name, at }

  const decoder = useRef(new TextDecoder());
  const encoder = useRef(new TextEncoder());

  const sendData = useCallback((payload) => {
    const room = roomRef.current;
    if (!room) return;
    room.localParticipant.publishData(
      encoder.current.encode(JSON.stringify(payload)),
      DataPacket_Kind.RELIABLE
    );
  }, []);

  const refreshParticipants = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    setParticipants(Array.from(room.remoteParticipants.values()));
  }, []);

  // Screen share is just another track, published by whichever participant
  // clicked "share" — tutor or student. This scans everyone in the room
  // (not just "am I sharing") so the tile shows up for every viewer, not
  // only the person who started the share.
  const detectScreenShare = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    const localPub = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
    if (localPub?.track) {
      setScreenSharerIdentity(room.localParticipant.identity);
      return;
    }
    for (const p of room.remoteParticipants.values()) {
      const pub = p.getTrackPublication(Track.Source.ScreenShare);
      if (pub?.track) {
        setScreenSharerIdentity(p.identity);
        return;
      }
    }
    setScreenSharerIdentity(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    const startDevPreview = async (tokenData) => {
      setDevMode(true);
      setIsTutor(tokenData.isTutor);
      setCameraRequired(tokenData.cameraRequired);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: initialCamOn,
          audio: initialMicOn,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        setCamOn(stream.getVideoTracks().length > 0);
        setMicOn(stream.getAudioTracks().length > 0);
      } catch {
        setCamOn(false);
        setMicOn(false);
      }
      if (mounted) setConnecting(false);
    };

    const connect = async () => {
      try {
        const { data } = await api.post(`/livekit/token/${classId}`);
        if (!mounted) return;

        if (data.configured === false) {
          await startDevPreview(data);
          return;
        }

        setIsTutor(data.isTutor);
        setCameraRequired(data.cameraRequired);

        room
          .on(RoomEvent.ParticipantConnected, refreshParticipants)
          .on(RoomEvent.ParticipantDisconnected, refreshParticipants)
          .on(RoomEvent.TrackSubscribed, () => {
            refreshParticipants();
            detectScreenShare();
          })
          .on(RoomEvent.TrackUnsubscribed, () => {
            refreshParticipants();
            detectScreenShare();
          })
          .on(RoomEvent.LocalTrackPublished, detectScreenShare)
          .on(RoomEvent.LocalTrackUnpublished, detectScreenShare)
          .on(RoomEvent.ActiveSpeakersChanged, refreshParticipants)
          .on(RoomEvent.ConnectionQualityChanged, refreshParticipants)
          .on(RoomEvent.TrackMuted, refreshParticipants)
          .on(RoomEvent.TrackUnmuted, refreshParticipants)
          .on(RoomEvent.DataReceived, (payload, participant) => {
            try {
              const msg = JSON.parse(decoder.current.decode(payload));
              if (msg.type === "chat") {
                setMessages((prev) => [...prev, msg]);
              } else if (msg.type === "hand") {
                setHandsQueue((prev) => {
                  const withoutUser = prev.filter((h) => h.identity !== msg.identity);
                  return msg.raised ? [...withoutUser, msg] : withoutUser;
                });
              } else if (msg.type === "camera-violation") {
                setViolations((prev) => [...prev, msg]);
              } else if (msg.type === "class-ended") {
                window.dispatchEvent(new CustomEvent("teachora:ended"));
              }
            } catch {
              // ignore malformed data packets
            }
          });

        await room.connect(data.url, data.token);

        const tracks = await createLocalTracks({
          audio: initialMicOn,
          video: initialCamOn,
        }).catch(() => []);

        for (const track of tracks) {
          await room.localParticipant.publishTrack(track);
        }
        setCamOn(tracks.some((t) => t.kind === Track.Kind.Video));
        setMicOn(tracks.some((t) => t.kind === Track.Kind.Audio));

        if (mounted) {
          setLocalParticipant(room.localParticipant);
          refreshParticipants();
          setConnecting(false);
        }

        api.post(`/attendance/${classId}/join`).catch(() => {});
      } catch (err) {
        if (mounted) {
          setConnectError(err.response?.data?.message || err.message || "Couldn't join the room");
          setConnecting(false);
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      api.post(`/attendance/${classId}/leave`).catch(() => {});
      room.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const toggleMic = useCallback(async () => {
    if (devMode) {
      const next = !micOn;
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
      setMicOn(next);
      return;
    }
    const room = roomRef.current;
    if (!room) return;
    const next = !micOn;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  }, [micOn, devMode]);

  const toggleCamera = useCallback(async () => {
    if (devMode) {
      const next = !camOn;
      localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
      setCamOn(next);
      // Still log the participation signal locally even without a live room,
      // so the flow stays testable end-to-end.
      if (!next && cameraRequired && !isTutor) {
        api.post(`/attendance/${classId}/event`, { type: "cameraOffViolation" }).catch(() => {});
      }
      return;
    }
    const room = roomRef.current;
    if (!room) return;
    const next = !camOn;
    await room.localParticipant.setCameraEnabled(next);
    setCamOn(next);
    if (!next && cameraRequired && !isTutor) {
      sendData({ type: "camera-violation", identity: room.localParticipant.identity, name: room.localParticipant.name, at: Date.now() });
      api.post(`/attendance/${classId}/event`, { type: "cameraOffViolation" }).catch(() => {});
    }
  }, [camOn, cameraRequired, isTutor, sendData, classId, devMode]);

  const toggleScreenShare = useCallback(async () => {
    if (devMode) return; // requires a real room to publish to other participants
    if (!screenShareSupported) {
      const err = new Error(
        "Screen sharing isn't supported in this browser. On iPhone/iPad, Safari doesn't support it at all — try a laptop or desktop browser instead."
      );
      err.code = "unsupported";
      throw err;
    }
    const room = roomRef.current;
    if (!room) return;
    const next = !screenSharing;
    try {
      if (next) {
        await room.localParticipant.setScreenShareEnabled(
          true,
          {
            audio: false,
            // Cap resolution so encoding stays fast on modest connections —
            // sharper than this doesn't help legibility much and costs framerate.
            resolution: { width: 1920, height: 1080 },
          },
          {
            videoEncoding: { maxBitrate: 3_000_000, maxFramerate: 20 },
            // Simulcast lets viewers on a weaker connection subscribe to a
            // lower-res layer automatically instead of stalling waiting for
            // the full-quality stream to arrive.
            simulcast: true,
          }
        );
      } else {
        await room.localParticipant.setScreenShareEnabled(false);
      }
      setScreenSharing(next);
      detectScreenShare();
    } catch (err) {
      if (err?.code === "unsupported") throw err;
      if (err?.name === "NotAllowedError") {
        const permErr = new Error("Screen-share permission was denied or the picker was closed.");
        permErr.code = "permission-denied";
        throw permErr;
      }
      const genericErr = new Error("Couldn't start screen sharing. Please try again.");
      genericErr.code = "other";
      throw genericErr;
    }
  }, [screenSharing, devMode, detectScreenShare, screenShareSupported]);

  const toggleHand = useCallback(() => {
    if (devMode) return; // no one else is in the room to see it
    const room = roomRef.current;
    if (!room) return;
    const next = !handRaised;
    setHandRaised(next);
    sendData({
      type: "hand",
      identity: room.localParticipant.identity,
      name: room.localParticipant.name,
      raised: next,
      at: Date.now(),
    });
    if (next) api.post(`/attendance/${classId}/event`, { type: "handRaised" }).catch(() => {});
  }, [handRaised, sendData, classId, devMode]);

  const sendChatMessage = useCallback(
    (text) => {
      if (devMode || !text.trim()) return;
      const room = roomRef.current;
      if (!room) return;
      const msg = {
        type: "chat",
        identity: room.localParticipant.identity,
        name: room.localParticipant.name,
        text: text.trim(),
        at: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      sendData(msg);
      api.post(`/attendance/${classId}/event`, { type: "chatMessage" }).catch(() => {});
    },
    [sendData, classId, devMode]
  );

  const lowerHandFor = useCallback(
    (identity) => {
      setHandsQueue((prev) => prev.filter((h) => h.identity !== identity));
    },
    []
  );

  const endClassForEveryone = useCallback(() => {
    if (!devMode) sendData({ type: "class-ended" });
  }, [sendData, devMode]);

  const leave = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    roomRef.current?.disconnect();
  }, []);

  return {
    room: roomRef.current,
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
    screenSharerIdentity,
    screenShareSupported,
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
  };
}
