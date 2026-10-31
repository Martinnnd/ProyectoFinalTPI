import type { EraContent } from "../contracts";

export const content = {
  introduction: {
    label: "2020s · LA HISTORIA SIGUE",
    description: "Videos, canciones y encuentros que todavía estamos viviendo.",
  },
  memories: [
    {
      id: "demo-2021-reencuentro",
      title: "La primera mesa larga",
      year: 2021,
      category: "Personales",
      author: "Sofi",
      place: "Parque Centenario, Buenos Aires",
      lat: -34.6068,
      lng: -58.4359,
      description:
        "Nos volvimos a encontrar después de mucho tiempo. Alguien llevó una manta, otro apareció con comida y terminamos hablando hasta que se hizo de noche. Grabamos un video corto para recordar las voces de todos juntos. Cada vez que lo veo, me acuerdo de lo distinto que se sintió compartir una tarde sencilla. También quedó en el video el ruido de los colectivos, el viento y esa risa que siempre aparece antes de que alguien empiece a contar una anécdota.",
      source: "demo",
    },
    {
      id: "demo-2023-viaje",
      title: "Una ciudad en treinta segundos",
      year: 2023,
      category: "Lugares",
      author: "Leo",
      place: "Costanera, Mar del Plata",
      lat: -38.0055,
      lng: -57.5426,
      description:
        "Hicimos un video del viaje: el mar al llegar, el café de la mañana y todos corriendo para alcanzar el último colectivo. Dura apenas treinta segundos, pero cuando lo vuelvo a ver recuerdo toda la semana y las historias que quedaron fuera de cámara. No aparece la conversación del primer día ni la tarde en que nos perdimos buscando un lugar para comer. Aun así, esos pequeños cortes de imagen me devuelven cada detalle.",
      source: "demo",
    },
    {
      id: "demo-2025-recital",
      title: "La canción que cantamos juntos",
      year: 2025,
      category: "Música",
      author: "Mora",
      place: "Palermo, Buenos Aires",
      lat: -34.579,
      lng: -58.425,
      description:
        "En el recital se apagaron las luces y por un momento sólo se escuchó a la gente cantar. Guardé unos segundos de audio, pero lo que más recuerdo es mirar a mis amigos y saber que estábamos viviendo algo que íbamos a contar durante años. Al volver a casa compartimos el video en el grupo y cada uno tenía una perspectiva distinta del mismo instante. Ninguna grabación salió perfecta, pero juntas cuentan exactamente cómo se sintió estar ahí.",
      source: "demo",
    },
  ],
  facts: [
    {
      id: "pandemia-2020",
      year: 2020,
      kind: "Acontecimientos",
      title: "El mundo cambió de ritmo",
      description:
        "El 11 de marzo de 2020 la OMS caracterizó la COVID-19 como pandemia. Las calles vacías y los encuentros por videollamada cambiaron el ritmo de los días. Entre mensajes, fotos y llamadas a distancia, muchas personas encontraron nuevas maneras de seguir cerca de quienes querían.",
      dateLabel: "11 de marzo de 2020",
      scope: "Mundo",
      source:
        "https://www.who.int/docs/default-source/coronaviruse/situation-reports/20200311-sitrep-51-covid-19.pdf?sfvrsn=1ba62e57_8",
      sourceName: "Organización Mundial de la Salud",
      media: {
        url: "/facts/pandemic.jpg",
        caption: "Calle vacía en Brisbane, mayo de 2020 · Kgbo · CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Empty_George_Street,_Brisbane_during_the_the_COVID-19_pandemic,_May_2020.jpg",
      },
    },
    {
      id: "webb-2021",
      year: 2021,
      kind: "Tecnología",
      title: "Una nueva mirada al universo",
      description:
        "El telescopio espacial James Webb despegó desde la Guayana Francesa el 25 de diciembre de 2021. Tras años de preparación, comenzó un viaje destinado a observar galaxias lejanas y estudiar otros mundos. El lanzamiento volvió a reunir frente a las pantallas a quienes miraban el cielo con curiosidad.",
      dateLabel: "25 de diciembre de 2021",
      scope: "Espacio",
      source: "https://science.nasa.gov/mission/webb/launch/",
      sourceName: "NASA",
      media: {
        url: "/facts/webb.jpg",
        caption: "Lanzamiento del telescopio Webb · Bill Ingalls / NASA · dominio público",
        source:
          "https://commons.wikimedia.org/wiki/File:James_Webb_Space_Telescope_Launch_(NHQ202112250010).jpg",
      },
    },
    {
      id: "mundial-2022",
      year: 2022,
      kind: "Deportes",
      title: "Una alegría que salió a la calle",
      description:
        "El 18 de diciembre de 2022 Argentina ganó su tercera Copa Mundial tras una final ante Francia que se decidió por penales. En las casas, los bares y las plazas se vivió el mismo partido a la vez; después, las calles se llenaron de banderas, abrazos y fotos de un día difícil de olvidar.",
      dateLabel: "18 de diciembre de 2022",
      scope: "Argentina",
      source:
        "https://www.fifa.com/es/articles/argentina-le-gano-por-penales-a-francia-y-se-consagro-campeon-del-mundo",
      sourceName: "FIFA",
      media: {
        url: "/facts/argentina.jpg",
        caption: "Festejo por el Mundial en Buenos Aires · Solargentino · CC BY-SA 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Cartel_luminoso_celebrando_la_victoria_argentina_en_la_Copa_Mundial_de_F%C3%BAtbol_2022,_Buenos_Aires.jpg",
      },
    },
  ],
  music: [
    {
      title: "Blinding Lights",
      artist: "The Weeknd",
      year: 2020,
      spotifyId: "nostalgiar-2020-blinding-lights",
      audioSrc: "/music/2020s/The%20Weeknd%20Blinding%20Lights%20Lyrics.mp3",
      reference: "/music/2020s/The%20Weeknd%20Blinding%20Lights%20Lyrics.mp3",
    },
    {
      title: "Levitating",
      artist: "Dua Lipa",
      year: 2020,
      spotifyId: "nostalgiar-2020-levitating",
      audioSrc: "/music/2020s/Dua%20Lipa%20Levitating%20Lyrics.mp3",
      reference: "/music/2020s/Dua%20Lipa%20Levitating%20Lyrics.mp3",
    },
    {
      title: "Quevedo: Bzrp Music Sessions, Vol. 52",
      artist: "Bizarrap y Quevedo",
      year: 2022,
      spotifyId: "nostalgiar-2022-quevedo-bzrp",
      audioSrc: "/music/2020s/QUEVEDO%20BZRP%20Music%20Sessions%2052%2066.mp3",
      reference: "/music/2020s/QUEVEDO%20BZRP%20Music%20Sessions%2052%2066.mp3",
    },
  ],
} satisfies EraContent;
