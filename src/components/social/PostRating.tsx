import { useRef, useState } from "react";

const SCORES = [1, 2, 3, 4, 5] as const;

export default function PostRating({
  memoryTitle,
  value,
  totalPoints = 0,
  canRate,
  isOwn = false,
  onRate,
}: {
  memoryTitle: string;
  value?: number;
  totalPoints?: number;
  canRate: boolean;
  isOwn?: boolean;
  onRate: (value: number) => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const allowRate = canRate && !isOwn;
  async function rate(score: number) {
    if (!allowRate || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try { await onRate(score); }
    finally { inFlight.current = false; setSaving(false); }
  }

  return (
    <div
      className="post-ratings"
      role="group"
      aria-label={`Puntuar publicación: ${memoryTitle}`}
      aria-busy={saving}
    >
      {SCORES.map((score) => (
        <button
          key={score}
          type="button"
          aria-label={`${value === score ? "Quitar" : "Dar"} ${score} ${score === 1 ? "punto" : "puntos"} de nostalgia a ${memoryTitle}`}
          aria-pressed={value === score}
          data-filled={score <= (value ?? 0)}
          disabled={!allowRate || saving}
          onClick={() => void rate(score)}
        >
          <img src="/nostalgiar-rail-logo.png" alt="" width={28} height={28} />
        </button>
      ))}
      <small className="post-rating-value">
        <strong>{totalPoints} {totalPoints === 1 ? "punto" : "puntos"}</strong>
        {isOwn
          ? " • Tu publicación"
          : !canRate
            ? " • Disponible desde Nostálgico"
            : value
              ? ` • Le diste ${value} ${value === 1 ? "punto" : "puntos"}`
              : " • Sin puntuar"}
      </small>
    </div>
  );
}
