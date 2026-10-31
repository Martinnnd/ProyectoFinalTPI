import PlayerFrame from "../shared/PlayerFrame";
import type { PlayerViewProps } from "../contracts";
import { ListMusic, Wifi } from "lucide-react";
import { theme } from "./theme";

export default function Player(props: PlayerViewProps) {
  const cover = Math.max(
    0,
    props.tracks.findIndex((item) => item.spotifyId === props.track.spotifyId),
  );
  return (
    <PlayerFrame
      {...props}
      pickerTitle="Biblioteca · Música"
      title={theme.musicTitle}
      label="AHORA SUENA"
    >
      <div className="pocket-ios-status">
        <span className="pocket-signal" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <b>Nostalgiar</b>
        <Wifi size={11} />
        <time>9:41</time>
        <span className="pocket-battery" aria-hidden="true" />
      </div>
      <div className="pocket-ios-nav">
        <span>‹ Biblioteca</span>
        <strong>Ahora suena</strong>
        <ListMusic size={16} />
      </div>
      <div className="pocket-album-wrap">
        <div className="pocket-album" data-cover={cover}>
          <div className="pocket-album-art">
            <span className="pocket-art-sun" />
            <span className="pocket-art-hills" />
            <span className="pocket-art-film" />
            <span className="pocket-art-title">
              Nostalgiar <small>MEMORIAS · {props.track.year}</small>
            </span>
          </div>
        </div>
      </div>
    </PlayerFrame>
  );
}
