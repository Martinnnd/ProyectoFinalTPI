# Nostalgia · versión completa en Next.js

Esta es la referencia funcional completa para el equipo. Migra el prototipo TPIMockFront a Next.js App Router conservando sus componentes, datos y estética. No reemplaza ni modifica ProyectoFinalTPI: esa es la base en la que el equipo integrará las funciones.

## Iniciar

Requiere Node.js 22, npm y conexión para Mapbox, OpenStreetMap, Spotify y las fuentes web.

```powershell
cd D:\Proyectos\NostalgiaCompletoNext
npm ci
npm run dev
```

Abrir **http://localhost:3001**. El puerto 3001 permite tener la base ProyectoFinalTPI en 3000 al mismo tiempo. Ctrl+C detiene el servidor. Si las dependencias ya están instaladas, alcanza con npm run dev.

## Qué incluye

- Mapa principal Mapbox con globo, atmósfera, estrellas, selección de publicaciones y opciones de estilo, iluminación y satélite.
- Alternativa Leaflet 2D si falta el token o no hay WebGL; minimapas y mapa ampliado del feed en 2D.
- 28 publicaciones ficticias geolocalizadas, filtros por época, año y categoría; historias y fichas detalladas.
- Feed Para vos/Seguidos, me gusta, comentarios y seguimiento de autores de demostración.
- Perfil local con mapa de recuerdos propios, colección y contadores.
- Formulario para crear recuerdos por clic o teclado y guardarlos en localStorage.
- 12 datos culturales con fuentes y reproductores Spotify con música de cada década.
- 70s revista/periódico, 80s VHS/arcade, 90s Windows 95 y 2000s Messenger/Internet Explorer; reproductores visuales por época.

Es un frontend completo de demostración, no una red social con backend. No hay login, usuarios reales, sincronización ni subida de imágenes. Seguidores permanece en 0; me gusta, comentarios y seguidos duran esta sesión. Los recuerdos propios sí persisten en el navegador. Spotify controla la reproducción y puede limitarla a previews.

## Mapbox

Crear .env.local en la raíz, tomando .env.example como plantilla:

```dotenv
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=TU_TOKEN_PUBLICO
NEXT_PUBLIC_MAP_MODE=auto
```

Reemplazar TU_TOKEN_PUBLICO por el token propio que empieza con pk. La copia local preparada ya tiene el token; no se incluye en los archivos compartidos. .env.example permanece sin credenciales. No usar tokens sk. ni publicar .env.local.

En Vercel usar preset **Next.js**, comando npm run build y directorio de salida automático. Configurar NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN para Production y, si corresponde, Preview; redeploy después de cambiarla. No usar el nombre VITE_MAPBOX_ACCESS_TOKEN ni el directorio dist del prototipo. El token público es visible en el bundle por diseño; configurar los dominios permitidos en Mapbox, incluyendo localhost:3001 para pruebas.

## Para llevar las funciones a ProyectoFinalTPI

**Empezar por [README-MIGRACION-A-PROYECTOFINALTPI.md](README-MIGRACION-A-PROYECTOFINALTPI.md)**. Incluye:

- qué copiar, de dónde y a qué ruta;
- dependencias y conexiones de cada función;
- diferencias con la base vacía que pueden romper imports o props;
- trabajo por parejas y una integración gradual en una carpeta de preparación;
- activación final y comprobaciones antes de integrar a main.

La responsabilidad de cada pareja está en [docs/TRABAJO_EN_EQUIPO.md](docs/TRABAJO_EN_EQUIPO.md). La explicación técnica del cambio Vite → Next está en [docs/MIGRACION-NEXT.md](docs/MIGRACION-NEXT.md).

## Verificar

```sh
npm run check
npm test
npm run test:era -- 80s
npm run build
npm run test:e2e
npm run test:e2e:mapbox
```

check revisa TypeScript y límites entre épocas. npm test ejecuta contratos y lógica de datos/almacenamiento. test:e2e conserva los recorridos completos en modo 2D usando un servidor aislado en 3101. test:e2e:mapbox prueba el build real en 3102: antes compilar con token válido, NEXT_PUBLIC_MAP_MODE=auto y conexión. Ambas suites usan Google Chrome instalado. No ejecutar estas suites al mismo tiempo ni junto a otro next dev del mismo directorio (.next/dev tiene bloqueo). Detener el servidor de desarrollo antes de test:e2e.

La prueba de música aísla el iframe de Spotify; verifica la integración, no la reproducción de audio ni licencias del proveedor.

## Organización

```text
src/app/                    Entrada y layout de Next.js
src/components/NostalgiaClient.tsx  Límite cliente, carga sin SSR
src/App.tsx                 Estado común, navegación y conexiones
src/components/             Mapas, feed, perfil, formulario y reproductor
src/eras/contracts.ts       Contratos comunes de las épocas
src/eras/registry.ts        Registro de los cuatro módulos
src/eras/shared/            Presentación compartida de reproductor y escritorio
src/eras/{70s,80s,90s,2000s}/  Carpetas de las parejas
src/types.ts                Tipos de recuerdos y filtros
src/data.ts, eraData.ts, themes.ts   Agregadores del registro
src/storage.ts              Persistencia local
src/styles.css, themes.css, social.css  Distribución común
scripts/                    Verificación de arquitectura
tests/                      Recorridos de interfaz y Mapbox real
```

## Datos locales al cambiar de proyecto

localhost:5173, localhost:3000 y localhost:3001 son orígenes distintos: no comparten localStorage. Los recuerdos de tu navegador anterior no desaparecen, pero no se trasladan copiando archivos. Se conserva la clave nostalgia.memories.v1 y su formato. Para pasar recuerdos propios, copiar su JSON desde Application → Local Storage del origen anterior al mismo nombre en el nuevo origen y recargar. Hacerlo solo con datos propios; no usar localStorage.clear(). Los 28 ejemplos vienen con el código.
