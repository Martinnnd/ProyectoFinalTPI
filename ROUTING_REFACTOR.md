# Reestructuración de Enrutamiento y Arquitectura Frontend

Este documento detalla los cambios realizados en la arquitectura de enrutamiento de **Nostalgiar Frontend**, explicando cómo funcionaba antes (Pre-Refactor), cómo funciona ahora (Post-Refactor), los archivos creados o reubicados, y cómo se preservó el 100% de la fidelidad visual y de estilos.

---

## 1. Comparativa: Pre-Refactor vs. Post-Refactor

| Aspecto | Pre-Refactor (Monolito en `/explorar`) | Post-Refactor (Next.js App Router Nativo) |
|---|---|---|
| **Estructura de Rutas** | Todo concentrado en `/explorar` (con `view = 'map' \| 'feed' \| 'profile' \| 'chat'`). | Rutas dedicadas: `/explorar`, `/feed`, `/recuerdo/[id]`, `/perfil`, `/perfil/[username]`, `/chat`. |
| **Deep Linking / Compartir** | No existía URL directa para publicaciones o perfiles ajenos sin pasar por query params frágiles. | Links 100% compartibles (ej: `/recuerdo/42` o `/perfil/lucia`) que cargan directo desde WhatsApp/Discord. |
| **Navegación e Historial** | Uso forzado de `window.history.pushState` manual y switch condicionales de render. | Navegación nativa de Next.js (`useRouter`, `next/link`), respetando el botón Atrás/Adelante del navegador. |
| **Persistencia de Época y Música** | La música sonaba porque todo estaba en el mismo componente `App.tsx`. | La música y la época retro persisten limpiamente a través de `EraProvider` en el layout compartido `(app)/layout.tsx` sin recargar ni pausar el audio al cambiar de página. |
| **Diseño Visual y Estilos** | Contenedor `.app.map-app.view-{view}.era-{decade}` con reglas CSS en 20+ archivos. | **Exactamente el mismo contenedor, mismas clases CSS, mismas etiquetas y tokens**. Cero cambios visuales. |

---

## 2. Mapa de Rutas de la Aplicación

```text
src/app/
├── (app)/                          # Grupo de rutas con Layout persistente (Navbar + Música + Épocas)
│   ├── layout.tsx                  # Envoltorio con EraProvider, FollowProvider, RatingsProvider y AppShell
│   ├── explorar/
│   │   └── page.tsx                # Exclusivamente el Mapa interactivo, pines, filtros y creador de recuerdos
│   ├── feed/
│   │   └── page.tsx                # Muro social ("Para vos" / "Seguidos" / scroll infinito / tendencias)
│   ├── recuerdo/
│   │   └── [id]/
│   │       └── page.tsx            # Vista dedicada del recuerdo (compartible, con botón "Ver en el mapa")
│   ├── perfil/
│   │   ├── page.tsx                # Mi perfil propio (mis recuerdos, logros, configuración)
│   │   └── [username]/
│   │       └── page.tsx            # Perfil público de otro usuario (seguir, ver recuerdos, iniciar chat)
│   └── chat/
│       └── page.tsx                # Mensajería privada y SignalR (con soporte directo para ?con=username)
├── auth/                           # Login y Registro (independientes)
│   ├── login/
│   └── registro/
└── page.tsx                        # Landing page de bienvenida
```

---

## 3. Detalle de Archivos Nuevos y Cambios de Ubicación

### A. Contextos y Estado Global (Nuevos)
* **`src/context/EraContext.tsx`**: Administra la década actual (`period.decade`), el año histórico, los tokens CSS de la época (`eraThemes`) y el estado del reproductor de música retro (`musicOpen`, `factsOpen`, `panelOpen`).
* **`src/context/FollowContext.tsx`**: Desacopla la lógica de seguimiento de usuarios (`followingUsers`, `followers`, `toggleFollow`). Permite que tanto el buscador del navbar, el feed y los perfiles compartan el estado de seguimiento sin duplicar peticiones.
* **`src/context/RatingsContext.tsx`**: Provee el estado de puntuación de recuerdos (`ratings`, `pointsMap`, `rateMemory`) accesible tanto en el feed como en la vista individual del recuerdo.

### B. Layout Compartido y Vistas Desacopladas (Nuevos)
* **`src/components/layout/AppShell.tsx`**: Contenedor maestro que preserva la estructura visual original:
  * El encabezado con la línea de tiempo (`EraTimeline`).
  * La barra de navegación lateral e inferior (`navigation-rail` y `mobile-appbar`).
  * El buscador de usuarios (`UserSearch`) y menú de cuenta (`AuthMenu`).
  * El reproductor retro (`Player`) y cromado vintage (`EraChrome`).
  * Calcula la clase `view-${currentView}` dinámicamente según la ruta activa (`/feed` → `view-feed`, `/chat` → `view-chat`, etc.) para que todas las hojas de estilo apliquen a la perfección.
