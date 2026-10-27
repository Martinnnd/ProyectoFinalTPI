import type { EraContent } from "../contracts";

export const content = {
  introduction: { label: "2010s · DIARIO DE BOLSILLO", description: "Fotos cuadradas, canciones compartidas y lugares que quedaron en el carrete." },
  memories: [
    { id: "demo-2012-plaza", title: "Una foto antes de volver a casa", year: 2012, category: "Personales", author: "Lara", place: "Plaza San Martín, Buenos Aires", lat: -34.5958, lng: -58.3756, description: "Nos quedamos charlando hasta que encendieron las luces de la plaza. Saqué una foto con el celular: salió movida, con un filtro demasiado cálido y todos riéndonos. La guardé igual y la subí cuando llegué a casa, después de discutir cuál de todos salía mejor. Al final elegimos esa porque nadie estaba posando. Cada vez que la encuentro en el carrete, me acuerdo del frío que hacía y de lo poco que queríamos que terminara esa tarde.", source: "demo" },
    { id: "demo-2014-costanera", title: "La canción del viaje", year: 2014, category: "Música", author: "Nico", place: "Costanera, Rosario", lat: -32.9282, lng: -60.656, description: "Viajamos con un solo par de auriculares y una lista de canciones que habíamos preparado la noche anterior. Nos turnábamos para elegir tema mientras caminábamos al lado del río. En un momento paramos a sacar una foto del agua, pero nos quedamos escuchando el estribillo hasta el final. Después anotamos el nombre de la canción para no perderla. Todavía hoy, apenas empieza, vuelvo a ese paseo y a la conversación que dejamos a medias.", source: "demo" },
    { id: "demo-2017-mendoza", title: "Nuestro álbum improvisado", year: 2017, category: "Lugares", author: "Mica", place: "Parque General San Martín, Mendoza", lat: -32.8948, lng: -68.8785, description: "Fuimos al parque con la intención de sacar una sola foto y terminamos con un álbum entero. Probamos retratos junto al lago, una toma desde el pasto y hasta una panorámica en la que alguien quedó cortado. La mejor es la última: nadie mira a cámara, pero se nota que estábamos felices. La mandamos al grupo antes de subir al colectivo y durante semanas fue la imagen de la conversación. A veces un recuerdo se guarda así, sin planearlo.", source: "demo" },
  ],
  facts: [
    { id: "iphone-4s-2011", year: 2011, kind: "Tecnología", title: "Las historias caben en un bolsillo", description: "En 2011 llegó el iPhone 4S. Las fotos y la música empezaban a acompañarnos a cada lugar con más naturalidad.", dateLabel: "2011", scope: "Tecnología", source: "https://www.apple.com/newsroom/2011/10/17iPhone-4S-First-Weekend-Sales-Top-Four-Million/", sourceName: "Apple Newsroom" },
    { id: "iphone-5-2012", year: 2012, kind: "Tecnología", title: "Una pantalla para llevar recuerdos", description: "Apple presentó el iPhone 5 en 2012 con una pantalla de cuatro pulgadas. El teléfono se volvía cada vez más importante para mirar y compartir imágenes.", dateLabel: "2012", scope: "Tecnología", source: "https://www.apple.com/newsroom/2012/09/12Apple-Introduces-iPhone-5/", sourceName: "Apple Newsroom" },
  ],
  music: [
    { title: "Foto de verano", artist: "Nostalgiar · original", year: 2012, spotifyId: "nostalgiar-2012-photo", audioSrc: "/music/2010s/foto-de-verano.wav", reference: "/music/2010s/foto-de-verano.wav" },
    { title: "Notas en el bolsillo", artist: "Nostalgiar · original", year: 2013, spotifyId: "nostalgiar-2013-notes", audioSrc: "/music/2010s/notas-en-el-bolsillo.wav", reference: "/music/2010s/notas-en-el-bolsillo.wav" },
    { title: "La última foto", artist: "Nostalgiar · original", year: 2015, spotifyId: "nostalgiar-2015-last", audioSrc: "/music/2010s/la-ultima-foto.wav", reference: "/music/2010s/la-ultima-foto.wav" },
  ],
} satisfies EraContent;
