# Cómo completar ProyectoFinalTPI usando esta referencia

## 1. Qué proyecto cumple cada función

| Proyecto              | Función                                         | Modificar ahora                                     |
| --------------------- | ----------------------------------------------- | --------------------------------------------------- |
| TPIMockFront          | Prototipo original en Vite/React                | No: conservarlo como respaldo                       |
| NostalgiaCompletoNext | Esta referencia completa, ya adaptada a Next.js | Consultar, ejecutar y usar sus archivos como origen |
| ProyectoFinalTPI      | Base Next.js vacía del equipo                   | Integrar aquí, en ramas y con revisión              |

Las rutas de origen de esta guía son relativas a la raíz de **NostalgiaCompletoNext**. Las rutas de destino son relativas a **ProyectoFinalTPI**. Ejemplo: origen src/components/Profile.tsx significa D:\Proyectos\NostalgiaCompletoNext\src\components\Profile.tsx.

No copiar desde TPIMockFront: todavía usa Vite y VITE_MAPBOX_ACCESS_TOKEN. No copiar node_modules, .next, .git, .env.local, test-results ni archivos de caché. Cada integrante necesita los archivos fuente completos y ejecuta npm ci localmente. Compartir el repositorio o un ZIP del código sin esos directorios; cada persona configura su token local.

## 2. Diferencias que hay que resolver primero

La base vacía y la versión completa **no tienen contratos intercambiables**:

| Base ProyectoFinalTPI            | Referencia completa                                              | Qué hacer al activar                                                   |
| -------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| src/components/MapExperience.tsx | src/App.tsx + src/components/NostalgiaClient.tsx                 | Sustituir la composición de la pantalla                                |
| src/features/map/MemoryMap.tsx   | src/components/MemoryMap.tsx + MainMap.tsx + MapboxMap.tsx       | Usar los mapas de la referencia, con sus props                         |
| src/features/music/Player.tsx    | src/components/Player.tsx                                        | Usar el reproductor común conectado al registro completo               |
| src/types/index.ts               | src/types.ts                                                     | Mantener solo el archivo de tipos de la referencia en el código activo |
| src/app/globals.css              | src/styles.css + themes.css + social.css + components/mapbox.css | Reemplazar imports del layout; no sumar ambos diseños                  |
| ChromeProps con decade           | ChromeProps con period, count, panelOpen, musicOpen, onNavigate  | Migrar contracts.ts y los cuatro Chrome juntos                         |
| EraContent solo con music        | memories, facts, music, introduction                             | Migrar contenido y contratos conjuntamente                             |
| EraModule sin icons              | EraModule con icons                                              | Migrar theme.ts/index.ts de cada época y el registro                   |

No pegar un Chrome nuevo sobre el contrato viejo. No importar el App completo hasta que están sus dependencias. Los ejemplos de ruta que siguen usan la estructura completa; no repartir archivos entre features y components arbitrariamente.

## 3. Preparación del coordinador

1. Guardar y commitear el estado de la base vacía. Crear una rama integracion/nostalgia-completa.
2. Copiar package.json y package-lock.json de esta referencia a la raíz del destino, juntos. Cambiar name si el equipo lo desea. Esto conserva Next/React y agrega Mapbox y herramientas de prueba con versiones reproducibles.
3. Copiar tsconfig.json, next.config.ts, next-env.d.ts, vitest.config.ts, playwright.config.ts, playwright.mapbox.config.ts, .gitignore y .env.example a la raíz. Revisar diferencias si el equipo ya personalizó alguno. Ejecutar npm ci.
4. Mantener .env.local privado; agregar NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN con token propio y NEXT_PUBLIC_MAP_MODE=auto. Nunca copiar un valor real a .env.example.
5. Reservar contratos, registro, App, layout y CSS comunes al coordinador; las parejas editan sus propias carpetas.

Los scripts de la referencia usan 3001 para desarrollo y 3101/3102 para pruebas. El destino puede conservar 3000 cambiando los scripts dev y start; no hace falta tocar los puertos de pruebas. Si se usan ambos proyectos a la vez, no asignarles el mismo puerto.

## 4. Integración por etapas sin romper la base

