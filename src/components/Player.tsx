import { useState } from "react";
import type { Decade } from "../types";
import { eraRegistry } from "../eras/registry";
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
  const tracks = content.music;
  function change(direction: number) {
    setIndex((i) => (i + direction + tracks.length) % tracks.length);
    setFailed(false);
  }
  return (
    <View
      decade={decade}
      expanded={expanded}
      track={tracks[index % tracks.length]}
      failed={failed}
      onToggle={onToggle}
      onPrevious={() => change(-1)}
      onNext={() => change(1)}
      onError={() => setFailed(true)}
    />
  );
}
