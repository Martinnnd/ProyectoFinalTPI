const SCORES = [1, 2, 3, 4, 5] as const;

export default function PostRating({
  memoryTitle,
  value,
  onRate,
}: {
  memoryTitle: string;
  value?: number;
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
          aria-label={`Puntuar ${score} de 5`}
          aria-pressed={value === score}
          onClick={() => onRate(score)}
        >
          {score}
        </button>
      ))}
      <small className="post-rating-value">
        {value ? `Puntaje: ${value} de 5` : "Sin puntuar"}
      </small>
    </div>
  );
}
