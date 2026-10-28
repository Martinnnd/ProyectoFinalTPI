# Hashtags del feed

Los hashtags se escriben en la descripción de un recuerdo. El frontend los detecta y muestra como enlaces; el backend busca directamente en las descripciones almacenadas. No existe una tabla ni un grupo que haya que crear para cada hashtag.

## Recorrido del usuario

- El buscador del panel lateral consulta `GET /api/publicaciones/hashtags/buscar?q=...` y muestra hashtags existentes. Se espera un breve intervalo al escribir para evitar una petición por tecla.
- Al tocar un hashtag en una publicación, en el buscador o en tendencias, se abre `/feed?tag=nombre`. El enlace se puede compartir y muestra publicaciones de cualquier época y usuario.
- La lista se consulta en `GET /api/publicaciones/hashtags/{nombre}/publicaciones?limite=20&cursor=...`; se cargan más páginas al desplazarse. Los filtros del feed general no restringen esta lista.
- «Trends semanales» consulta `GET /api/publicaciones/hashtags/tendencias?limite=5`. El backend cuenta publicaciones creadas en los últimos siete días. El año histórico del recuerdo no determina la tendencia.
- «Sumar un recuerdo» abre el formulario de publicación con el hashtag precargado.

Las respuestas de búsqueda y tendencias contienen `hashtag`, `cantidadPublicaciones` y `cantidadAutores`. La lista usa la misma forma paginada de publicaciones que el feed: `items`, `siguienteCursor`, `hayMas`.

El frontend conserva la extracción local de etiquetas para el formulario y para mostrar los enlaces de cada publicación. El backend es la fuente de verdad para búsqueda, listas y tendencias. Las aportaciones de conversación que se guardaban solo en el navegador dejaron de mostrarse en la página del hashtag.

Validación: `npm run check` y `npx playwright test --config playwright.hashtags.config.ts` tras compilar el frontend. La suite de Playwright simula las respuestas del backend y comprueba el enlace directo, la paginación, la búsqueda y la navegación desde tendencias.
