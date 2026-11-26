import { useRef, useState } from "react";
import Image from "next/image";

const SCORES = [1, 2, 3, 4, 5] as const;

export default function NostalgiaPointSelector({
  title,
  value,
  canRate,
  maxPoints = 5,
  onRate,
}: {
  title: string;
  value?: number;
  canRate: boolean;
  maxPoints?: number;
  onRate: (value: number) => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  async function rate(score: number) {
    if (!canRate || score > maxPoints || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      await onRate(score);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }
  return (
    <>
      {SCORES.map((score) => {
        const label = `${value === score ? "Quitar" : "Dar"} ${score} ${score === 1 ? "punto" : "puntos"} de nostalgia a ${title}`;
        return (
          <button
            key={score}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={value === score}
            data-filled={score <= (value ?? 0)}
            disabled={!canRate || saving || score > maxPoints}
            onClick={() => void rate(score)}
          >
            <Image src="/nostalgiar-rail-logo.png" alt="" width={28} height={28} unoptimized />
          </button>
        );
      })}
    </>
  );
}
