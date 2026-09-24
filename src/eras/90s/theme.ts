import { Monitor, FolderOpen, Newspaper, Music2 } from "lucide-react";
import type { EraTheme } from "../contracts";
export const theme = {
  brand: "Nostalgia 95",
  subtitle: "Mi PC > Argentina > Mis recuerdos",
  windowTitle: "Nostalgia 95 — Explorador de recuerdos",
  storiesTitle: "Mis recuerdos — Explorador",
  factsTitle: "Datos de época — Bloc de notas",
  musicTitle: "Reproductor multimedia",
  brandLabel: "Mi escritorio",
  shortLabel: "90s",
  tokens: {
    "--font-body": "Tahoma,'MS Sans Serif',Arial,sans-serif",
    "--font-display": "Tahoma,'MS Sans Serif',Arial,sans-serif",
    "--bg": "#008080",
    "--surface": "#c0c0c0",
    "--ink": "#151515",
    "--muted": "#484848",
    "--accent": "#000080",
    "--soft": "#d4d0c8",
    "--line": "#808080",
    "--radius": "0px",
    "--shadow": "inset 1px 1px #fff,inset -1px -1px #111,2px 2px 0 #0005",
    "--raised":
      "inset 1px 1px #fff,inset -1px -1px #0a0a0a,inset 2px 2px #dfdfdf,inset -2px -2px #808080",
    "--sunken":
      "inset 1px 1px #808080,inset -1px -1px #fff,inset 2px 2px #161616,inset -2px -2px #dfdfdf",
  },
} satisfies EraTheme;

export const icons = {
  map: Monitor,
  stories: FolderOpen,
  facts: Newspaper,
  music: Music2,
};
