import { useState } from "react";
import type { Decade } from "../types";
import { eraRegistry } from "../eras/registry";
import { localTracks } from "../localMusic";
export default function Player({
  decade,
  expanded,
  onToggle,
}: {
  decade: Decade;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const { content, Player: View } = eraRegistry[decade];
  const tracks = localTracks(content.music);
  if (!tracks.length) return null;
  function change(direction: number) {
    setIndex((i) => (i + direction + tracks.length) % tracks.length);
    setFailed(false);
  }
  return (
    <View
      decade={decade}
      expanded={expanded}
      tracks={tracks}
      onSelect={(i) => {
        setIndex(i);
        setFailed(false);
      }}
      track={tracks[index % tracks.length]}
      failed={failed}
      onToggle={onToggle}
      onPrevious={() => change(-1)}
      onNext={() => change(1)}
      onError={() => setFailed(true)}
    />
  );
}
