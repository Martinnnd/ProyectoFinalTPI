import { Map } from "lucide-react";
import type { ChromeProps } from "../contracts";
import { theme } from "./theme";
export default function Chrome({ period, count }: ChromeProps) {
  const label = period.year ?? `${period.decade}–${period.decade + 9}`;
  return (
    <div className="era-chrome">
      <div className="era-shell-top">
        <span className="shell-caption">
          <Map size={14} />
          {theme.windowTitle}
        </span>
        <span>ARCHIVO NACIONAL / {label}</span>
      </div>
      <div className="era-atmosphere" aria-hidden="true" />
      <footer className="press-footer">
        <span>HEMEROTECA NOSTALGIA</span>
        <span>
          {count} recuerdos / {label}
        </span>
        <span>EDICIÓN ARGENTINA</span>
      </footer>
    </div>
  );
}
