import type { EraContent } from "../contracts";
// Demo authors and personal stories are fictional. Keep IDs stable.
export const content = {
  introduction: {
    label: "Los dos mil",
    description:
      "Fotos digitales, zumbidos y canciones que entraban en el bolsillo.",
  },
  memories: [
{
    "id": "cine-2000-1",
    "groupId": "cine-2000",
    "title": "La fila para ver El retorno del rey",
    "year": 2004,
    "author": "Pablo",
    "place": "Abasto, Buenos Aires",
    "lat": -34.6035,
    "lng": -58.4108,
    "description": "Fuimos con mis amigos a ver El retorno del rey y llegamos mucho antes para conseguir lugar juntos. En la fila discutimos nuestras escenas favoritas de las películas anteriores, cuidando de no contar nada a quienes no las habían visto. Salimos hablando todos a la vez y terminamos comiendo una pizza mientras repasábamos el final. Guardé la entrada dentro de un libro; todavía tiene una mancha del vaso de gaseosa.",
    "category": "Cine",
    "source": "demo"
},
{
    "id": "cine-2000-2",
    "groupId": "cine-2000",
    "title": "Harry Potter y una salida después del colegio",
    "year": 2005,
    "author": "Carla",
    "place": "Cine de San Justo, Buenos Aires",
    "lat": -34.682,
    "lng": -58.557,
    "description": "Habíamos organizado toda la semana la salida para ver Harry Potter y el cáliz de fuego. Uno compró las entradas, otro juntó la plata y yo llevé una cámara digital para la foto antes de entrar. Compartimos un balde de pochoclos que se terminó demasiado rápido. A la salida discutimos las diferencias con el libro hasta perder el colectivo. La película era la excusa perfecta para estar juntos un rato más.",
    "category": "Cine",
    "source": "demo"
},
{
    "id": "cine-2000-3",
    "groupId": "cine-2000",
    "title": "Shrek en DVD y el sillón lleno",
    "year": 2002,
    "author": "Luciano",
    "place": "Villa Luzuriaga, La Matanza, Buenos Aires",
    "lat": -34.657,
    "lng": -58.584,
    "description": "Alquilamos Shrek en DVD para una noche de películas en casa. Éramos tantos que hubo que traer sillas de la cocina y dejar a dos en el piso. Antes de empezar nos entretuvimos recorriendo los menús, algo que todavía nos parecía una novedad. Terminamos repitiendo los chistes durante semanas y prometiendo otra función para el sábado siguiente. Me acuerdo más de las risas del living que de cualquier otra cosa de esa noche.",
    "category": "Cine",
    "source": "demo"
},
    {
      place: "Parque Centenario, Caballito, Buenos Aires",
      lat: -34.6065,
      lng: -58.4355,
      id: "demo-14",
      title: "La foto del Fotolog, junto al lago",
      year: 2007,
      category: "Personales",
      author: "Cami",
      image: "https://quehacerenba.com/wp-content/uploads/2023/07/img_0845.jpg",
      description:
        "Nos juntamos en el Parque Centenario después de rendir la última materia. Llevé una cámara digital plateada que usaba dos pilas y una tarjeta donde casi no quedaba espacio. Elegimos el lago de fondo y sacamos la misma foto ocho veces: siempre alguien cerraba los ojos. Esa noche subí una al Fotolog con un marco negro y un texto larguísimo. Mi mejor amiga comentó antes de que terminara de avisarle por Messenger.",
      source: "demo",
    },
    {
      place: "Bajada Gral. Paz Crovara",
      lat: -34.673563442734945, 
      lng: -58.5034528673788,
      id: "demo-33",
      title: "Chicago campeón B Nacional",
      year: 2001,
      category: "Acontecimientos",
      author: "Sergio",
      image: "https://www.soloascenso.com.ar/Noticias/nchicago2001inedito.jpg",
      description:
        "No me olvido mas de ese dia, nos juntamos todos a la altura de Liniers a esperar al micro con los jugadores que volvian de Cordoba, en el renault 12 que se ve estabamos mis hermanos y yo, estuvimos festejando en la cancha por horas, ya volveran esos tiempos chicago querido",
      source: "demo",
    },
    {
      place: "Monumento Nacional a la Bandera, Rosario",
      lat: -32.9475,
      lng: -60.6304,
      id: "demo-15",
      title: "Un auricular cada uno frente al Paraná",
      year: 2005,
      category: "Música",
      author: "Agus",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3GEJYv0JMgPY0DBqGcrZxIh-xW6JtHZ4uIuUi3L9U-BgzePheBjJleVlQ&s=10",
      description:
        "Después de mi primera entrevista de trabajo fui con mi novia al Monumento a la Bandera. Nos sentamos en la parte baja de las escalinatas, mirando el Paraná. En mi MP3 de 128 MB entraban pocas canciones, así que las conocíamos de memoria. Compartimos los auriculares y una gaseosa tibia mientras le contaba todas las cosas que creía haber contestado mal. A la semana me llamaron. Para festejar volvimos al mismo lugar.",
      source: "demo",
    },
    {
      place: "Plaza San Martín, centro de Córdoba",
      lat: -31.4167,
      lng: -64.1835,
      id: "demo-16",
      title: "Nos encontramos antes de conectarnos",
      year: 2004,
      category: "Lugares",
      author: "Flor",
      image: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Plaza_San_Mart%C3%ADn_C%C3%B3rdoba_2011-03-06.jpg?utm_source=es.wikipedia.org&utm_campaign=index&utm_content=original",
      description:
        "Mis amigas y yo quedamos en la Plaza San Martín de Córdoba para intercambiar las fotos de una salida del colegio. Llevé las copias impresas en un sobre de laboratorio; algunas tenían los dedos tapando el lente. Nos repartimos las mejores junto a la Catedral y prometimos escanear las otras. Esa noche la conversación siguió por Messenger: cada una se puso una foto distinta y nos mandamos zumbidos hasta que nos mandaron a dormir.",
      source: "demo",
    },
    {
      place: "Lago del Parque General San Martín, Mendoza",
      lat: -32.8951,
      lng: -68.8794,
      id: "demo-17",
      title: "El reencuentro del curso en el parque",
      year: 2009,
      category: "Acontecimientos",
      author: "Juan",
      image: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWn9bl_UQY-Raa2UYVIC1xJkykrqXqxRFmmr6O7yfKzjQL6Y3wg_mC7pMyTvNmpkFIgSodBffPei509n5RnigPMdE5ZFyBYV3jU61DpgjFjmhhNXx-ZHHiaM07dOiNNrITwFL-U=s1360-w1360-h1020-rw",
      description:
        "Armamos un grupo para reencontrarnos cinco años después de terminar el colegio. Elegimos el lago del Parque General San Martín, en Mendoza, porque todos sabíamos llegar. Cada uno llevó algo para el picnic; yo aparecí con el álbum de la fiesta de egresados. Nos pasamos las fotos de mano en mano y repetimos una, en el mismo orden en que estábamos en el colegio. Esta vez entramos todos en el encuadre.",
      source: "demo",
    },
    {
      place: "Plaza Colón, centro de Mar del Plata",
      lat: -38.0068,
      lng: -57.5433,
      id: "demo-18",
      title: "El día que cambiamos playa por Shrek",
      year: 2002,
      category: "Cine",
      author: "Vero",
      image: "https://pbs.twimg.com/media/Fkg5KUrWYAA8pcZ?format=jpg&name=medium",  
      description:
        "Salimos del departamento con la sombrilla y llegamos hasta Plaza Colón, en Mar del Plata, antes de que empezara a llover. Nos refugiamos con mis primos y decidimos volver a buscar una película para la tarde. Terminamos viendo Shrek, que habíamos conseguido en video, sentados en colchones en el living. Afuera seguía lloviendo; adentro repartíamos pochoclos en tazas porque no había suficientes bowls. Fue el día de vacaciones que más recordamos.",
      source: "demo",
    },
    {
      place: "Centro Cívico, San Carlos de Bariloche",
      lat: -41.1335,
      lng: -71.3102,
      id: "demo-19",
      title: "Una portada de serie en el Centro Cívico",
      year: 2006,
      category: "Televisión",
      author: "Nacho",
      description:
        "Viajamos a Bariloche con mis hermanos y nos pasamos el trayecto inventando teorías sobre Lost. En el Centro Cívico quisimos sacar una foto como si fuera la portada de nuestra propia serie: caras serias, brazos cruzados y las montañas de fondo. Mi mamá nos cortó los pies en la primera toma. En la segunda se metió papá saludando. Terminamos imprimiendo esa y poniéndole un título con marcador.",
      source: "demo",
    },
    {
      place: "Plaza 9 de Julio, centro de Salta",
      lat: -24.7892,
      lng: -65.4103,
      id: "demo-20",
      title: "Una consola, cuatro turnos y un helado",
      year: 2008,
      category: "Videojuegos",
      author: "Luli",
      description:
        "Mi hermano estrenó una consola portátil durante las vacaciones en Salta. A la tarde la llevamos a la Plaza 9 de Julio y buscamos un banco frente al Cabildo. Éramos cuatro, así que el que perdía entregaba la consola y elegía quién seguía. La batería se terminó justo cuando estaba por pasar un nivel. Guardamos todo, fuimos a buscar helado y al volver al hotel lo primero que hicimos fue enchufar el cargador.",
      source: "demo",
    },
  ],
  facts: [
    {
      id: "shrek",
      media: {"url": "/facts/shrek.jpg", "caption": "Shrek · imagen promocional", "source": "https://www.dreamworks.com/movies/shrek/"},
      year: 2001,
      kind: "Cine",
      title: "Un ogro se robó la película",
      description:
        "Shrek llegó al cine en 2001. DreamWorks convirtió a un ogro y a un burro parlanchín en los protagonistas de una aventura que se ríe de los cuentos de hadas.",
      dateLabel: "Estreno original · 2001",
      scope: "Cultura internacional",
      source: "https://prod.dreamworks.com/movies/shrek",
      sourceName: "DreamWorks",
    },
    {
      id: "athens",
      media: {"url": "/facts/athens.jpg", "caption": "Manu Ginóbili con la selección argentina · FIBA", "source": "https://www.fiba.basketball/en/news/remembering-ginobilis-top-10-argentina-games-ahead-of-hall-of-fame-enshrinement"},
      year: 2004,
      kind: "Deportes",
      title: "Una generación bañada en oro",
      description:
        "La selección argentina de básquet ganó el oro olímpico en Atenas 2004. En la final venció a Italia por 84 a 69: una de las grandes conquistas de la Generación Dorada.",
      dateLabel: "Juegos Olímpicos · 2004",
      scope: "Atenas · Grecia",
      source:
        "https://www.fiba.basketball/en/news/remembering-ginobilis-top-10-argentina-games-ahead-of-hall-of-fame-enshrinement",
      sourceName: "FIBA",
    },
    {
      id: "hybrid",
      media: {"url": "/facts/hybrid.jpg", "caption": "Portada del álbum · Spotify · créditos del álbum", "source": "https://open.spotify.com/track/60a0Rd6pjrkxjPbaKzXjfq"},
      year: 2000,
      kind: "Música",
      title: "El comienzo de Linkin Park",
      description:
        "Hybrid Theory se publicó el 24 de octubre de 2000. In the End forma parte de ese disco: guitarras, rap y un piano que se reconoce desde el comienzo.",
      dateLabel: "24 de octubre de 2000",
      scope: "Cultura internacional",
      source: "https://open.spotify.com/track/60a0Rd6pjrkxjPbaKzXjfq",
      sourceName: "Spotify · créditos del álbum",
    },
  ],
  music: [
  {
    "title": "In the End",
    "artist": "Linkin Park",
    "year": 2000,
    "spotifyId": "60a0Rd6pjrkxjPbaKzXjfq",
    "reference": "https://open.spotify.com/track/60a0Rd6pjrkxjPbaKzXjfq"
  },
  {
    "title": "Clocks",
    "artist": "Coldplay",
    "year": 2002,
    "spotifyId": "0BCPKOYdS2jbQ8iyB56Zns",
    "reference": "https://open.spotify.com/track/0BCPKOYdS2jbQ8iyB56Zns"
  },
  {
    "title": "Mr. Brightside",
    "artist": "The Killers",
    "year": 2004,
    "spotifyId": "003vvx7Niy0yvhvHt4a68B",
    "reference": "https://open.spotify.com/track/003vvx7Niy0yvhvHt4a68B"
  },
  {
    "title": "Hips Don't Lie",
    "artist": "Shakira · Wyclef Jean",
    "year": 2006,
    "spotifyId": "3ZFTkvIE7kyPt6Nu3PEa7V",
    "reference": "https://open.spotify.com/track/3ZFTkvIE7kyPt6Nu3PEa7V"
  },
  {
    "title": "Viva La Vida",
    "artist": "Coldplay",
    "year": 2008,
    "spotifyId": "1mea3bSkSGXuIRvnydlB5b",
    "reference": "https://open.spotify.com/track/1mea3bSkSGXuIRvnydlB5b"
  }
],
} satisfies EraContent;
