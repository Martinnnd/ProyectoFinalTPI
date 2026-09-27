import { Map, Newspaper, BookOpen, Radio } from 'lucide-react';
import type { EraTheme } from '../contracts';
export const theme = {
  "brand": "Nostalgia",
  "subtitle": "RECUERDOS EN BLANCO Y NEGRO",
  "windowTitle": "Nostalgia TV / Canal 70",
  "storiesTitle": "Historias en pantalla",
  "factsTitle": "Archivo de televisión",
  "musicTitle": "Sonidos de los setenta",
  "brandLabel": "CANAL 70 / EN EL AIRE",
  "shortLabel": "70s",
  "tokens": {
    "--font-body": "Arial,Helvetica,sans-serif",
    "--font-display": "'Courier New',monospace",
    "--bg": "#242424",
    "--surface": "#e0e0da",
    "--ink": "#202120",
    "--muted": "#555752",
    "--accent": "#343a35",
    "--soft": "#bfc1b9",
    "--line": "#858780",
    "--radius": "8px",
    "--shadow": "0 3px 12px #0005"
  }
} satisfies EraTheme;

export const icons = { map: Map, stories: Newspaper, facts: BookOpen, music: Radio };