La opción recomendada para aprender y revisar por función es preparar los archivos **fuera del src activo**. Crear una carpeta integracion en la raíz del destino. El tsconfig y .gitignore de la referencia permiten guardar allí código de preparación: TypeScript lo excluye, Git sí lo puede revisar.

Cada fila de las secciones 5 y 6 indica el destino final. Durante la preparación, anteponer integracion/ a ese destino. Ejemplo:

```text
Origen:              src/components/SocialFeed.tsx
Destino provisional: integracion/src/components/SocialFeed.tsx
Destino final:       src/components/SocialFeed.tsx
```

Así cada pareja puede subir su aporte en una PR sin que Next intente ejecutar imports incompletos. **Los archivos en integracion todavía no cambian la web.** Se prueban en la referencia completa o en la rama de integración cuando están reunidas las dependencias. No presentarlos como funciones ya activadas.

Orden de preparación:

1. Coordinador: tipos, contratos, registro y agregadores (sección 5, núcleo).
2. Cada pareja: su carpeta entera de época (sección 6). Coordinador: eras/shared.
3. Integradores: componentes por función según la tabla de dependencias de abajo.
4. Coordinador: CSS compartidos, App y entradas de Next.
5. Reunir todos los archivos, activar como explica la sección 7 y ejecutar los checks. La rama main recibe una versión completa que compila.

Si el equipo solo quiere traer todo junto, copiar src completo al src de preparación y pasar a la sección 7. Esto es una instalación completa, no la integración gradual de cada función.

## 5. Dónde pegar cada función y qué conecta

En la columna archivos, cada ruta se copia **a la misma ruta** del destino (con integracion/ delante mientras se prepara). Copiar los archivos listados completos, no solo el JSX. Las importaciones relativas se conservan.

| Función               | Archivos origen → misma ruta destino                                                         | Dependencias y conexión                                                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Núcleo de datos       | src/types.ts, src/storage.ts, src/data.ts, src/eraData.ts, src/themes.ts                     | tipos define Memory/Period/Decade, categorías y filterMemories; storage valida y persiste. Los agregadores necesitan el registro y las cuatro épocas                                           |
| Contratos y registro  | src/eras/contracts.ts, src/eras/registry.ts, src/eras/shared/ completo                       | contracts define props; registry integra módulos. shared incluye DesktopChrome, PlayerFrame y verifyEra para pruebas                                                                           |
| Selector temporal     | src/components/Timeline.tsx                                                                  | period y onChange vienen de App; usa availableDecades del registro                                                                                                                             |
| Mapa 2D               | src/components/MemoryMap.tsx                                                                 | leaflet/react-leaflet; recibe memories, selected, onSelect, picking, onPick, draft, onCancel. Exporta Point, usado por formulario y App                                                        |
| Globo principal       | src/components/MainMap.tsx, src/components/MapboxMap.tsx, src/components/mapbox.css          | MainMap decide Mapbox/Leaflet; Mapbox usa mapbox-gl, token NEXT_PUBLIC y las mismas props. App usa ActiveMap solo en vista map                                                                 |
| Historias y ficha     | src/components/SidePanel.tsx                                                                 | recibe lista filtrada y seleccionado; exporta MemoryArtwork para postales. Se abre con panelOpen en App                                                                                        |
| Crear recuerdo        | src/components/MemoryForm.tsx                                                                | necesita Point de MemoryMap, Memory/Decade de types, callbacks onSave/onCancel. App controla picking/draft y llama saveMemories antes de incorporar el recuerdo                                |
| Feed y detalle social | src/components/SocialFeed.tsx                                                                | memories, selected, following, onFollow, onSelect, onMap y onAdd. Likes y comentarios viven dentro del componente; following vive en App                                                       |
| Perfil propio         | src/components/Profile.tsx                                                                   | MemoryMap y tipos. Recibe ownMemories filtrados, allMemories locales, following, period y callbacks. No pasar los ejemplos como allMemories: el perfil debe mostrar solo publicaciones propias |
| Mapa ampliado         | src/components/MapModal.tsx                                                                  | dialog nativo y MemoryMap; App conserva mapExpanded y la referencia del botón para devolver el foco al cerrar                                                                                  |
| Datos culturales      | src/components/EraFacts.tsx                                                                  | factsForPeriod de eraData, eraThemes, period y onClose. Se reinicia con key por década/año                                                                                                     |
| Música                | src/components/Player.tsx                                                                    | mantiene índice y error; usa eraRegistry[decade].Player y .content.music. El key por decade en App desmonta el iframe al cambiar época                                                         |
| Marco por época       | src/components/EraChrome.tsx                                                                 | adaptador del registro; delega en Chrome e icons de cada carpeta                                                                                                                               |
| Composición y menú    | src/App.tsx                                                                                  | integra todas las funciones anteriores; no copiar antes de reunirlas. Contiene estados, filtrado, botones, overlays, creación y persistencia                                                   |
| Entrada cliente       | src/components/NostalgiaClient.tsx                                                           | carga App con next/dynamic y ssr:false; no importar Leaflet desde un Server Component                                                                                                          |
| Ruta y estilos        | src/app/page.tsx, src/app/layout.tsx, src/styles.css, src/themes.css, src/social.css         | page monta NostalgiaClient; layout importa CSS de Leaflet, comunes y épocas en el orden de la referencia                                                                                       |
| Validación            | scripts/check-architecture.mjs, tests/ completo, src/core.test.ts, src/eras/registry.test.ts | requiere las herramientas de package.json; las pruebas por época van dentro de cada carpeta                                                                                                    |

