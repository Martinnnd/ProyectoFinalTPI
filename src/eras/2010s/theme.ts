import { Camera, BookOpen, MapPin, Music2 } from "lucide-react";
import type { EraTheme } from "../contracts";

export const theme = {
  brand: "Nostalgiar",
  subtitle: "Una foto. Un lugar. Toda una historia.",
  brandLabel: "TU DIARIO FOTOGRÁFICO",
  shortLabel: "2010s",
  windowTitle: "Nostalgiar · Diario de bolsillo",
  storiesTitle: "Fotos y recuerdos",
  factsTitle: "La década en imágenes",
  musicTitle: "Música en tu bolsillo",
  tokens: {
    "--bg": "#e5e7e5",
    "--surface": "#fffdf8",
    "--ink": "#253b46",
    "--muted": "#617782",
    "--accent": "#2b7190",
    "--soft": "#e9f1ef",
    "--line": "#b5c8ca",
    "--radius": "12px",
    "--shadow": "0 12px 30px #23384222, 0 2px 5px #23384214",
    "--font-body": "'Trebuchet MS',Arial,sans-serif",
    "--font-display": "Georgia,'Times New Roman',serif",
  },
} satisfies EraTheme;

export const icons = { map: MapPin, stories: Camera, facts: BookOpen, music: Music2 };
