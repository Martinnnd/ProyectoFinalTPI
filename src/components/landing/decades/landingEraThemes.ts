export type LandingEraId = "1970" | "1980" | "1990" | "2000" | "2010";

export type LandingEra = {
  id: LandingEraId;
  year: string;
  title: string;
  description: string;
  chromeTitle: string;
  chromeStatus: string;
  href: string;
};

export const landingEras: readonly LandingEra[] = [
  {
    id: "1970",
    year: "70",
    title: "Vinilos y rutas",
    description: "Revistas, discos y recuerdos que todavía giran.",
    chromeTitle: "CANAL 70 / EN EL AIRE",
    chromeStatus: "SEÑAL · ARCHIVO",
    href: "/explorar?era=1970",
  },
  {
    id: "1980",
    year: "80",
    title: "Neón y aventuras",
    description: "Arcades, VHS y canciones grabadas de la radio.",
    chromeTitle: "VIDEO CLUB / LADO A",
    chromeStatus: "PLAY · VHS",
    href: "/explorar?era=1980",
  },
  {
    id: "1990",
    year: "90",
    title: "Cassettes y ventanas",
    description: "Historias compartidas entre grunge y computadoras.",
    chromeTitle: "Nostalgiar 95",
    chromeStatus: "Mi PC > Recuerdos",
    href: "/explorar?era=1990",
  },
  {
    id: "2000",
    year: "00",
    title: "Chats y nuevas pantallas",
    description: "La época en la que empezamos a vivir conectados.",
    chromeTitle: "Nostalgiar Messenger",
    chromeStatus: "● Conectado",
    href: "/explorar?era=2000",
  },
  {
    id: "2010",
    year: "10",
    title: "Fotos en el bolsillo",
    description: "Filtros, diarios personales y canciones para compartir.",
    chromeTitle: "Nostalgiar · Diario fotográfico",
    chromeStatus: "2012 · Compartir momento",
    href: "/explorar?era=2010",
  },
] as const;
