const SCORES = [1, 2, 3, 4, 5] as const;

export default function PostRating({
  memoryTitle,
  value,
  canRate,
  pending = false,
  onRate,
}: {
  memoryTitle: string;
  value?: number;
  canRate: boolean;
  pending?: boolean;
  onRate: (value: number) => void;
}) {
  return (
    <div
      className="post-ratings"
      role="group"
      aria-label={`Puntuar publicación: ${memoryTitle}`}
    >
      {SCORES.map((score) => (
        <button
          key={score}
          type="button"
          aria-label={`${value === score ? "Quitar" : "Dar"} ${score} ${score === 1 ? "punto" : "puntos"} de nostalgia a ${memoryTitle}`}
          aria-pressed={value === score}
          data-filled={score <= (value ?? 0)}
          disabled={!canRate || pending}
          onClick={() => onRate(score)}
        >
          <img src="/nostalgiar-rail-logo.png" alt="" width={28} height={28} />
        </button>
      ))}
      <small className="post-rating-value">
        {pending ? "Guardando puntuación…" : !canRate ? "Disponible desde Nostálgico" : value ? `${value} de 5 puntos de nostalgia` : "Sin puntuar"}
      </small>
    </div>
  );
}
