import PlayerFrame from '../shared/PlayerFrame';
import type { PlayerViewProps } from '../contracts';
import { theme } from './theme';
export default function Player(props: PlayerViewProps) {
  return <PlayerFrame {...props} pickerTitle="Vitrina de vinilos" title={theme.musicTitle} label="VINILO"><><div className="turntable-badge">NOSTALGIA &bull; HI-FI</div><div className="vinyl-platter"><i/></div><div className="tonearm-pivot"/><div className="tonearm"/><div className="turntable-switch"/><span>STEREO / 33 RPM</span></></PlayerFrame>;
}
