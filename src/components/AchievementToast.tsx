import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Achievement } from "../types";

// The lifetime is declared once here and handed to CSS through a custom property,
// so the bar and the unmount can never drift apart.
const VISIBLE_MS = 5000;
const EXIT_MS = 400;

export default function AchievementToast({
  achievement,
  onDismiss,
}: {
  achievement: Achievement;
  onDismiss: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  // The parent passes an inline arrow, so the callback is read through a ref to
  // keep a re-render from restarting the countdown.
  const dismissRef = useRef(onDismiss);
  const exitTimer = useRef<number | null>(null);
  useEffect(() => {
    dismissRef.current = onDismiss;
  });
  useEffect(() => {
    const hide = window.setTimeout(() => {
      setLeaving(true);
      exitTimer.current = window.setTimeout(
        () => dismissRef.current(),
        EXIT_MS,
      );
    }, VISIBLE_MS);
    return () => {
      window.clearTimeout(hide);
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    };
  }, []);
  function leave() {
    setLeaving(true);
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => dismissRef.current(), EXIT_MS);
  }
  return (
    <div
      className={`achievement-toast${leaving ? " is-leaving" : ""}`}
      role="status"
      style={
        { "--achievement-lifetime": `${VISIBLE_MS}ms` } as React.CSSProperties
      }
    >
      <img
        className="achievement-toast-badge"
        src={achievement.image}
        alt=""
        width={52}
        height={52}
      />
      <div className="achievement-toast-body">
        <span className="achievement-toast-kicker">Insignia conseguida</span>
        <strong>{achievement.name}</strong>
        <small>{achievement.description}</small>
      </div>
      <button
        className="icon-button"
        aria-label="Cerrar aviso de insignia"
        onClick={leave}
      >
        <X size={16} />
      </button>
      <span className="achievement-toast-timer" />
    </div>
  );
}
