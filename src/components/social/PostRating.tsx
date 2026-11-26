import NostalgiaPointSelector from "./NostalgiaPointSelector";

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
  const allowRate = canRate && !isOwn;

  return (
    <div className="post-ratings" role="group" aria-label={`Puntuar publicación: ${memoryTitle}`}>
      <NostalgiaPointSelector
        title={memoryTitle}
        value={value}
        canRate={allowRate}
        onRate={onRate}
      />
      <small className="post-rating-value">
        <strong>
          {totalPoints} {totalPoints === 1 ? "punto" : "puntos"}
        </strong>
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
