import PlayerFrame from '../shared/PlayerFrame';
import type { PlayerViewProps } from '../contracts';
import { theme } from './theme';
export default function Player(props: PlayerViewProps) {
  return <PlayerFrame {...props} pickerTitle="Colección de cassettes" title={theme.musicTitle} label="FM NOSTALGIA"><><div className="radio-handle"/><div className="radio-antenna"/><div className="radio-speaker"/><div className="radio-tuner"><span>FM 88 - 96 - 104 - 108</span><i/><div className="cassette"><i/><span>STEREO</span><i/></div></div><div className="radio-speaker"/></></PlayerFrame>;
}
