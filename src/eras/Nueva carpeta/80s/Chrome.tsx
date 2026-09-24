import type { ChromeProps } from "../contracts";
import { theme } from "./theme";
export default function Chrome({ period, count }: ChromeProps) {
  const label = period.year ?? `${period.decade}–${period.decade + 9}`;
  return (
    <div className="era-chrome">
      <div className="era-shell-top">
        <span className="shell-caption">{theme.windowTitle}</span>
        <span className="vhs-signal" aria-hidden="true">
          SP <i /> TRACKING ━━━
        </span>
      </div>
      <div className="era-atmosphere" aria-hidden="true">
        <div className="vhs-horizon" />
        <span className="vhs-tape">
          ARGENTINA
          <br />
          CINTA {label}
        </span>
      </div>
      <div className="vhs-status" aria-hidden="true">
        <span>HI-FI STEREO</span>
        <span>
          ✦ {count.toString().padStart(2, "0")} RECUERDOS · {label} ✦
        </span>
        <span>VHS / NOSTALGIA</span>
      </div>
    </div>
  );
}
