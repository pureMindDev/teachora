import React from "react";

function CtrlBtn({ active, danger, onClick, children, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all active:scale-95 ${
        danger
          ? "bg-danger text-white"
          : active
          ? "bg-white/15 text-white"
          : "bg-white/5 text-white/50 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function ControlBar({
  micOn,
  camOn,
  screenSharing,
  handRaised,
  chatOpen,
  peopleOpen,
  unreadChat,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleHand,
  onToggleChat,
  onTogglePeople,
  onLeave,
  isTutor,
  onEndClass,
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-ink px-3 py-2 shadow-card sm:gap-3">
      <CtrlBtn active={micOn} danger={!micOn} onClick={onToggleMic} label={micOn ? "Mute mic" : "Unmute mic"}>
        {micOn ? "🎙️" : "🔇"}
      </CtrlBtn>
      <CtrlBtn active={camOn} danger={!camOn} onClick={onToggleCamera} label={camOn ? "Turn camera off" : "Turn camera on"}>
        {camOn ? "📷" : "🚫"}
      </CtrlBtn>
      <CtrlBtn active={screenSharing} onClick={onToggleScreenShare} label="Share screen">
        🖥️
      </CtrlBtn>
      <CtrlBtn active={handRaised} onClick={onToggleHand} label={handRaised ? "Lower hand" : "Raise hand"}>
        ✋
      </CtrlBtn>

      <div className="mx-1 h-6 w-px bg-white/10" />

      <div className="relative">
        <CtrlBtn active={chatOpen} onClick={onToggleChat} label="Chat">
          💬
        </CtrlBtn>
        {unreadChat > 0 && !chatOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-signal text-[10px] font-bold text-ink">
            {unreadChat}
          </span>
        )}
      </div>
      <CtrlBtn active={peopleOpen} onClick={onTogglePeople} label="Participants">
        👥
      </CtrlBtn>

      <div className="mx-1 h-6 w-px bg-white/10" />

      {isTutor ? (
        <button onClick={onEndClass} className="btn-danger !rounded-full !px-5">
          End class
        </button>
      ) : (
        <button onClick={onLeave} className="btn-danger !rounded-full !px-5">
          Leave
        </button>
      )}
    </div>
  );
}
