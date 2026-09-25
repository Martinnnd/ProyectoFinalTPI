import { Globe2, Users, BookOpen, Music2 } from "lucide-react";
import type { EraTheme } from "../contracts";
export const theme = {
  brand: "nostalgia",
  subtitle: "Mi estado: volviendo a esos días",
  windowTitle: "Nostalgia — Internet Explorer",
  storiesTitle: "Mis recuerdos — Nostalgia Messenger",
  factsTitle: "La época — Internet Explorer",
  musicTitle: "Mi música · Compartiendo recuerdos",
  brandLabel: "Nostalgia Messenger",
  shortLabel: "2000",
  tokens: {
    "--bg": "#e8f3ff",
    "--surface": "#f4f7fc",
    "--ink": "#1d3555",
    "--muted": "#53667e",
    "--accent": "#1558a8",
    "--soft": "#dceafa",
    "--line": "#94b7df",
    "--radius": "7px",
    "--shadow": "0 3px 10px #234e7f40,inset 0 1px #fff",
    "--font-body": "Verdana,Tahoma,sans-serif",
    "--font-display": "'Trebuchet MS',Verdana,sans-serif",
  },
} satisfies EraTheme;

export const icons = {
  map: Globe2,
  stories: Users,
  facts: BookOpen,
  music: Music2,
};