Si la referencia tiene public/, copiar sus archivos a public/ manteniendo rutas. Esta versión no necesita fotos externas de usuario para funcionar; usa postales de demostración.

### Conexiones en App que no conviene reescribir al pegar

- view selecciona map/feed/profile. navigate abre mapa, historias, datos o música.
- period y category filtran initialMemories + local. ownMemories se calcula **solo** desde local.
- select guarda selectedId y abre el panel adecuado; closeStories limpia selección y devuelve foco.
- startAdding guarda si se inició desde perfil, cambia al mapa y activa picking. onPick fija draft y abre MemoryForm.
- save intenta guardar primero; si falla devuelve el mensaje al formulario. Si funciona actualiza local, período, categoría y selección. Desde perfil vuelve al perfil.
- mapExpanded activa MapModal desde el minimapa del feed; cerrar recupera el foco.
- following se comparte entre feed y perfil. Likes/comentarios se mantienen en SocialFeed durante esta sesión.
- Player usa key={period.decade}; EraFacts usa key por década/año para reiniciar datos al viajar.

Para integrar manualmente solo una función en una app ya modificada, usar estas conexiones y comparar las props declaradas en el componente. No pegar el App entero sobre lógica nueva del equipo sin revisar el diff. La ruta segura para reproducir exactamente esta versión es la activación conjunta de la sección 7.

## 6. Qué copia cada pareja

| Pareja | Origen          | Destino provisional         | Destino final   |
| ------ | --------------- | --------------------------- | --------------- |
| 70s    | src/eras/70s/   | integracion/src/eras/70s/   | src/eras/70s/   |
| 80s    | src/eras/80s/   | integracion/src/eras/80s/   | src/eras/80s/   |
| 90s    | src/eras/90s/   | integracion/src/eras/90s/   | src/eras/90s/   |
| 2000s  | src/eras/2000s/ | integracion/src/eras/2000s/ | src/eras/2000s/ |

Copiar en cada carpeta: theme.ts, theme.css, Chrome.tsx, Player.tsx, content.ts, index.ts, contract.test.ts y README.md.

Persona A se ocupa de theme.ts y theme.css; persona B de Chrome.tsx y Player.tsx. Acordar content.ts entre ambas. Una carpeta incluye recuerdos, datos culturales y pistas de esa época; no ponerlos en src/data.ts ni src/eraData.ts, que son agregadores.

Respetar IDs existentes y nombres de clases/props. Los selectores CSS deben estar bajo .era-1970, .era-1980, .era-1990 o .era-2000. No importar otra época. El coordinador conecta las cuatro en registry.ts e importa sus CSS desde layout.tsx. Los index.ts de esta referencia **no importan CSS**: el layout los carga de manera estable.

Para probar el contrato de una pareja en el proyecto completo: npm run test:era -- 80s (cambiar 80s por su carpeta). No usar ese comando como prueba del código provisional en integracion: ese código todavía está excluido.

## 7. Activar la versión reunida

