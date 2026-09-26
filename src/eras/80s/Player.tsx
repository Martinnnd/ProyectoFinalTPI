import PlayerFrame from "../shared/PlayerFrame";
import type { PlayerViewProps } from "../contracts";
import { theme } from "./theme";
export default function Player(props: PlayerViewProps) {
  return (
    <PlayerFrame {...props} title={theme.musicTitle} label="VINILO">
      <>
        <div className="vinyl-platter">
          <i />
        </div>
        <div className="tonearm" />
        <span>STEREO / 33 RPM</span>
      </>
    </PlayerFrame>
  );
}