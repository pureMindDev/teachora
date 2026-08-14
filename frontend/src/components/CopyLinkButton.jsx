import React, { useState } from "react";
import toast from "react-hot-toast";

export default function CopyLinkButton({ classId, className = "" }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/class/${classId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Class link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link — copy it manually");
    }
  };

  return (
    <button onClick={copy} className={`btn-secondary text-sm ${className}`}>
      {copied ? (
        "Copied ✓"
      ) : (
        <>
          <span aria-hidden>🔗</span> Copy link
        </>
      )}
    </button>
  );
}