* **`src/components/map/ExploreView.tsx`**: Contiene la lógica pura del mapa:
  * Carga de pines por cuadrante (`getMapPublications`).
  * Filtro por categorías y buscador geográfico (`PlaceSearch`).
  * Marcado y guardado de nuevos recuerdos sobre coordenadas (`MainMap` + `MemoryForm`).
  * Redirección retrocompatible en caso de que alguien acceda a `/explorar?view=feed`.
* **`src/components/profile/ProfileView.tsx`**: Componente reutilizable para perfiles que unifica la carga de datos del backend (`getPerfilUsuario` y `getPublicacionesUsuario`) tanto para el perfil propio (`/perfil`) como para perfiles ajenos (`/perfil/[username]`).

### C. Páginas de Ruta (Nuevas / Reubicadas)
* **`src/app/(app)/layout.tsx`**: Carga todas las hojas de estilo retro y envuelve a las rutas de la aplicación con los Providers globales y `AppShell`.
* **`src/app/(app)/explorar/page.tsx`**: Monta `ExploreView` con carga dinámica sin SSR (`ssr: false`) para Leaflet/Mapbox.
* **`src/app/(app)/feed/page.tsx`**: Muro social con `SocialFeed`, comentarios y filtros de épocas.
* **`src/app/(app)/recuerdo/[id]/page.tsx`**: Página con URL propia para cada recuerdo. Incluye botón directo *"Ver en el mapa"*, comentarios, relaciones de lugar/fecha y botón para compartir.
* **`src/app/(app)/perfil/page.tsx`**: Página dedicada a mi perfil.
* **`src/app/(app)/perfil/[username]/page.tsx`**: Página dedicada a perfiles de la comunidad.
* **`src/app/(app)/chat/page.tsx`**: Página dedicada al chat en tiempo real por WebSockets (SignalR).

---

## 4. Cómo Interactúan las Rutas entre Sí

1. **Desde el Mapa (`/explorar`):**
   * Al hacer clic en un pin, se abre la vista previa (`PinMemoryPreview`) con la miniatura, descripción y el carrusel de *"Otros recuerdos en este lugar"*.
   * Al hacer clic en una tarjeta de otro recuerdo de ese lugar perteneciente a otra década/fecha, la interfaz ejecuta `selectRelatedMemory`:
     * Dispara la transición visual de época (`ViewTransition` con efecto vintage `.switching-era`).
     * Actualiza la década activa en `EraContext` (`1970`, `1980`, `1990` o `2000`), cambiando automáticamente los tokens CSS, temas, línea de tiempo (`EraTimeline`) y la música del reproductor (`Player`).
     * Mantiene y actualiza la tarjeta de vista previa abierta con el nuevo recuerdo seleccionado.
   * Al hacer clic en *"Ver publicación"* de un pin del mapa, navega a `/recuerdo/[id]`.
   * Al hacer clic en *"Feed"* en la barra de navegación, cambia a `/feed` **sin detener la música**.
2. **Desde el Feed (`/feed`):**
   * Al hacer clic en el nombre de un autor, navega a `/perfil/[username]`.
   * Al hacer clic en *"Ver en el mapa"* en una tarjeta, navega a `/explorar?recuerdo=[id]`, centrando el mapa en las coordenadas del pin.
   * Al hacer clic sobre el contenido del recuerdo, abre su ruta directa `/recuerdo/[id]`.
3. **Desde un Recuerdo (`/recuerdo/[id]`):**
   * Podés copiar la URL del navegador y compartirla.
   * Cuenta con un botón *"Ver en el mapa"* que te lleva a `/explorar?recuerdo=[id]`.
   * Al hacer clic en recuerdos relacionados del carrusel, navega fluidamente a `/recuerdo/[otroId]`.
4. **Desde un Perfil (`/perfil/[username]`):**
   * Botón *"Iniciar chat"* navega a `/chat?con=[username]`, abriendo la conversación directamente.
   * Botón *"Seguir / Dejar de seguir"* sincroniza en tiempo real el contador y la lista de seguidos.

---

## 5. Verificación de Integridad

* **TypeScript (`tsc --noEmit`):** 0 errores.
* **Suite de Vitest (`npm test`):** 141 tests aprobados (28 suites).
* **Servidor de Desarrollo:** Todas las rutas responden `HTTP 200 OK` en `http://localhost:3001`.
