# Tesoro semanal

El feed general incorpora una nota discreta, «Un rumor entre recuerdos», adaptada
a la época. Su enlace abre Explorar sin centrar la cámara en la respuesta.

La nota se intercala una sola vez después de la tercera, cuarta, quinta o sexta
publicación, elegida al azar para cada usuario y reto durante esa sesión. Mantiene
su lugar al dar likes, consultar el estado o cargar más páginas. Si el feed tiene
menos publicaciones, aparece al final; si está vacío, se muestra sin esperar a
que existan recuerdos. Durante la carga inicial no se adelanta al contenido.

En Mapbox, un trofeo aparece al superar el zoom mínimo del reto y mirar su zona.
No se consulta inclinación: también funciona con el mapa plano. Sólo participa
el mapa de Explorar, no los mapas del perfil o de las cápsulas. El modo de crear
recuerdos suspende el marcador para evitar clics accidentales.

Al recogerlo, un diálogo confirma el nombre del lugar y el guardado. La pista
del feed cambia al estado completado. No se entregan puntos ni se desbloquean
logros en esta primera versión. La sesión y los hallazgos pertenecen al backend;
no se usa localStorage para decidir si alguien completó el reto.

## Configuración y ejecución

- Requiere el backend de la rama `juego`, con las migraciones AgregarJuegoTesoro
  y AdministrarJuegoTesoro aplicadas.
- Configurar `NEXT_PUBLIC_API_URL` apuntando al backend local.
- Mapbox debe estar disponible con `NEXT_PUBLIC_MAP_MODE=auto` y un token público
  válido en `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. La alternativa Leaflet 2D conserva
  el funcionamiento existente, pero no muestra el tesoro.
- El catálogo y las semanas se gestionan desde `/admin` → Búsqueda del tesoro.
  La pista enviada al feed no incluye coordenadas.

```bash
npm ci
npm run dev
```

## Administración

Sólo las cuentas administradoras ven el panel y pueden usar sus endpoints.
Permite crear y editar lugares con buscador, clic en el mapa o coordenadas,
escribir pistas, elegir zoom mínimo y activar o desactivar ubicaciones.
El selector usa Mapbox si está configurado y Leaflet en modo 2D. Si el mapa o
el buscador no cargan se conservan los campos de coordenadas.

La planificación muestra las próximas 12 semanas: asignar un lugar, pausar una
semana o restaurar la rotación automática. La vista previa automática depende
del catálogo activo y puede variar si éste cambia. Desactivar un lugar pausa
las futuras semanas que lo tenían asignado mientras siga inactivo.

**Editar reto vigente** permite mover el tesoro y corregir la pista o el zoom
de esta semana, conservando los hallazgos y sin modificar el catálogo. Los
jugadores reciben el cambio al recargar, volver a la pestaña o en hasta un minuto.
Los errores de guardado conservan el formulario para poder reintentar.

## Archivos

- `src/treasure/treasureApi.ts`: contrato HTTP mediante el cliente autenticado existente.
- `TreasureProvider`: estado compartido por usuario, actualización al volver a la
  pestaña y cada minuto para detectar nueva semana o hallazgos de otra sesión.
- `TreasureClue`: presentación del rumor en el feed.
- `TreasureMapLayer`: consultas de visibilidad al terminar de mover el mapa,
  marcador, captura y manejo de errores. Retira el marcador al mover, alejar,
  cambiar de usuario, ocultar el mapa o entrar en creación de recuerdos.
- `TreasureFoundDialog`: celebración accesible y compatible con movimiento reducido.

## Pruebas

`npm test` y `npm run check` cubren contrato HTTP, normalización de la vista y
posición aleatoria de la pista entre la tercera y la sexta publicación.
`npm run test:e2e:treasure` comprueba las seis épocas, navegación real de Mapbox
con cámara plana, zoom, doble clic, persistencia, reintento, móvil y posición de la
pista al interactuar y paginar. Sus APIs y estilo cartográfico son locales para
no necesitar credenciales del proveedor.
También cubre el panel administrativo: búsqueda y selección de punto, creación,
desactivación, planificación, edición vigente y reintento de errores en móvil.
Puede indicarse Chromium instalado mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.
