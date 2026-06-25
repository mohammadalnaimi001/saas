import { useEffect, useRef, useState } from "react";

interface PunchCardProps {
  filled: number;
  threshold: number;
  /** index that was just stamped, to play the drop animation */
  animateIndex?: number | null;
  size?: "sm" | "md" | "lg";
}

/**
 * The digital punch card. Filled slots use the reserved reward-amber.
 * When `filled >= threshold` the card reads as "reward ready".
 */
export default function PunchCard({
  filled,
  threshold,
  animateIndex = null,
  size = "md",
}: PunchCardProps) {
  const ready = filled >= threshold;
  const shown = Math.min(filled, threshold);
  const prev = useRef(filled);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (ready && prev.current < threshold) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1400);
      return () => clearTimeout(t);
    }
    prev.current = filled;
  }, [filled, ready, threshold]);

  // Choose a column count that keeps slots a comfortable size.
  const cols = threshold <= 6 ? threshold : threshold <= 12 ? 4 : 5;
  const gap = size === "lg" ? "gap-3" : size === "sm" ? "gap-1.5" : "gap-2";

  return (
    <div
      className={`rounded-xl2 border p-4 transition-colors ${
        ready
          ? "border-reward bg-reward/5 animate-rewardGlow"
          : "border-hairline bg-paper"
      }`}
    >
      <div
        className={`grid ${gap}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: threshold }).map((_, i) => {
          const isFilled = i < shown;
          const justStamped = animateIndex === i;
          return (
            <div
              key={i}
              className={`stamp-slot ${isFilled ? "filled" : ""} ${
                justStamped ? "just-stamped" : ""
              }`}
              aria-label={isFilled ? "Stamped" : "Empty"}
            >
              {isFilled ? (
                <StampMark />
              ) : (
                <span className="text-[0.7em] font-semibold tnum opacity-70">
                  {i + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-ink tnum">
          {filled} / {threshold} stamps
        </span>
        {ready ? (
          <span
            className={`chip bg-reward text-ink ${pulse ? "animate-rewardGlow" : ""}`}
          >
            Reward ready
          </span>
        ) : (
          <span className="text-muted tnum">
            {threshold - filled} to go
          </span>
        )}
      </div>
    </div>
  );
}

function StampMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
