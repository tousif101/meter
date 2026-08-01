"use client";

import { useState } from "react";

const mono = 'ui-monospace, "SF Mono", monospace';

export default function CopyButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: "#16181C",
        border: "1px solid #2A2E35",
        borderRadius: 9,
        padding: "13px 18px",
        fontFamily: mono,
        fontSize: 13.5,
        color: "#E8EAED",
        cursor: "pointer",
      }}
    >
      {command}
      <span style={{ color: copied ? "#6FB98F" : "#6C737C", fontSize: 12 }}>
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
