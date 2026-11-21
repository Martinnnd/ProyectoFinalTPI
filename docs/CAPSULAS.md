# Sección de cápsulas

Rama `Seccion-capsulas`, creada desde `develop` actualizado (`d6cb3cd`).

## Qué incluye

- `/capsulas`: archivo propio, con las cápsulas públicas y privadas. Requiere sesión.
- `/capsulas?propietarioId=ID`: cápsulas públicas de otro usuario.
- `/capsulas/ID`: interior común a todas las épocas, con recorrido cronológico y mapa.
- Acceso desde la navegación principal, el menú de usuario y los perfiles.
- Creación, edición, visibilidad privada por defecto, selección de portada entre recuerdos incluidos, asociación de recuerdos propios y eliminación de la cápsula.
- Selector opcional de varias cápsulas al publicar. Usa el multipart compartido tanto para recuerdos generales como para grupos.

El listado hereda colores y tipografía de la década actual. Las tarjetas representan un casete, VHS, disco, pendrive, celular o nube. Cambiar la década cambia la presentación, **no filtra el contenido** ni vuelve a pedir el listado.

Dentro de cada cápsula se usa una presentación común con tonos claros, títulos de archivo e hilo por fecha del recuerdo. «Ver publicación» abre el detalle ya existente y permite volver a la cápsula. Las interacciones y los comentarios siguen estando en la publicación original.

El mapa reutiliza `MemoryMap` con `showRelations=false`. Los pines vienen exclusivamente de `/api/capsulas/ID/mapa`, se cargan por páginas de hasta 200 y el encuadre usa los límites globales del backend. No consulta el mapa general ni agrega recuerdos relacionados.

## Cómo se conecta

`capsulesApi.ts` usa `apiRequest` y la autenticación existente. Todas las lecturas de cápsulas usan `cache: no-store`; no se agregan a la caché pública de perfiles. El propietario de una escritura se obtiene en el backend desde el token, nunca desde el formulario.

`useCursorPage` cancela solicitudes anteriores, conserva el cursor y combina páginas sin claves duplicadas. Los componentes se separan por usuario/recurso para descartar datos de la sesión anterior. El selector de publicación también vincula su selección al usuario actual.

La privacidad de una cápsula **no cambia la visibilidad de las publicaciones originales**. La interfaz lo aclara al crearla, al publicar en ella y en el interior de las cápsulas privadas. Los permisos reales siempre los valida el backend; ocultar botones no reemplaza esa comprobación.

No se agregaron dependencias, servicios de terceros ni variables de entorno. Se conserva `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE_URL` ya configurado en el proyecto.

## Para probar localmente

1. Levantar el backend desde `Funcionalidad-Capsula`, con las migraciones `AgregarCapsulas` y `AgregarPortadaSubidaCapsula` aplicadas en la base local. La segunda está generada y pendiente de aplicación. El backend de `main` todavía puede no tener estos endpoints.
2. Levantar este frontend con `npm run dev`.
3. Iniciar sesión y entrar a «Mis cápsulas».
4. Crear una privada, sumar recuerdos de distintas épocas y cambiar de década en el listado: cambia la tarjeta, se conserva la colección.
5. Probar el recorrido y el mapa. Abrir una publicación y volver a su cápsula.
6. Publicar un recuerdo y elegir una o más cápsulas en el paso «Tu historia».
7. Hacer pública una cápsula y recorrerla desde otra sesión. No deben aparecer acciones de administración. Una cápsula privada ajena debe responder como no disponible.
8. Quitar un recuerdo o borrar una cápsula y comprobar que la publicación original siga existiendo.

## Pruebas preparadas, sin ejecutar

Se agregaron pruebas de API, presentación y multipart compartido, además de pruebas de navegador con respuestas simuladas. Estas últimas no escriben en una base real.

```powershell
npx vitest run src/capsulesApi.test.ts src/components/capsules/capsulePresentation.test.ts src/publicationFormData.test.ts
npx playwright test --config playwright.capsules.config.ts
```

La configuración de Playwright levanta Next en el puerto `3131`. También admite `PLAYWRIGHT_BASE_URL` y `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, como las configuraciones existentes del proyecto.

La comprobación estática es `npm run check`. No reemplaza correr las pruebas y revisar el diseño en el navegador.

## Foto de portada

En crear y editar hay tres opciones: automática, foto de un recuerdo incluido o subir desde el dispositivo. Se aceptan JPG/PNG/WebP de hasta 5 MiB y se muestra una vista previa. El archivo se envía junto con el formulario en una sola solicitud multipart; una falla mantiene abierto el formulario y conserva la selección para reintentar. La portada externa no crea una publicación ni un pin.

Para conservar una foto subida al editar, no hace falta volver a seleccionarla. Se puede reemplazar por otro archivo, por una foto de un recuerdo o volver a automática. Quitar la selección de un archivo nuevo antes de guardar conserva la portada subida anterior si existía.

Las fotos subidas se descargan por el cliente autenticado como Blob y se muestran mediante una URL temporal del navegador, revocada al salir o reemplazarla. No se incluye el token en la URL ni se muestra una URL firmada de Cloudinary. El cambio de usuario descarta la imagen anterior. La API vuelve a validar la privacidad en cada descarga; las fotos de recuerdos mantienen su visibilidad original.

Prueba manual tras aplicar la migración:

1. Crear una privada con foto externa y comprobar portada en tarjeta y detalle, sin nuevas publicaciones.
2. Editar solo el nombre y comprobar que conserve la portada. Reemplazarla por otra foto.
3. Elegir un recuerdo o volver a automática y comprobar que muestre la nueva elección.
4. Probar JPG/PNG/WebP, un archivo de más de 5 MiB y un SVG: estos últimos deben rechazarse.
5. Verificar desde otra sesión que la cápsula privada y su portada no sean accesibles; hacerla pública y repetir.

Los tests de API cubren multipart y la descarga autenticada. Playwright incluye vista previa, rechazo de formato y reintento tras un error de guardado. Están preparados **sin ejecutar**; se usan los mismos comandos indicados arriba.
