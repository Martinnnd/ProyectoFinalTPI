# Juego de las décadas

Cada partida elige cinco imágenes al azar, sin repetir una misma URL, de estas fuentes:

1. Las fotos locales descubiertas en `public/juego-decadas/<década>/<nombre>`. Ver las instrucciones en `public/juego-decadas/README.md`.
2. Las fotos devueltas por el backend en `GET /api/juegos/decadas/fotos`, usando la URL de API que ya tiene configurada el proyecto.

El backend incluye recuerdos originales y visibles de `elNostalgico`, con fechas entre 1970 y 2029. La década se obtiene de la **fecha del recuerdo**, no de la fecha en que se subió la publicación. Excluye los títulos que contienen «Expo Proyecto» sin distinguir mayúsculas, los videos, los reposts y las cuentas eliminadas. Incluye las fotos principales de publicaciones antiguas y las fotos de la colección de adjuntos de las nuevas.

Solo después de responder, las preguntas provenientes de publicaciones muestran **Ver publicación**, tanto si se acertó como si no. El enlace abre el recuerdo en otra pestaña para conservar la partida. Las fotos locales no muestran ese enlace.

Se mantienen las cinco preguntas y los cuatro aciertos necesarios para ganar. Si el backend falla, el juego usa las fotos locales y lo indica sin bloquear la partida. Al jugar nuevamente vuelve a consultar las publicaciones disponibles. No se agregaron puntos, premios, tablas ni persistencia de partidas.

## Verificar

```sh
npm run check
npm test
npm run build
npm run test:e2e:game
```

Las pruebas de navegador simulan el catálogo del backend. Cubren las dos fuentes de fotos, el enlace después de acertar o equivocarse, la apertura en otra pestaña sin perder la partida, la ausencia de enlace en fotos locales, el respaldo cuando falla el backend y la vista móvil. Se puede usar un Chromium instalado indicando `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.
