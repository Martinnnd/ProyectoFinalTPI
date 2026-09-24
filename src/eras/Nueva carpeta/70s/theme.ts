import { Map, Newspaper, BookOpen, Radio } from "lucide-react";
import type { EraTheme } from "../contracts";
export const theme = {
  brand: "Nostalgia",
  subtitle: "CRÓNICAS DE UNA DÉCADA INOLVIDABLE",
  windowTitle: "La revista de nuestros recuerdos",
  storiesTitle: "Crónicas & correspondencia",
  factsTitle: "Cultura / Archivo de época",
  musicTitle: "La discoteca / Selección musical",
  brandLabel: "EDICIÓN ESPECIAL / 1970–1979",
  shortLabel: "70s",
  tokens: {
    "--font-body": "Georgia,'Times New Roman',serif",
    "--font-display": "Georgia,'Times New Roman',serif",
    "--bg": "#e6d5a7",
    "--surface": "#f2e7c9",
    "--ink": "#243c4e",
    "--muted": "#625944",
    "--accent": "#b44222",
    "--soft": "#e5d4aa",
    "--line": "#9c8b67",
    "--radius": "0px",
    "--shadow": "2px 3px 0 #77664b35",
  },
} satisfies EraTheme;

export const icons = {
  map: Map,
  stories: Newspaper,
  facts: BookOpen,
  music: Radio,
};
