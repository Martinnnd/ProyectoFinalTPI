# Adaptación técnica Vite → Next.js

El contenido y los componentes funcionales se conservan. src/app/page.tsx reemplaza index.html/main.tsx. layout.tsx define HTML, metadata y el orden global de CSS. NostalgiaClient.tsx es un Client Component que carga el App existente con next/dynamic y ssr:false, porque Leaflet, los diálogos y la inicialización de la pantalla dependen del navegador. App Router renderiza el shell y la experiencia interactiva se monta en el cliente; no se introduce SSR de datos ni API.

App.tsx conserva navegación mediante estado, no rutas /feed o /perfil inventadas. Los imports internos siguen en las mismas rutas. Los CSS de cada era se importan desde layout.tsx y ya no desde index.ts para estabilizar su orden.

MainMap.tsx usa process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN, no import.meta.env. NEXT_PUBLIC_MAP_MODE=2d sirve para probar la alternativa de forma reproducible. Las variables públicas se incorporan al build. .env.local está excluido de Git y .env.example tiene el valor vacío.

El mapa principal conserva Mapbox; feed, perfil y modal usan Leaflet. Se mantiene React.lazy para cargar el módulo de Mapbox solamente cuando corresponde. Los recuerdos conservan la clave y el esquema localStorage; la migración de archivos no traslada el almacenamiento de otro origen.

Vite permanece solo como dependencia de herramientas de Vitest. No hay vite.config.ts, main.tsx ni index.html de entrada; dev/build/start usan Next.js.

Se mantienen las pruebas de lógica y recorridos del prototipo. Playwright 2D inicia Next en 3101 forzando solo ese modo; la suite Mapbox usa un build real en 3102. No usar el éxito de la suite 2D como evidencia de carga del proveedor.

Fuentes oficiales consultadas: [carga diferida](https://nextjs.org/docs/app/guides/lazy-loading) y [variables de entorno](https://nextjs.org/docs/app/guides/environment-variables).

Se normalizó el BOM UTF-8 de los archivos copiados: Turbopack conservaba un BOM al concatenar social.css y lo interpretaba como parte del primer selector, rompiendo el minimapa. La prueba del error de guardado ahora busca role=alert dentro del diálogo, para no confundirlo con el anunciador de rutas que agrega Next.

En la revisión móvil se corrigieron dos detalles de la copia: el ancho mínimo de la marca de los 90 y la ilustración del reproductor cerrado de los 80/90, para no tapar los controles. No se modificaron los archivos del prototipo original.
