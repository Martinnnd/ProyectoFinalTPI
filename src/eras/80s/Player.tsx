import PlayerFrame from '../shared/PlayerFrame';
import type { PlayerViewProps } from '../contracts';
import { theme } from './theme';
export default function Player(props: PlayerViewProps) {
  return <PlayerFrame {...props} pickerTitle="Seleccioná tu hit" title={theme.musicTitle} label="ROCKOLA"><div className="jukebox"><div className="jukebox-arch"><span>NOSTALGIA</span><small>STEREO &bull; MUSIC BOX</small></div><div className="jukebox-glass"><div className="jukebox-record"/><div className="jukebox-selections">{Array.from({length: 6}, (_, i) => <i key={i}>{String(i + 1).padStart(2, '0')} ---</i>)}</div></div><div className="jukebox-grille"/><div className="jukebox-chrome"/></div></PlayerFrame>;
}