Este paso lo hace una persona coordinadora, en la rama de integración, **dentro de ProyectoFinalTPI**. Verificar que integracion/src tenga App.tsx, app/page.tsx, app/layout.tsx, components/NostalgiaClient.tsx, todos los componentes de la tabla, tipos, agregadores, CSS y las cuatro carpetas de época.

Antes de reemplazar nada: commit de la base y revisión de rutas. El respaldo se guarda en \_respaldo, excluido de Git y TypeScript; no dejar el src viejo como otra carpeta compilable.

```powershell
cd C:\Users\Tincho\Documents\GitHub\ProyectoFinalTPI
# Revisar que Get-Location muestre exactamente ProyectoFinalTPI.
Get-Location
# Confirmar que la carpeta preparada existe y está completa antes de continuar.
Test-Path .\integracion\src\App.tsx
Test-Path .\integracion\src\app\layout.tsx
# Si el respaldo ya existe, no sobrescribirlo: usar otro nombre.
New-Item -ItemType Directory -Path .\_respaldo -ErrorAction Stop
Move-Item -LiteralPath .\src -Destination .\_respaldo\src
Move-Item -LiteralPath .\integracion\src -Destination .\src
```

Copiar también scripts/ y tests/ de la referencia a las mismas rutas. Los archivos raíz de configuración y package-lock deben ser los preparados en la sección 3. Los archivos viejos MapExperience, features/map, features/music, types/index y globals.css quedan en \_respaldo; no deben volver al src activo. No mezclar los dos layouts ni cargar globals.css junto a los estilos completos.

No trasladar .git: el repositorio destino conserva su historial y remoto. No ejecutar push automático ni force push para esta migración.

## 8. Verificación antes de integrar a main

```sh
npm ci
npm run check
npm test
npm run build
npm run test:e2e
npm run test:e2e:mapbox
```

Detener otros next dev del mismo directorio antes de las pruebas. La suite 2D levanta su servidor con NEXT_PUBLIC_MAP_MODE=2d. La suite Mapbox sirve el build en otro puerto y usa el token público configurado **durante el build**; necesita acceso de red y Chrome. No inventar un token ni considerar verificado Mapbox si solo se probó Leaflet.

Recorrido manual:

1. Viajar por 70s/80s/90s/2000s: tema, relatos, datos y música cambian.
2. Abrir un pin, leer la ficha, filtrar por año/categoría y volver al globo.
3. Abrir feed; seguir un autor, usar Seguidos, comentar y dar me gusta.
4. Abrir y cerrar el mapa ampliado; seleccionar un pin y cerrar con Escape.
5. Crear un recuerdo desde mapa y otro desde perfil; recargar y comprobar persistencia y contadores.
6. Abrir Spotify, cambiar pista, cerrar y cambiar época: no debe quedar un iframe reproduciendo oculto.
7. Revisar móvil y teclado, fallos de almacenamiento y estado vacío.

Crear una PR con cambios y resultados. La otra persona de la pareja revisa su época; los cambios de contratos/motor los revisan las parejas afectadas.

## 9. Errores habituales

| Síntoma                                       | Revisar                                                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| window/document is not defined                | page debe montar NostalgiaClient; el ssr:false va dentro del componente cliente                       |
| Mapbox pendiente de configuración             | NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN, token pk., reiniciar dev o recompilar/redeploy                       |
| Vercel sigue en 2D                            | variable configurada en el ambiente correcto **antes** del build; NEXT_PUBLIC_MAP_MODE no debe ser 2d |
| Faltan memories/facts/icons o props de Chrome | se mezclaron contratos de la base con componentes de la referencia                                    |
| Dos temas se pisan                            | no cargar globals.css viejo; revisar orden de layout y alcance de CSS                                 |
| No aparecen recuerdos propios anteriores      | cambió el origen/puerto; localStorage no se copia con Git                                             |
| Fallan pruebas por puerto o bloqueo de Next   | detener el servidor del mismo proyecto antes de test:e2e; no ejecutar ambas suites simultáneamente    |
| GitHub bloquea un token                       | .env.example debe quedar vacío; .env.local no se commitea                                             |

## 10. Lo que todavía no se está migrando

Autenticación, API, base de datos, seguidores reales, permisos y sincronización no existen en esta referencia. El equipo puede agregarlos después con contratos compartidos. Conservar la distinción entre ejemplos ficticios, recuerdos locales y datos culturales con fuentes.
