import type { EraContent } from "../contracts";
// Demo authors and personal stories are fictional. Keep IDs stable.
export const content = {
  introduction: {
    label: "Los setenta",
    description: "Revistas, discos de vinilo y viajes con el mapa desplegado.",
  },
  memories: [
    {
      place: "Parque Centenario, Caballito, Buenos Aires",
      lat: -34.6065,
      lng: -58.4355,
      id: "demo-21",
      title: "El mapa abierto junto al lago",
      year: 1972,
      category: "Lugares",
      author: "Elena",
      description:
        "Nos sentamos en un banco del Parque Centenario, en Caballito, para planear las vacaciones. Papá desplegó el mapa de rutas sobre las rodillas y mamá marcó con lápiz los pueblos donde podíamos parar. Yo sujetaba una esquina para que no se volara. Después dimos una vuelta al lago y compramos maní. Guardamos aquel mapa doblado en la guantera; años después todavía tenía la mancha redonda del termo.",
      source: "demo",
    },
    {
      place: "Monumento Nacional a la Bandera, Rosario",
      lat: -32.9475,
      lng: -60.6304,
      id: "demo-22",
      title: "La bolsa de discos frente al río",
      year: 1976,
      category: "Música",
      author: "Roberto",
      description:
        "Me encontré con mi hermana en las escalinatas del Monumento a la Bandera, en Rosario. Venía con un disco nuevo bajo el brazo, envuelto en una bolsa de papel que no quería apoyar en el suelo. Nos quedamos mirando el Paraná mientras me contaba qué tema íbamos a escuchar primero. Volvimos caminando a casa y corrimos las sillas del comedor. Lo que más recuerdo es el cuidado con que bajó la púa.",
      source: "demo",
    },
    {
      place: "Plaza San Martín, centro de Córdoba",
      lat: -31.4167,
      lng: -64.1835,
      id: "demo-23",
      title: "La revista que pasó de mano en mano",
      year: 1974,
      category: "Personales",
      author: "Inés",
      description:
        "La abuela nos esperaba en la Plaza San Martín de Córdoba con una revista doblada dentro de la cartera. Nos sentamos frente a la Catedral y nos mostró una receta que quería probar el domingo. Mi prima se quedó mirando las publicidades y yo copié los ingredientes en un papel. Al volver compramos harina y huevos. El bizcochuelo salió torcido, pero guardamos el recorte entre las páginas de su cuaderno.",
      source: "demo",
    },
    {
      place: "Lago del Parque General San Martín, Mendoza",
      lat: -32.8951,
      lng: -68.8794,
      id: "demo-24",
      title: "El aniversario bajo los árboles",
      year: 1975,
      category: "Acontecimientos",
      author: "Raúl",
      description:
        "Para el aniversario de mis padres llevamos una mesa plegable al lago del Parque General San Martín, en Mendoza. Mis tíos llegaron con empanadas y mi hermana preparó un cartel pintado con témpera. Antes de almorzar nos acomodamos para una foto con la cámara de rollo. El disparador tardó tanto que papá salió corriendo a comprobarlo. En la copia aparece de espaldas y el resto de nosotros riéndose.",
      source: "demo",
    },
    {
      place: "Plaza Colón, centro de Mar del Plata",
      lat: -38.0068,
      lng: -57.5433,
      id: "demo-25",
      title: "La cartelera anotada en el diario",
      year: 1978,
      category: "Cine",
      author: "Susana",
      description:
        "En las vacaciones de Mar del Plata nos reuníamos en Plaza Colón después de la merienda. Una tarde mi tío llevó el diario y rodeó con birome tres horarios de cine. Cada primo votó por una película distinta y terminamos decidiendo por la que nos dejaba volver temprano a cenar. Conservé la página doblada como señalador durante meses. Hoy no recuerdo qué sala elegimos, pero sí aquella discusión en el banco.",
      source: "demo",
    },
    {
      place: "Centro Cívico, San Carlos de Bariloche",
      lat: -41.1335,
      lng: -71.3102,
      id: "demo-26",
      title: "La postal para contar el viaje",
      year: 1973,
      category: "Televisión",
      author: "Daniel",
      description:
        "En el Centro Cívico de Bariloche compré una postal para mis abuelos. Habíamos visto paisajes de montañas en su televisor en blanco y negro y quería contarles cómo eran los colores de verdad. Me senté debajo de los arcos a escribir mientras mamá buscaba una estampilla. Dibujé un pequeño sol junto al saludo. Cuando regresamos, la postal estaba apoyada sobre el televisor, al lado del retrato de casamiento.",
      source: "demo",
    },
    {
      place: "Plaza 9 de Julio, centro de Salta",
      lat: -24.7892,
      lng: -65.4103,
      id: "demo-27",
      title: "La maquinita dibujada en el cuaderno",
      year: 1979,
      category: "Videojuegos",
      author: "Teresa",
      description:
        "Mi primo trajo a Salta una revista con una nota sobre juegos electrónicos. La leímos sentados en la Plaza 9 de Julio, frente al Cabildo. Ninguno tenía una consola, así que copiamos la pantalla en un cuaderno e inventamos reglas para jugar con el lápiz. Cada cuadradito era un punto y el que se salía perdía el turno. La abuela nos llamó para merendar y seguimos discutiendo el puntaje hasta llegar a casa.",
      source: "demo",
    },
  ],
  facts: [
    {
      id: "starwars",
      year: 1977,
      kind: "Cine",
      title: "Una galaxia llegó a las salas",
      description:
        "Star Wars se estrenó el 25 de mayo de 1977 en Estados Unidos. La aventura de Luke, Leia y Han sería conocida más tarde como Una nueva esperanza. Esta fecha corresponde al estreno original, no al argentino.",
      dateLabel: "Estreno original · 1977",
      scope: "Cultura internacional",
      source: "https://www.starwars.com/films/star-wars-episode-iv-a-new-hope",
      sourceName: "Star Wars · sitio oficial",
    },
    {
      id: "voyager",
      year: 1977,
      kind: "Tecnología",
      title: "Dos viajeras rumbo a los planetas",
      description:
        "Las sondas Voyager 2 y Voyager 1 despegaron en agosto y septiembre de 1977. Comenzaba un viaje de exploración de los planetas exteriores que llevaría instrumentos y cámaras mucho más allá de la Tierra.",
      dateLabel: "Agosto y septiembre · 1977",
      scope: "Estados Unidos · Exploración espacial",
      source: "https://science.nasa.gov/mission/voyager/fact-sheet/",
      sourceName: "NASA",
    },
    {
      id: "arrival",
      year: 1976,
      kind: "Música",
      title: "ABBA invitó a todos a bailar",
      description:
        "Arrival apareció en Suecia en octubre de 1976. El álbum incluye Dancing Queen y Knowing Me, Knowing You, canciones que quedaron asociadas al sonido pop de los setenta.",
      dateLabel: "Publicación del álbum · 1976",
      scope: "Cultura internacional",
      source:
        "https://abbasite.com/articles/in-focus-arrival-the-making-of-a-classic-pop-album/",
      sourceName: "ABBA · sitio oficial",
    },
  ],
  music: [
    {
      title: "Dancing Queen",
      artist: "ABBA",
      year: 1976,
      spotifyId: "01topnfXJFjW4iQMVAXAo8",
      reference: "https://open.spotify.com/track/01topnfXJFjW4iQMVAXAo8",
    },
    {
      title: "Bohemian Rhapsody",
      artist: "Queen",
      year: 1975,
      spotifyId: "1yslmgUcM2AOkOPS4sl3QV",
      reference: "https://open.spotify.com/track/1yslmgUcM2AOkOPS4sl3QV",
    },
  ],
} satisfies EraContent;
