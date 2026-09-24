import PlayerFrame from "../shared/PlayerFrame";
import type { PlayerViewProps } from "../contracts";
import { theme } from "./theme";
export default function Player(props: PlayerViewProps) {
  return (
    <PlayerFrame {...props} title={theme.musicTitle} label="EN TU BOLSILLO">
      <>
        <span>nostalgiaPod</span>
        <span>♫ ▰</span>
      </>
    </PlayerFrame>
  );
}
