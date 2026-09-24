import type { EraContent } from "../contracts";
// Demo authors and personal stories are fictional. Keep IDs stable.
export const content = {
  introduction: {
    label: "Los noventa",
    description:
      "Videoclubes, pilas de repuesto y encuentros sin mensajes de aviso.",
  },
  memories: [
    {
      place: "Parque Centenario, Caballito, Buenos Aires",
      lat: -34.6065,
      lng: -58.4355,
      id: "demo-7",
      title: "La ronda de mate del Parque Centenario",
      year: 1997,
      category: "Personales",
      author: "Lucía",
      description:
        "Nos encontrábamos los sábados a las cinco en la entrada del Parque Centenario por la avenida Díaz Vélez, cerca del museo. Yo iba desde Almagro en una bici verde; Juli llevaba el termo y Mariano siempre aparecía con galletitas rotas en la mochila. Dábamos una vuelta al lago y elegíamos el mismo pedazo de pasto para sentarnos. Una tarde nos agarró la lluvia y volvimos pedaleando, con el mate guardado en una bolsa. Todavía tengo la foto que nos sacamos empapados en el palier.",
      source: "demo",
    },
    {
      place: "Monumento Nacional a la Bandera, Rosario",
      lat: -32.9475,
      lng: -60.6304,
      id: "demo-8",
      title: "Una cinta y las escalinatas del Monumento",
      year: 1993,
      category: "Música",
      author: "Fede",
      description:
        "Con mi amigo Martín terminamos la secundaria y nos regalamos un cassette grabado por cada uno. Nos juntamos a intercambiarlos en las escalinatas del Monumento a la Bandera, mirando hacia el Paraná. El suyo empezaba con rock nacional y tenía una lista escrita con birome azul. Escuchamos un lado entero compartiendo auriculares, mientras comíamos bizcochitos. En la etiqueta del mío puso “Rosario, diciembre del 93”. Lo conservé aunque después dejé de tener dónde escucharlo.",
      source: "demo",
    },
    {
      place: "Plaza San Martín, centro de Córdoba",
      lat: -31.4167,
      lng: -64.1835,
      id: "demo-9",
      title: "La plaza antes del primer viaje solos",
      year: 1995,
      category: "Lugares",
      author: "Sole",
      description:
        "Quedamos en la Plaza San Martín de Córdoba para organizar nuestro primer viaje a las sierras sin los grandes. Nos sentamos en un banco frente a la Catedral con un mapa de papel y una libreta para sumar los gastos. Teníamos plata para el pasaje y muy poco más. Terminamos eligiendo llevar comida desde casa y repartir las bolsas. Cada vez que vuelvo a esa plaza me acuerdo de lo importante que nos sentíamos haciendo las cuentas.",
      source: "demo",
    },
    {
      place: "Lago del Parque General San Martín, Mendoza",
      lat: -32.8951,
      lng: -68.8794,
      id: "demo-10",
      title: "Los diez años de Sofi al lado del lago",
      year: 1998,
      category: "Acontecimientos",
      author: "Diego",
      description:
        "Mi hermana cumplió diez y pidió festejar en el Parque General San Martín, cerca del lago. Fuimos temprano a Mendoza a buscar sombra; mi viejo llevó las sillas plegables y yo me encargué de inflar quince globos amarillos. Armamos una búsqueda del tesoro con pistas escritas a mano. El premio estaba en la conservadora, debajo de las gaseosas. En la foto final se ve a Sofi con la corona de cartulina y toda la boca pintada de merengue.",
      source: "demo",
    },
    {
      place: "Plaza Colón, centro de Mar del Plata",
      lat: -38.0068,
      lng: -57.5433,
      id: "demo-11",
      title: "La lista del videoclub en una servilleta",
      year: 1996,
      category: "Cine",
      author: "Julieta",
      description:
        "El departamento de vacaciones quedaba cerca de Plaza Colón, en Mar del Plata. Habíamos llevado la videocasetera porque anunciaban lluvia. El primer día nos sentamos en la plaza a escribir qué películas quería ver cada uno: mi hermano pidió Toy Story y mi papá una de aventuras. La lista quedó en una servilleta llena de arena. Al final vimos la misma cinta dos noches seguidas porque nos olvidamos de devolverla.",
      source: "demo",
    },
    {
      place: "Centro Cívico, San Carlos de Bariloche",
      lat: -41.1335,
      lng: -71.3102,
      id: "demo-12",
      title: "Una sitcom inventada en Bariloche",
      year: 1992,
      category: "Televisión",
      author: "Pablo",
      description:
        "La foto de nuestro viaje de egresados se hizo en el Centro Cívico de Bariloche, debajo de los arcos. Mientras esperábamos a los que habían ido a comprar chocolate, empezamos a repartir personajes de una comedia de televisión inventada. El profe quedó como el vecino que se quejaba del ruido y actuó tan bien que nadie podía ponerse serio. El fotógrafo tuvo que esperar. La copia que guardé tiene nuestros nombres escritos atrás.",
      source: "demo",
    },
    {
      place: "Plaza 9 de Julio, centro de Salta",
      lat: -24.7892,
      lng: -65.4103,
      id: "demo-13",
      title: "El récord de la Game Boy en Plaza 9 de Julio",
      year: 1999,
      category: "Videojuegos",
      author: "Mati",
      description:
        "Llevé mi Game Boy a la Plaza 9 de Julio de Salta una tarde de las vacaciones de invierno. Nos sentamos cerca del Cabildo, donde daba el sol, con cuatro pilas de repuesto y una libreta para los récords. Mi prima, que decía que no sabía jugar, nos ganó a todos en Tetris. Le prometimos un helado si repetía la marca y lo hizo en la partida siguiente. Todavía me lo recuerda cada vez que nos vemos.",
      source: "demo",
    },
  ],
  facts: [
    {
      id: "toystory",
      year: 1995,
      kind: "Cine",
      title: "Los juguetes cobraron vida",
      description:
        "Toy Story se estrenó en 1995 y fue el primer largometraje animado íntegramente por computadora. Woody y Buzz inauguraron una nueva etapa para Pixar y el cine de animación.",
      dateLabel: "Estreno original · 1995",
      scope: "Cultura internacional",
      source: "https://thewaltdisneycompany.com/news/toy-story-pixar-history/",
      sourceName: "The Walt Disney Company",
    },
    {
      id: "web",
      year: 1993,
      kind: "Tecnología",
      title: "La Web se abrió al mundo",
      description:
        "El 30 de abril de 1993, el CERN puso el software de la World Wide Web en el dominio público. Un paso decisivo para que cualquiera pudiera usarlo y desarrollar la Web.",
      dateLabel: "30 de abril de 1993",
      scope: "CERN · Suiza",
      source: "https://home.cern/science/computing/the-birth-of-the-web/",
      sourceName: "CERN",
    },
    {
      id: "dangerous",
      year: 1991,
      kind: "Música",
      title: "Michael Jackson lanzó Dangerous",
      description:
        "En noviembre de 1991 llegó Dangerous, el álbum que incluye Black or White. En nuestra selección de los noventa podés volver a escuchar ese tema.",
      dateLabel: "Noviembre de 1991",
      scope: "Cultura internacional",
      source: "https://www.michaeljackson.com/albums/dangerous/",
      sourceName: "Michael Jackson · sitio oficial",
    },
  ],
  music: [
    {
      title: "Black or White",
      artist: "Michael Jackson",
      year: 1991,
      spotifyId: "6bsCZtBsAvu4u2ueA7saDo",
      reference: "https://open.spotify.com/track/6bsCZtBsAvu4u2ueA7saDo",
    },
    {
      title: "De música ligera",
      artist: "Soda Stereo",
      year: 1990,
      spotifyId: "5jVvwEH4nsTrDf2pU3IW2i",
      reference: "https://open.spotify.com/track/5jVvwEH4nsTrDf2pU3IW2i",
    },
  ],
} satisfies EraContent;
