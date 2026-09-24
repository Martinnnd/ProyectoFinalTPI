import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Decade, Memory, Period } from "../types";

export type Destination = "map" | "stories" | "facts" | "music";
export interface EraTheme {
  brand: string;
  subtitle: string;
  brandLabel: string;
  shortLabel: string;
  windowTitle: string;
  storiesTitle: string;
  factsTitle: string;
  musicTitle: string;
  tokens: CSSProperties & Record<`--${string}`, string>;
}
export interface ChromeProps {
  period: Period;
  count: number;
  panelOpen: boolean;
  musicOpen: boolean;
  onNavigate: (destination: Destination) => void;
}
export interface MusicTrack {
  title: string;
  artist: string;
  year: number;
  spotifyId: string;
  reference: string;
}
export interface EraFact {
  id: string;
  year: number;
  kind: "Cine" | "Música" | "Acontecimientos" | "Tecnología" | "Deportes";
  title: string;
  description: string;
  dateLabel: string;
  scope: string;
  source: string;
  sourceName: string;
}
export interface PlayerViewProps {
  decade: Decade;
  expanded: boolean;
  track: MusicTrack;
  failed: boolean;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onError: () => void;
}
export interface PlayerFrameProps extends PlayerViewProps {
  title: string;
  label: string;
  children: ReactNode;
}
export interface EraContent {
  memories: Memory[];
  facts: EraFact[];
  music: [MusicTrack, ...MusicTrack[]];
  introduction: { label: string; description: string };
}
export interface EraModule {
  theme: EraTheme;
  icons: Record<Destination, LucideIcon>;
  Chrome: ComponentType<ChromeProps>;
  Player: ComponentType<PlayerViewProps>;
  content: EraContent;
}
