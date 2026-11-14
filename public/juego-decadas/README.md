# Fotos del juego de las décadas

Agregá imágenes dentro de la carpeta correspondiente a la década real de la foto:

```text
public/juego-decadas/
  1970/estacion-de-trenes.jpg
  1980/plaza-del-barrio.png
  1990/vacaciones.webp
  2000/mi-foto.jpg
  2010/otra-foto.jpeg
  2020/foto-actual.avif
```

El nombre del archivo es libre. Se aceptan JPG, JPEG, PNG, WebP, AVIF y GIF, sin distinguir mayúsculas. No es necesario editar listas ni componentes. Las seis fotos originales se conservaron como `foto-original.jpg` dentro de sus respectivas décadas.

La página descubre los archivos desde el servidor de Next.js. En desarrollo, recargá `/juego` después de agregar fotos. En producción hay que volver a compilar y desplegar: los archivos nuevos se incorporan automáticamente durante `npm run build`. Los videos, otros tipos de archivo y las carpetas que no corresponden a las seis décadas del juego no se incluyen.
