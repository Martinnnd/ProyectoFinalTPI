import { initialMemories } from "./data";
import type { Memory } from "./types";

// Publicaciones temporales de los grupos de Perfil, hasta que lleguen del backend.
// Los tres primeros recuerdos de autos ya viven en el contenido de los 80.
export const demoGroupMemories: Memory[] = [
  ...initialMemories.filter((memory) => memory.groupId === "autos-80"),
  {
    id: "grupo-autos-80-4", groupId: "autos-80", title: "El Peugeot 504 para ir a la costa", year: 1988,
    category: "Personales", author: "Sergio", place: "Mar del Plata, Buenos Aires", lat: -38.0055, lng: -57.5426,
    description: "Salimos antes del amanecer con el Peugeot cargado de bolsos. Mi viejo revisó dos veces las cubiertas y nosotros peleábamos por el asiento junto a la ventanilla. Cuando vimos el mar, bajamos los vidrios aunque hiciera frío.",
    hashtags: ["autosclasicos", "viajesenfamilia"], source: "demo",
  },
  {
    id: "grupo-vinilos-70-1", groupId: "vinilos-70", title: "El primer vinilo que compramos entre amigos", year: 1973,
    category: "Música", author: "Marta", place: "La Plata, Buenos Aires", lat: -34.9214, lng: -57.9545,
    description: "Juntamos monedas durante semanas para llevarnos un disco de rock de la disquería del centro. Lo escuchamos en casa de Ana, sentados alrededor del tocadiscos, y dimos vuelta el lado A antes de que terminara de girar.",
    hashtags: ["vinilos", "rocknacional"], source: "demo",
  },
  {
    id: "grupo-vinilos-70-2", groupId: "vinilos-70", title: "Una tarde buscando discos usados", year: 1975,
    category: "Música", author: "Julián", place: "Parque Rivadavia, Buenos Aires", lat: -34.6172, lng: -58.4324,
    description: "Los domingos recorríamos los puestos de Parque Rivadavia buscando tapas conocidas entre cajas de cartón. Volví a casa con un simple rayado que saltaba en el estribillo, pero igual lo escuché toda la semana.",
    hashtags: ["vinilos", "disquerias"], source: "demo",
  },
  {
    id: "grupo-vinilos-70-3", groupId: "vinilos-70", title: "La púa gastada del tocadiscos", year: 1977,
    category: "Música", author: "Elena", place: "Rosario, Santa Fe", lat: -32.9468, lng: -60.6393,
    description: "Mi hermano ponía sus discos después de cenar y todos pedíamos una canción distinta. Una noche la púa empezó a saltar: fuimos a comprar otra al día siguiente para no perder nuestra pequeña reunión musical.",
    hashtags: ["vinilos", "tocadiscos"], source: "demo",
  },
  {
    id: "grupo-vinilos-70-4", groupId: "vinilos-70", title: "La tapa que reconocíamos desde la vidriera", year: 1979,
    category: "Música", author: "Raúl", place: "Córdoba, Córdoba", lat: -31.4167, lng: -64.1833,
    description: "Cada viernes pasábamos por la disquería para ver si había llegado el álbum que esperábamos. Cuando apareció, nos turnamos para llevarlo a casa y grabarlo en cassette sin perder ninguna canción.",
    hashtags: ["vinilos", "rocknacional"], source: "demo",
  },
  {
    id: "grupo-grunge-90-1", groupId: "grunge-90", title: "La cinta que grabamos de la radio", year: 1992,
    category: "Música", author: "Pablo", place: "Almagro, Buenos Aires", lat: -34.6081, lng: -58.4214,
    description: "Esperamos toda la tarde a que sonara Nirvana para grabarlo en cassette. El locutor habló justo antes del final, así que dejamos esa voz en nuestra copia y la escuchamos tantas veces que terminó siendo parte del recuerdo.",
    hashtags: ["grunge", "cassettes"], source: "demo",
  },
  {
    id: "grupo-grunge-90-2", groupId: "grunge-90", title: "Mi primera remera de Pearl Jam", year: 1994,
    category: "Música", author: "Carolina", place: "Morón, Buenos Aires", lat: -34.65, lng: -58.619,
    description: "Una amiga me prestó su disco y pasé todo el fin de semana leyendo las letras del librito. El lunes llegué al colegio con una remera de la banda y terminamos intercambiando música durante el recreo.",
    hashtags: ["grunge", "pearljam"], source: "demo",
  },
  {
    id: "grupo-grunge-90-3", groupId: "grunge-90", title: "El ensayo en el garaje", year: 1996,
    category: "Música", author: "Damián", place: "Quilmes, Buenos Aires", lat: -34.7206, lng: -58.2545,
    description: "Con tres acordes y una batería prestada intentábamos tocar las canciones que oíamos en cassette. Los vecinos se asomaban al garaje para pedir que bajáramos el volumen; nosotros prometíamos hacerlo en el siguiente tema.",
    hashtags: ["grunge", "bandas"], source: "demo",
  },
  {
    id: "grupo-grunge-90-4", groupId: "grunge-90", title: "Intercambio de discos en la plaza", year: 1998,
    category: "Música", author: "Lucía", place: "Plaza San Martín, La Plata", lat: -34.9135, lng: -57.9486,
    description: "Llevé un CD de Soundgarden a la plaza y volví con otro que no conocía. Éramos cuatro amigos recomendándonos bandas, escribiendo nombres en papeles y decidiendo qué escucharíamos el sábado siguiente.",
    hashtags: ["grunge", "soundgarden"], source: "demo",
  },
  {
    id: "grupo-cine-2000-1", groupId: "cine-2000", title: "La fila para la primera película de la saga", year: 2001,
    category: "Cine", author: "Florencia", place: "Abasto, Buenos Aires", lat: -34.6028, lng: -58.4102,
    description: "Llegamos temprano al cine con entradas compradas días antes. En la fila todos hablaban del libro y discutían qué escenas aparecerían. Salimos de noche repitiendo nuestros diálogos favoritos.",
    hashtags: ["cine", "sagas"], source: "demo",
  },
  {
    id: "grupo-cine-2000-2", groupId: "cine-2000", title: "El DVD que pasaba de casa en casa", year: 2003,
    category: "Cine", author: "Matías", place: "Caballito, Buenos Aires", lat: -34.618, lng: -58.442,
    description: "Un amigo compró la película en DVD y organizamos turnos para prestárnosla. Veíamos las escenas eliminadas y después comentábamos cada detalle en el colegio, tratando de no contarle el final a quien faltaba verla.",
    hashtags: ["cine", "dvd"], source: "demo",
  },
  {
    id: "grupo-cine-2000-3", groupId: "cine-2000", title: "Funciones de sábado con pochoclos", year: 2006,
    category: "Cine", author: "Agustina", place: "Rosario, Santa Fe", lat: -32.9472, lng: -60.6398,
    description: "Nos encontrábamos frente al cine del centro y elegíamos la función mirando la cartelera. Si llegábamos tarde, comprábamos pochoclos a las apuradas y buscábamos asientos juntos con la sala casi a oscuras.",
    hashtags: ["cine", "salidas"], source: "demo",
  },
  {
    id: "grupo-cine-2000-4", groupId: "cine-2000", title: "Maratón de películas en casa", year: 2009,
    category: "Cine", author: "Nicolás", place: "Mendoza, Mendoza", lat: -32.8895, lng: -68.8458,
    description: "Alquilamos tres películas para verlas de corrido un viernes. Nos quedamos sin gaseosa antes de la segunda, pero nadie quiso pausar. A la mañana siguiente seguíamos discutiendo cuál había sido la mejor.",
    hashtags: ["cine", "dvd"], source: "demo",
  },
];
