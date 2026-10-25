# Perfil y logros conectados al backend

Requiere el backend de la rama `logros` con los cambios de perfil y las migraciones aplicadas. En el frontend, `src/profileApi.ts` convierte la respuesta de la API y relaciona los IDs reales de logros con las imágenes disponibles. La numeración de los archivos de imágenes no es la numeración del backend.

El perfil carga nombre, username, reputación, contadores, publicaciones, seguidores y logros desde el servidor. Muestra carga, errores y reintento; sin sesión pide iniciar sesión. No utiliza el perfil de Nico, la foto de ejemplo ni el catálogo ficticio de 21 insignias. Al volver al perfil consulta datos actualizados; al cambiar de cuenta descarta la información anterior. El estado y la fecha de los logros sobreviven a una recarga porque se guardan en PostgreSQL, no en el navegador.

Los logros solo se muestran desbloqueados cuando el backend ya los otorgó. No se deducen de contadores del navegador. Los logros que no tengan todavía una acción implementada en el backend permanecerán bloqueados.

## Ejecutar

Instalá las dependencias con `npm ci`. Creá `.env.local` (está ignorado por Git):

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5199
NEXT_PUBLIC_MAP_MODE=2d
```

Adaptá la URL al backend local y reiniciá el frontend si cambia. El modo 2D permite probar sin un token Mapbox. No coloques credenciales de Cloudinary en este archivo.

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

Este recorrido crea dos cuentas temporales en la base local, comenta una publicación del seed y comprueba catálogo, fecha, recarga y separación entre cuentas. Usalo solo contra una base de desarrollo. Requiere Chrome, como las otras pruebas del repositorio; también admite `PLAYWRIGHT_CHROMIUM_EXECUTABLE` para un Chromium instalado y `PLAYWRIGHT_BASE_URL` para otro puerto del frontend. `NEXT_PUBLIC_API_BASE_URL` define la dirección de la API de la prueba. No simula las respuestas del backend.
