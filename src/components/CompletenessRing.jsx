import { useEffect, useState } from "react";

const R = 52;
const CIRC = 2 * Math.PI * R;

export default function CompletenessRing({ value, small }) {
  // Animate from 0 on mount so the pre-filled score visibly climbs.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const px = small ? 88 : 128;

  return (
    <div className={"ring" + (small ? " small" : "")} role="img" aria-label={`Profile ${value}% complete`}>
      <svg viewBox="0 0 120 120" width={px} height={px}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--line)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="var(--blue)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - shown / 100)}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="ring-label">
        <strong>{value}%</strong>
        <span>complete</span>
      </div>
    </div>
  );
}
