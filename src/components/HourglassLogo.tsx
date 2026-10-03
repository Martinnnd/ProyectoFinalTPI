import type { Decade } from "../types";
import { logoThemes } from "./logoThemes";

/** Original embedded preview extracted losslessly from the supplied Affinity file. */
export default function HourglassLogo({decade}: {decade:Decade}) {
  return <svg className="hourglass-logo" viewBox="0 0 360 400" fill="none" aria-hidden="true"><image href={logoThemes[decade].asset} width="360" height="400" preserveAspectRatio="xMidYMid meet"/></svg>;
}
