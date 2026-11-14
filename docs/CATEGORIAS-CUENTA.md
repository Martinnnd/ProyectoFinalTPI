# Categorías de cuenta en el frontend

El frontend consulta `GET /api/categorias-cuenta/me` con la sesión actual. La categoría, los permisos, el cupo restante, la fecha de renovación y el máximo de adjuntos provienen del backend. No se calculan por likes ni se guardan como permisos en el navegador.

## Comportamiento

- La categoría se muestra junto al nombre en el perfil. Al hacer clic se abre el popup con los beneficios, el cupo semanal y las reglas para avanzar. Los avisos y el popup usan el estilo de la época seleccionada, desde los 70 hasta los 2020. El enlace de los avisos abre directamente ese popup.
- Errante puede publicar su primer recuerdo; al confirmarlo, se consulta nuevamente la categoría y se muestra el ascenso a Nostálgico. Ese recuerdo consume uno de los cinco lugares semanales.
- Los comentarios, las puntuaciones y los reposts requieren los permisos correspondientes. Los likes, los guardados y seguir perfiles conservan su funcionamiento.
- Aedo tiene siete recuerdos semanales y puede agregar música de Spotify. El ascenso lo determina el backend cuando una publicación recibe treinta puntos de nostalgia.
- Mnemosine y Marca pueden publicar sin cupo semanal, combinar hasta cuatro fotos o videos en una publicación y usar las sugerencias musicales de la época. Esta integración no incluye cobros ni asignación de suscripciones.
- La semana empieza el domingo a las 00:00 de Argentina. Borrar recuerdos no devuelve cupo; reposts y etiquetas no lo consumen. La prioridad en “Para vos” la aplica el backend.
- Los adjuntos son opcionales. Se mantienen la carga de archivos (fotos hasta 5 MB y videos hasta 2 MB) y los enlaces. Google Photos conserva el estado «Próximamente» definido en develop. Los adjuntos se envían como `Adjuntos[0].Archivo` o `Adjuntos[0].Url`, con su `Tipo`; la música usa `Musica.SpotifyId`, `Musica.Titulo` y `Musica.Artista`.
- Las respuestas 403 y 429 generan un aviso y actualizan los permisos. Un rechazo o una falla de conexión conserva el borrador y los archivos.
- La categoría se actualiza después de las acciones de la cuenta, al volver a la pestaña y cada minuto mientras la página está visible. El primer estado al iniciar sesión o recargar no genera un ascenso ficticio.

## Verificación

No se necesitan claves nuevas ni otra configuración del frontend. Se usa la URL de API existente (`NEXT_PUBLIC_API_URL` o `NEXT_PUBLIC_API_BASE_URL`) y el backend debe tener aplicadas sus migraciones de categorías y adjuntos.

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e:categories
```

Las pruebas de navegador usan respuestas simuladas de la API para reproducir permisos, ascensos, cupo agotado, cuatro adjuntos mixtos con música, grupos, etiquetas y vista móvil. Comprueban además que los avisos cambian con las seis épocas y que Google Photos sigue marcado como «Próximamente». Si se usa un Chromium ya instalado, se puede indicar su ruta mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.
