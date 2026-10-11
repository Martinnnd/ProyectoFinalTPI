# Hashtags y trends del feed

- Cada recuerdo admite hasta cinco hashtags de 32 caracteres: letras, números y guion bajo. Se normalizan a minúsculas y se eliminan duplicados. El campo acepta espacios o comas, con o sin `#`.
- Los hashtags se crean al publicar y se pueden cambiar al editar. Se guardan con el recuerdo en `nostalgia.memories.v1`. Los registros anteriores siguen siendo compatibles.
- Trends semanales ordena las etiquetas por cantidad de publicaciones de los últimos siete días; desempata por participantes y luego por etiqueta. Usa `createdAt`, nunca el año histórico. Excluye fechas futuras, registros sin fecha y reposts. Respeta los filtros y la pestaña del feed, y se actualiza al cambiar los datos y cada minuto.
- Los datos de muestra tienen etiquetas en cada `eras/<década>/content.ts`. El agregador asigna fechas simuladas respecto del día de la visita; la UI indica que incluye publicaciones de muestra.
- Un hashtag abre un hilo con todos sus recuerdos bajo los filtros actuales, incluso los anteriores a esta semana. El hilo permite dejar aportes y comenzar un recuerdo con el hashtag precargado. Los aportes persisten en `nostalgia.hashtag-threads.v1` y son compartidos entre las vistas del mismo hashtag, independientemente de la década.
- La conversación es una simulación local con algunos participantes de muestra. No hay sincronización multiusuario. El backend externo sigue siendo necesario para crear publicaciones, como antes; los metadatos de hashtags y fechas se conservan en el frontend. Para sincronizarlos, el servidor deberá aceptar y devolver esos campos y ofrecer endpoints para los aportes.

Validación: `npm run check`, `npm test`, `npm run build` y `npx playwright test --config playwright.hashtags.config.ts`. La suite de hashtags usa el build en el puerto 3103 y simula únicamente la respuesta de creación del backend. Incluye creación, edición, persistencia y las cuatro décadas en móvil. Para usar Leaflet en esta suite, compilar con `NEXT_PUBLIC_MAP_MODE=2d`.

En Windows, si solo está instalado Edge, ejecutar la suite con `$env:PLAYWRIGHT_CHANNEL='msedge'`. Después de las pruebas, compilar sin `NEXT_PUBLIC_MAP_MODE=2d` para volver al mapa habitual.
