import { BookOpen, MapPin, Music2, Clapperboard } from "lucide-react";
import type { EraTheme } from "../contracts";

export const theme = {
  brand: "Nostalgiar",
  subtitle: "La historia sigue pasando.",
  brandLabel: "RECUERDOS EN VIVO",
  shortLabel: "2020s",
  windowTitle: "Nostalgiar · Ahora",
  storiesTitle: "Momentos",
  factsTitle: "Lo que nos marcó",
  musicTitle: "Ahora suena",
  tokens: {
    "--bg": "#0b1119",
    "--surface": "#17212d",
    "--ink": "#f3f7fb",
    "--muted": "#a3b2c2",
    "--accent": "#5ce5cc",
    "--soft": "#1c303c",
    "--line": "#384b59",
    "--radius": "18px",
    "--shadow": "0 18px 55px #02060c88, inset 0 1px #ffffff0e",
    "--font-body": "Inter, 'Segoe UI', Arial, sans-serif",
    "--font-display": "Inter, 'Segoe UI', Arial, sans-serif",
  },
} satisfies EraTheme;

export const icons = { map: MapPin, stories: Clapperboard, facts: BookOpen, music: Music2 };
