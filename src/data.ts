// Shared aggregation only. Edit stories inside each era/content.ts.
import { availableDecades, eraRegistry } from "./eras/registry";
import type { Achievement, Decade, Memory } from "./types";
export const initialMemories: Memory[] = availableDecades.flatMap(
  (year) => eraRegistry[year].content.memories,
);
export const eraContent = Object.fromEntries(
  availableDecades.map((year) => [
    year,
    eraRegistry[year].content.introduction,
  ]),
) as Record<Decade, { label: string; description: string }>;

// Temporary hardcoded catalogue, images live in public/logros. `unlocked` is
// faked for now: real progress will be derived from the visitor's own memories
// once achievements are wired to the data layer.
export const achievements: Achievement[] = [
  {
    id: "01",
    name: "Primer paso",
    description: "Publicaste tu primer recuerdo en el mapa.",
    image: "/logros/01_primer_paso.png",
    unlocked: false,
  },
  {
    id: "02",
    name: "Cronista local",
    description: "Relataste 5 recuerdos de un mismo lugar.",
    image: "/logros/02_cronista_local.png",
    unlocked: false,
  },
  {
    id: "03",
    name: "Trotamundos",
    description: "Marcaste recuerdos en 10 ciudades distintas.",
    image: "/logros/03_trotamundos.png",
    unlocked: false,
  },
  {
    id: "04",
    name: "Voz de una época",
    description: "Completaste todos los recuerdos de una década.",
    image: "/logros/04_voz_de_una_epoca.png",
    unlocked: false,
  },
  {
    id: "05",
    name: "Década completa",
    description: "Tuviste al menos un recuerdo en cada década.",
    image: "/logros/05_decada_completa.png",
    unlocked: false,
  },
  {
    id: "06",
    name: "Popular",
    description: "Uno de tus recuerdos llegó a 20 reacciones.",
    image: "/logros/06_popular.png",
    unlocked: false,
  },
  {
    id: "07",
    name: "Leyenda",
    description: "Un recuerdo tuyo llegó a 100 reacciones.",
    image: "/logros/07_leyenda.png",
    unlocked: false,
  },
  {
    id: "08",
    name: "Generoso",
    description: "Aportaste 5 recuerdos a la memoria de otro lugar.",
    image: "/logros/08_generoso.png",
    unlocked: false,
  },
  {
    id: "09",
    name: "Mecenas",
    description: "Completaste 10 historias incompletas de tu barrio.",
    image: "/logros/09_mecenas.png",
    unlocked: false,
  },
  {
    id: "10",
    name: "Primera palabra",
    description: "Escribiste tu primera historia completa.",
    image: "/logros/10_primera_palabra.png",
    unlocked: true,
  },
  {
    id: "11",
    name: "Conversador",
    description: "Comentaste 25 recuerdos ajenos.",
    image: "/logros/11_conversador.png",
    unlocked: false,
  },
  {
    id: "12",
    name: "Corazón abierto",
    description: "Compartiste 5 recuerdos muy personales.",
    image: "/logros/12_corazon_abierto.png",
    unlocked: true,
  },
  {
    id: "13",
    name: "Con amigos",
    description: "Tus 10 recuerdos más vistos los leyeron 3 personas que conocés.",
    image: "/logros/13_con_amigos.png",
    unlocked: false,
  },
  {
    id: "14",
    name: "Influencer",
    description: "Alguien sigue tus recuerdos y publica los suyos propios.",
    image: "/logros/14_influencer.png",
    unlocked: false,
  },
  {
    id: "15",
    name: "Tendencia",
    description: "Un recuerdo tuyo fue el más agregado del mes.",
    image: "/logros/15_tendencia.png",
    unlocked: false,
  },
  {
    id: "16",
    name: "Historiador",
    description: "Describiste las consolas, las discotecas y las campañas de tu época.",
    image: "/logros/16_historiador.png",
    unlocked: false,
  },
  {
    id: "17",
    name: "Fotógrafo del recuerdo",
    description: "Adjuntaste imágenes a 10 recuerdos tuyos.",
    image: "/logros/17_fotografoDelRecuerdo.png",
    unlocked: false,
  },
  {
    id: "18",
    name: "Racha de hierro",
    description: "Publicaste un recuerdo durante 7 días seguidos.",
    image: "/logros/18_rachaDeHierro.png",
    unlocked: false,
  },
  {
    id: "19",
    name: "Racha de oro",
    description: "Publicaste un recuerdo durante 30 días seguidos.",
    image: "/logros/19_rachaDeOro.png",
    unlocked: false,
  },
  {
    id: "20",
    name: "Coleccionista",
    description: "Reuniste las 20 insignias de Nostalgiar.",
    image: "/logros/20_coleccionista.png",
    unlocked: false,
  },
];

// Returns the catalogue with the earned badges marked as unlocked, keeping the
// catalogue order so the rail, the counter and the dialog always agree.
export function resolveAchievements(earned: Achievement[]): Achievement[] {
  if (!earned.length) return achievements;
  const earnedIds = new Set(earned.map((achievement) => achievement.id));
  return achievements.map((achievement) =>
    earnedIds.has(achievement.id) ? { ...achievement, unlocked: true } : achievement,
  );
}
