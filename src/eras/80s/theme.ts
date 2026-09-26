import { Gamepad2, CassetteTape, Sparkles, Radio } from "lucide-react";
import type { EraTheme } from "../contracts";
export const theme = {
  brand: "NOSTALGIA",
  subtitle: "VIDEO CLUB · REBOBINÁ TUS RECUERDOS",
  windowTitle: "VHS / ARCHIVO DE RECUERDOS",
  storiesTitle: "MEMORY SELECT / HISTORIAS",
  factsTitle: "FLASHBACK / ARCHIVO CULTURAL",
  musicTitle: "STEREO / LADO A",
  brandLabel: "EST. 1980 / VIDEO ARCHIVE",
  shortLabel: "80s",
  tokens: {
    "--bg": "#110a21",
    "--surface": "#180e2c",
    "--ink": "#f9edff",
    "--muted": "#cabbdd",
    "--accent": "#4ff7f3",
    "--soft": "#2c1840",
    "--line": "#a54bac",
    "--radius": "0px",
    "--shadow": "3px 3px 0 #ff2cbb66,0 0 17px #ec20cb25",
    "--font-body": "'Chakra Petch','Courier New',monospace",
    "--font-display": "'Audiowide','Courier New',monospace",
  },
} satisfies EraTheme;

export const icons = {
  map: Gamepad2,
  stories: CassetteTape,
  facts: Sparkles,
  music: Radio,
};
