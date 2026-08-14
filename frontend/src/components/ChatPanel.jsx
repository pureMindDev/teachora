import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";

export default function ChatPanel({ messages, onSend, currentIdentity }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-xs text-white/40">
            No messages yet. Say hello to get things started.
          </p>
        ) : (
          messages.map((m, i) => {
            const isMe = m.identity === currentIdentity;
            return (
              <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="mb-1 text-[11px] text-white/40">
                  {isMe ? "You" : m.name} · {format(m.at, "h:mm a")}
                </span>
                <span
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    isMe ? "bg-indigo-mid text-white" : "bg-white/10 text-white"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the class…"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-signal"
        />
        <button type="submit" className="btn-signal !px-3 !py-2 text-sm">
          Send
        </button>
      </form>
    </div>
  );
}
