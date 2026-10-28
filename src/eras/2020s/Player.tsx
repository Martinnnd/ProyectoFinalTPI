import { AudioLines, ListMusic } from "lucide-react";
import PlayerFrame from "../shared/PlayerFrame";
import type { PlayerViewProps } from "../contracts";
import { theme } from "./theme";

export default function Player(props: PlayerViewProps) {
  const cover = Math.max(0, props.tracks.findIndex(item => item.spotifyId === props.track.spotifyId));
  return <>
    <PlayerFrame {...props} pickerTitle="Tu música" title={theme.musicTitle} label="EN REPRODUCCIÓN">
      <div className="now-artwork" data-cover={cover}>
        <div className="speaker-2020" aria-hidden="true"><div className="speaker-2020-face"><div className="speaker-2020-core"><AudioLines size={36} /></div></div></div>
        <div className="now-artwork-caption"><AudioLines size={15} /><span>SONANDO EN NOSTALGIAR</span><ListMusic size={15} /></div>
      </div>
    </PlayerFrame>
  </>;
}
