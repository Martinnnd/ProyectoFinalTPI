import type { EraContent } from "../contracts";
// Demo authors and personal stories are fictional. Keep IDs stable.
export const content = {
  introduction: {
    label: "Los ochenta",
    description:
      "Cassettes, cámaras con rollo y tardes que parecían no terminar.",
  },
  memories: [
    {
      place: "Parque Centenario, Caballito, Buenos Aires",
      lat: -34.6065,
      lng: -58.4355,
      id: "demo-0",
      title: "El walkman de mi hermano en Centenario",
      year: 1985,
      category: "Música",
      author: "Leo",
      description:
        "Fuimos un domingo de septiembre al Parque Centenario, en Caballito. Mi hermano llevaba su walkman en una riñonera y me prestó un auricular mientras dábamos la vuelta al lago. Había grabado canciones de la radio: entre tema y tema se escuchaba al locutor. Nos sentamos en el pasto, compartimos una mandarina y anotamos en la cajita qué canciones queríamos conseguir completas. Cada vez que veo un cassette me acuerdo de esa caminata.",
      source: "demo",
    },
    {
      place: "Monumento Nacional a la Bandera, Rosario",
      lat: -32.9475,
      lng: -60.6304,
      id: "demo-1",
      title: "La excursión al Monumento a la Bandera",
      year: 1983,
      category: "Lugares",
      author: "Clara",
      description:
        "La seño nos llevó al Monumento a la Bandera, en Rosario, en una salida de cuarto grado. Mi mamá me había preparado dos sanguchitos envueltos en una servilleta y una naranja. Subimos los escalones en fila, buscamos el río entre las columnas y después dibujamos el monumento sentados en nuestros abrigos. En mi dibujo la torre quedó torcida. Todavía está pegado en el cuaderno de ese año.",
      source: "demo",
    },
    {
      place: "Plaza San Martín, centro de Córdoba",
      lat: -31.4167,
      lng: -64.1835,
      id: "demo-2",
      title: "Una foto frente a la Catedral de Córdoba",
      year: 1987,
      category: "Personales",
      author: "Marina",
      description:
        "Mi papá nos citó en la Plaza San Martín, frente a la Catedral, para empezar las vacaciones con una foto de los cuatro. Mi hermana y yo teníamos el mismo pulóver tejido por la abuela. Cuando levantó la cámara, una paloma pasó tan cerca que nos agachamos. Gastó otra foto, pero al revelar el rollo elegimos la primera: estábamos muertos de risa. Fue nuestra postal familiar de Córdoba.",
      source: "demo",
    },
    {
      place: "Lago del Parque General San Martín, Mendoza",
      lat: -32.8951,
      lng: -68.8794,
      id: "demo-3",
      title: "El mantel a cuadros junto al lago",
      year: 1988,
      category: "Acontecimientos",
      author: "Gustavo",
      description:
        "Festejamos los sesenta de mi abuela al lado del lago del Parque General San Martín, en Mendoza. Mi tío llegó en bicicleta con el pan atado al portaequipaje y mi mamá llevó una torta en una caja de zapatos. Pusimos el mantel a cuadros bajo un árbol y sujetamos las esquinas con cuatro piedras. Cuando sopló las velitas, el viento apagó la mitad antes que ella. La seguimos cargando durante años.",
      source: "demo",
    },
    {
      place: "Plaza Colón, centro de Mar del Plata",
      lat: -38.0068,
      lng: -57.5433,
      id: "demo-4",
      title: "El final de la película, en Plaza Colón",
      year: 1986,
      category: "Cine",
      author: "Paula",
      description:
        "Ese enero nos alojábamos a dos cuadras de Plaza Colón, en Mar del Plata. Una noche salimos del cine y nos quedamos en un banco de la plaza, con los abrigos encima de las rodillas, discutiendo el final de Volver al futuro. Mi primo juraba que algún día los autos iban a volar. Mamá nos compró maní y dejamos que hablara hasta terminar la bolsita. No me acuerdo de la sala, pero sí de esa conversación.",
      source: "demo",
    },
    {
      place: "Centro Cívico, San Carlos de Bariloche",
      lat: -41.1335,
      lng: -71.3102,
      id: "demo-5",
      title: "El capítulo que contamos en el Centro Cívico",
      year: 1989,
      category: "Televisión",
      author: "Nico",
      description:
        "En nuestro primer viaje a Bariloche, mi hermana tenía miedo de perderse su programa de la tarde. Durante la parada en el Centro Cívico, papá hizo de narrador e inventó un capítulo con nosotros como protagonistas. La torre del reloj era un castillo y el lago, un lugar secreto. Nos sacó una foto actuando frente a los arcos. Terminamos olvidándonos de pedir que prendieran la tele en el hotel.",
      source: "demo",
    },
    {
      place: "Plaza 9 de Julio, centro de Salta",
      lat: -24.7892,
      lng: -65.4103,
      id: "demo-6",
      title: "Tres intentos bajo los árboles de la plaza",
      year: 1984,
      category: "Videojuegos",
      author: "Ana",
      description:
        "Mi primo vino de visita a Salta con una maquinita electrónica de un solo juego. La llevó a la Plaza 9 de Julio después del almuerzo. Elegimos un banco a la sombra, frente al Cabildo, porque al sol no se veía la pantalla. Anotábamos los puntajes en el reverso de un boleto y cada uno tenía tres intentos. Mi abuela nos encontró ahí dos horas después: no habíamos caminado ni una cuadra.",
      source: "demo",
    },
  ],
  facts: [
    {
      id: "bttf",
      year: 1985,
      kind: "Cine",
      title: "Un DeLorean nos llevó al futuro",
      description:
        "Volver al futuro llegó al cine en 1985. Marty McFly viaja a 1955 y tiene que encontrar la forma de regresar. La fecha corresponde al estreno original en Estados Unidos, no al estreno argentino.",
      dateLabel: "Estreno original · 1985",
      scope: "Cultura internacional",
      source: "https://amblin.com/movie/back-to-the-future/",
      sourceName: "Amblin",
    },
    {
      id: "democracy",
      year: 1983,
      kind: "Acontecimientos",
      title: "Argentina recuperó la democracia",
      description:
        "El 10 de diciembre de 1983 asumió Raúl Alfonsín y comenzó una nueva etapa democrática, después de la última dictadura cívico-militar.",
      dateLabel: "10 de diciembre de 1983",
      scope: "Argentina",
      source:
        "https://www.argentina.gob.ar/noticias/10-de-diciembre-dia-de-la-restauracion-de-la-democracia-2",
      sourceName: "Argentina.gob.ar",
    },
    {
      id: "appetite",
      year: 1987,
      kind: "Música",
      title: "El debut de los Guns",
      description:
        "Appetite for Destruction se publicó en 1987. En ese álbum ya estaban Sweet Child O’ Mine y Welcome to the Jungle: dos temas para volver a los ochenta.",
      dateLabel: "Publicación del álbum · 1987",
      scope: "Cultura internacional",
      source: "https://open.spotify.com/track/5NIPsWpDjJTFBoPxCUUeXp",
      sourceName: "Spotify · créditos del álbum",
    },
  ],
  music: [
    {
      title: "Sweet Child O' Mine",
      artist: "Guns N' Roses",
      year: 1987,
      spotifyId: "5r9AgnhkPQXeKG1w5rauDq",
      reference: "https://open.spotify.com/track/5r9AgnhkPQXeKG1w5rauDq",
    },
    {
      title: "Welcome to the Jungle",
      artist: "Guns N' Roses",
      year: 1987,
      spotifyId: "5NIPsWpDjJTFBoPxCUUeXp",
      reference: "https://open.spotify.com/track/5NIPsWpDjJTFBoPxCUUeXp",
    },
  ],
} satisfies EraContent;
