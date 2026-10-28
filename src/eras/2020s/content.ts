import type { EraContent } from "../contracts";

export const content = {
  introduction: {
    label: "2020s · LA HISTORIA SIGUE",
    description: "Videos, canciones y encuentros que todavía estamos viviendo.",
  },
  memories: [
    {
      id: "demo-2021-reencuentro", title: "La primera mesa larga", year: 2021,
      category: "Personales", author: "Sofi", place: "Parque Centenario, Buenos Aires",
      lat: -34.6068, lng: -58.4359,
      description: "Nos volvimos a encontrar después de mucho tiempo. Alguien llevó una manta, otro apareció con comida y terminamos hablando hasta que se hizo de noche. Grabamos un video corto para recordar las voces de todos juntos. Cada vez que lo veo, me acuerdo de lo distinto que se sintió compartir una tarde sencilla. También quedó en el video el ruido de los colectivos, el viento y esa risa que siempre aparece antes de que alguien empiece a contar una anécdota.",
      source: "demo",
    },
    {
      id: "demo-2023-viaje", title: "Una ciudad en treinta segundos", year: 2023,
      category: "Lugares", author: "Leo", place: "Costanera, Mar del Plata",
      lat: -38.0055, lng: -57.5426,
      description: "Hicimos un video del viaje: el mar al llegar, el café de la mañana y todos corriendo para alcanzar el último colectivo. Dura apenas treinta segundos, pero cuando lo vuelvo a ver recuerdo toda la semana y las historias que quedaron fuera de cámara. No aparece la conversación del primer día ni la tarde en que nos perdimos buscando un lugar para comer. Aun así, esos pequeños cortes de imagen me devuelven cada detalle.",
      source: "demo",
    },
    {
      id: "demo-2025-recital", title: "La canción que cantamos juntos", year: 2025,
      category: "Música", author: "Mora", place: "Palermo, Buenos Aires",
      lat: -34.579, lng: -58.425,
      description: "En el recital se apagaron las luces y por un momento sólo se escuchó a la gente cantar. Guardé unos segundos de audio, pero lo que más recuerdo es mirar a mis amigos y saber que estábamos viviendo algo que íbamos a contar durante años. Al volver a casa compartimos el video en el grupo y cada uno tenía una perspectiva distinta del mismo instante. Ninguna grabación salió perfecta, pero juntas cuentan exactamente cómo se sintió estar ahí.",
      source: "demo",
    },
  ],
  facts: [
    {
      id: "pandemia-2020", year: 2020, kind: "Acontecimientos",
      title: "El mundo cambió de ritmo",
      description: "El 11 de marzo de 2020 la OMS caracterizó la COVID-19 como pandemia. Las videollamadas y las historias compartidas a distancia pasaron a formar parte de la vida cotidiana.",
      dateLabel: "11 de marzo de 2020", scope: "Mundo",
      source: "https://www.who.int/europe/emergencies/situations/COVID-19", sourceName: "Organización Mundial de la Salud",
    },
    {
      id: "webb-2021", year: 2021, kind: "Tecnología",
      title: "Una nueva mirada al universo",
      description: "El telescopio espacial James Webb despegó el 25 de diciembre de 2021. Su lanzamiento abrió una nueva etapa para explorar el universo.",
      dateLabel: "25 de diciembre de 2021", scope: "Espacio",
      source: "https://science.nasa.gov/mission/webb/launch/", sourceName: "NASA",
    },
  ],
  music: [
    { title: "Blinding Lights", artist: "The Weeknd", year: 2020, spotifyId: "nostalgiar-2020-blinding-lights", audioSrc: "/music/2020s/The%20Weeknd%20Blinding%20Lights%20Lyrics.mp3", reference: "/music/2020s/The%20Weeknd%20Blinding%20Lights%20Lyrics.mp3" },
    { title: "Levitating", artist: "Dua Lipa", year: 2020, spotifyId: "nostalgiar-2020-levitating", audioSrc: "/music/2020s/Dua%20Lipa%20Levitating%20Lyrics.mp3", reference: "/music/2020s/Dua%20Lipa%20Levitating%20Lyrics.mp3" },
    { title: "Quevedo: Bzrp Music Sessions, Vol. 52", artist: "Bizarrap y Quevedo", year: 2022, spotifyId: "nostalgiar-2022-quevedo-bzrp", audioSrc: "/music/2020s/QUEVEDO%20BZRP%20Music%20Sessions%2052%2066.mp3", reference: "/music/2020s/QUEVEDO%20BZRP%20Music%20Sessions%2052%2066.mp3" },
  ],
} satisfies EraContent;
