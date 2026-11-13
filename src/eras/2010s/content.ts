import type { EraContent } from "../contracts";

export const content = {
  introduction: {
    label: "2010s · DIARIO DE BOLSILLO",
    description: "Fotos cuadradas, canciones compartidas y lugares que quedaron en el carrete.",
  },
  memories: [
    {
      id: "demo-2012-plaza",
      title: "Una foto antes de volver a casa",
      year: 2012,
      category: "Personales",
      author: "Lara",
      place: "Plaza San Martín, Buenos Aires",
      lat: -34.5958,
      lng: -58.3756,
      description:
        "Nos quedamos charlando hasta que encendieron las luces de la plaza. Saqué una foto con el celular: salió movida, con un filtro demasiado cálido y todos riéndonos. La guardé igual y la subí cuando llegué a casa, después de discutir cuál de todos salía mejor. Al final elegimos esa porque nadie estaba posando. Cada vez que la encuentro en el carrete, me acuerdo del frío que hacía y de lo poco que queríamos que terminara esa tarde.",
      source: "demo",
    },
    {
      id: "demo-2014-costanera",
      title: "La canción del viaje",
      year: 2014,
      category: "Música",
      author: "Nico",
      place: "Costanera, Rosario",
      lat: -32.9282,
      lng: -60.656,
      description:
        "Viajamos con un solo par de auriculares y una lista de canciones que habíamos preparado la noche anterior. Nos turnábamos para elegir tema mientras caminábamos al lado del río. En un momento paramos a sacar una foto del agua, pero nos quedamos escuchando el estribillo hasta el final. Después anotamos el nombre de la canción para no perderla. Todavía hoy, apenas empieza, vuelvo a ese paseo y a la conversación que dejamos a medias.",
      source: "demo",
    },
    {
      id: "demo-2017-mendoza",
      title: "Nuestro álbum improvisado",
      year: 2017,
      category: "Lugares",
      author: "Mica",
      place: "Parque General San Martín, Mendoza",
      lat: -32.8948,
      lng: -68.8785,
      description:
        "Fuimos al parque con la intención de sacar una sola foto y terminamos con un álbum entero. Probamos retratos junto al lago, una toma desde el pasto y hasta una panorámica en la que alguien quedó cortado. La mejor es la última: nadie mira a cámara, pero se nota que estábamos felices. La mandamos al grupo antes de subir al colectivo y durante semanas fue la imagen de la conversación. A veces un recuerdo se guarda así, sin planearlo.",
      source: "demo",
    },
  ],
  facts: [
    {
      id: "iphone-4s-2011",
      year: 2011,
      kind: "Tecnología",
      title: "Las historias caben en un bolsillo",
      description:
        "Apple presentó el iPhone 4S junto con iCloud en 2011. Su cámara de 8 megapíxeles y Photo Stream hicieron más fácil sacar una foto y encontrarla después en otros dispositivos. El teléfono empezó a acompañar cada salida, viaje y encuentro como una pequeña cámara y un álbum siempre a mano.",
      dateLabel: "4 de octubre de 2011",
      scope: "Tecnología",
      source: "https://www.apple.com/newsroom/2011/10/04Apple-Launches-iPhone-4S-iOS-5-iCloud/",
      sourceName: "Apple Newsroom",
      media: {
        url: "/facts/iphone4s.jpg",
        caption: "iPhone 4S · Scott Swigart · CC BY 2.0",
        source: "https://commons.wikimedia.org/wiki/File:Apple_iPhone_4S_(6767371111).jpg",
      },
    },
    {
      id: "pokemon-go-2016",
      year: 2016,
      kind: "Acontecimientos",
      title: "La ciudad se volvió un juego",
      description:
        "Pokémon GO llegó a los teléfonos en julio de 2016 y convirtió plazas, calles y monumentos en paradas de una aventura compartida. Salir a caminar también era buscar criaturas, encontrarse con otros jugadores y descubrir rincones que antes pasaban inadvertidos.",
      dateLabel: "6 de julio de 2016",
      scope: "Mundo",
      source: "https://press.pokemon.com/es-MX/Pokemon-GO/Focus/Leyendas-Pokemon-Z-A---Logo",
      sourceName: "The Pokémon Company",
      media: {
        url: "/facts/pokemon.jpg",
        caption: "Jugadores de Pokémon GO en Ciudad de México · ProtoplasmaKid · CC BY 4.0",
        source:
          "https://commons.wikimedia.org/wiki/File:Pokemon_GO_players_in_M%C3%A9xico_City.jpg",
      },
    },
    {
      id: "despacito-2017",
      year: 2017,
      kind: "Música",
      title: "Una canción dio la vuelta al mundo",
      description:
        "En 2017, «Despacito», de Luis Fonsi y Daddy Yankee, sonó en fiestas, radios y teléfonos de todo el mundo. Su video se convirtió en un fenómeno de YouTube: una muestra de cómo una canción podía viajar de pantalla en pantalla y quedar asociada a los recuerdos de un verano entero.",
      dateLabel: "2017",
      scope: "Música",
      source: "https://blog.youtube/culture-and-trends/its-time-for-youtuberewind-celebrating/",
      sourceName: "YouTube Blog",
      media: {
        url: "/facts/fonsi.jpg",
        caption: "Luis Fonsi en concierto · anokarina · CC BY-SA 2.0",
        source: "https://commons.wikimedia.org/wiki/File:Luis_Fonsi_in_concert.jpg",
      },
    },
  ],
  music: [
    {
      title: "Somebody That I Used to Know",
      artist: "Gotye feat. Kimbra",
      year: 2011,
      spotifyId: "nostalgiar-2011-gotye",
      audioSrc: "/music/2010s/Gotye%20-%20Somebody%20That%20I%20Used%20To%20Know%20(feat.mp3",
      reference: "/music/2010s/Gotye%20-%20Somebody%20That%20I%20Used%20To%20Know%20(feat.mp3",
    },
    {
      title: "Wake Me Up",
      artist: "Avicii",
      year: 2013,
      spotifyId: "nostalgiar-2013-avicii",
      audioSrc: "/music/2010s/Avicii%20-%20Wake%20Me%20Up%20(Official%20Lyric%20Video).mp3",
      reference: "/music/2010s/Avicii%20-%20Wake%20Me%20Up%20(Official%20Lyric%20Video).mp3",
    },
    {
      title: "Despacito",
      artist: "Luis Fonsi feat. Daddy Yankee",
      year: 2017,
      spotifyId: "nostalgiar-2017-despacito",
      audioSrc: "/music/2010s/Luis%20Fonsi%20-%20Despacito%20(Letra%20_%20Lyrics)%20ft.mp3",
      reference: "/music/2010s/Luis%20Fonsi%20-%20Despacito%20(Letra%20_%20Lyrics)%20ft.mp3",
    },
  ],
} satisfies EraContent;
