# Perfil y logros conectados al backend

Requiere el backend de la rama `logros` con los cambios de perfil y las migraciones aplicadas. En el frontend, `src/profileApi.ts` convierte la respuesta de la API y relaciona los IDs reales de logros con las imágenes disponibles. La numeración de los archivos de imágenes no es la numeración del backend.

El perfil carga nombre, username, reputación, contadores, publicaciones, seguidores y logros desde el servidor. Muestra carga, errores y reintento; sin sesión pide iniciar sesión. No utiliza el perfil de Nico, la foto de ejemplo ni el catálogo ficticio de 21 insignias. Al volver al perfil consulta datos actualizados; al cambiar de cuenta descarta la información anterior. El estado y la fecha de los logros sobreviven a una recarga porque se guardan en PostgreSQL, no en el navegador.

Los logros solo se muestran desbloqueados cuando el backend ya los otorgó. No se deducen de contadores del navegador. Los logros que no tengan todavía una acción implementada en el backend permanecerán bloqueados.

El catálogo actual contiene 17 logros. «Melómano», «Turista del Pasado» y «Mecenas» se retiraron mediante una migración del backend, sin cambiar los IDs de los demás.

Una cuenta recién registrada debe mostrar **0/17** y las 17 insignias bloqueadas. El registro cuenta como el primer día de la racha, pero no entrega un logro por sí solo. Se eliminó el catálogo de ejemplo sin uso de `src/data.ts`, que tenía «Primera palabra» y «Corazón abierto» marcados como conseguidos; «Corazón abierto» no pertenece al catálogo del backend. Si aparecen esas dos insignias al crear una cuenta, comprobá la carpeta y la versión del frontend que está ejecutándose: detené el proceso, actualizá `conectar-perfil-logros` y reiniciá `npm run dev`. Si usás `npm start`, reconstruí primero con `npm run build`.

El cartel «¡Logro completado!» usa los desbloqueos confirmados por el servidor. Se consulta después de las acciones confirmadas por la API, como crear recuerdos, comentar, dar likes o seguir usuarios. También se comprueban cambios al volver a la pestaña y cada 30 segundos mientras está visible, para detectar logros otorgados por acciones de otras personas. Si llegan varios, los avisos se muestran en orden. La primera consulta al iniciar sesión establece una referencia: no vuelve a anunciar los logros anteriores. Al cambiar de cuenta se descartan los avisos pendientes.

Las puntuaciones ahora se guardan en el backend: los botones usan `PUT /api/publicaciones/{id}/puntuacion`, muestran lo que devuelve el servidor y recuperan la puntuación del DTO al volver a abrir una publicación. Mientras se guarda se bloquean los botones; una respuesta fallida no modifica la puntuación visible. Pulsar el mismo puntaje vuelve a quitarlo.

Cronista Local reutiliza la ubicación que el navegador obtiene al abrir el mapa con el permiso inicial. Se conserva en memoria durante la sesión de la página y se envía al crear un recuerdo, separada del lugar histórico elegido en el mapa. No hay un botón adicional ni una segunda solicitud de ubicación en el formulario. Si el permiso se rechaza o no se obtiene una posición, se puede publicar igualmente sin comprobar ese logro. El backend verifica la cercanía; el navegador no otorga el logro por su cuenta.

Las rachas se actualizan en el backend al autenticar o renovar una sesión. Los logros nuevos devueltos por el login también muestran el cartel. Esa lista de avisos se consume una sola vez en memoria y no se guarda en `localStorage`, para que no se repita al recargar.

Si falla una publicación, el formulario conserva los datos y muestra el mensaje público del backend, el código HTTP y la referencia de seguimiento cuando están disponibles. Una respuesta HTTP 400 o 500 no se presenta como una falla de conexión. Para un error interno, buscá esa referencia en la terminal del backend: allí se registra la excepción, por ejemplo un problema de configuración o de carga a Cloudinary. No compartas claves ni contraseñas al copiar el mensaje. El mensaje de conexión se reserva para peticiones que no recibieron respuesta.

## Ejecutar

Instalá las dependencias con `npm ci`. El frontend usa `http://localhost:5199` por defecto: no requiere crear `.env.local` para conectarse al perfil HTTP del backend. `.env.example` es solo una plantilla, Next.js no lo carga automáticamente.

Si necesitás otra configuración, creá `.env.local` junto a `package.json` (está ignorado por Git), por ejemplo:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5199
NEXT_PUBLIC_MAP_MODE=2d
```

Adaptá la URL al backend local y reiniciá el frontend si cambia. Una variable existente en `.env`, `.env.local` o el proceso tiene prioridad sobre el valor predeterminado del código; si todavía apunta a `https://localhost:7014`, actualizala al puerto donde está escuchando tu backend. Las variables `NEXT_PUBLIC_` quedan incorporadas al compilar: si usás `npm run start`, volvé a ejecutar `npm run build` después de cambiarlas. El modo 2D permite probar sin un token Mapbox. No coloques credenciales de Cloudinary en este archivo.

```sh
npm run dev
```

El backend permite el origen de desarrollo `http://localhost:3001`. Entrá con una cuenta real o con un usuario del seed documentado del backend. Probá comentar un recuerdo de otra persona y luego volver a Perfil → Logros: debe aparecer «Primera Palabra». Recargá y verificá que se conserve.

## Pruebas

```sh
npm run check
npm test
npm run build
```

Para la prueba de navegador con API real, iniciá backend y frontend, y luego ejecutá:

```sh
npx playwright test --config playwright.profile.config.ts
```

Estos recorridos crean dos cuentas temporales en la base local, comentan una publicación del seed y comprueban catálogo, fecha, recarga y separación entre cuentas. También prueban puntuación y desmarcado contra la API real con `miguel@example.com` / `password123`, y la reutilización del permiso GPS inicial, tanto aceptado como rechazado, sin una segunda consulta de ubicación. Requieren que backend y frontend ya estén escuchando antes de ejecutar el comando. Usalos solo contra una base de desarrollo con el seed cargado. Requieren Chrome, como las otras pruebas del repositorio; también admiten `PLAYWRIGHT_CHROMIUM_EXECUTABLE` para un Chromium instalado y `PLAYWRIGHT_BASE_URL` para otro puerto del frontend. `NEXT_PUBLIC_API_BASE_URL` define la dirección de la API de la prueba. No simulan las respuestas del backend.
