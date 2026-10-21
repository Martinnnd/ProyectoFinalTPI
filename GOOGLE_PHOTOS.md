# Google Photos en Crear recuerdo

El formulario permite elegir una foto desde Google Photos sin perder el borrador.
La selección se convierte en un archivo local (data URL del formulario existente),
se previsualiza y se envía como `Archivo` al publicar. No se guardan enlaces temporales
de Google ni se sube a Cloudinary durante la selección.

## Desarrollo local

- Frontend: rama `google-photos`, `npm.cmd run dev`, http://localhost:3001.
- Backend: rama `google-photos`, ejecutándose en http://localhost:5000.
- `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000`.
- Las credenciales OAuth quedan exclusivamente en user-secrets del backend.
- Usar localhost en ambos servidores; no mezclarlo con 127.0.0.1.
- Reiniciar Next si cambia NEXT_PUBLIC_API_URL.

Iniciar sesión en Nostalgiar, tocar Recordar, elegir un lugar y pulsar
"Elegir desde Google Photos". Autorizar con una cuenta de prueba agregada en Google
Cloud, seleccionar una foto y confirmar. Revisar la vista previa y guardar.
El usuario puede cancelar sin perder el texto ni el adjunto anterior, o quitar la
foto importada antes de publicar. El diseño hereda los colores de cada época.

El popup se abre en el click para evitar bloqueos. Si el navegador lo bloquea,
el formulario explica cómo habilitarlo. Cerrar la ventana de Google no cancela
automáticamente la operación porque el Picker también se cierra al terminar:
el botón Cancelar selección permite abandonarla explícitamente.

Las peticiones usan apiFetch (JWT de Nostalgiar y credentials: include).
Se respeta pollAfterSeconds y expiresAt. Tokens de Google nunca llegan al navegador.
Sólo se conserva el ID de operación en sessionStorage por usuario para reintentar
la limpieza tras un error o recarga. El borrador se mantiene mientras el formulario
está abierto, no se garantiza su persistencia después de recargar la página.

## Verificación

```powershell
npm.cmd run check
npm.cmd test -- src/googlePhotos.test.ts src/publicationFormData.test.ts src/components/auth/apiClient.test.ts
```

Pruebas de navegador con API/Google simulados, sin acceder a fotos reales:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3001'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npx.cmd playwright test --config playwright.google-photos.config.ts
```

Sin PLAYWRIGHT_BASE_URL el archivo de configuración inicia Next en 3110 (requiere
que no haya otro next dev usando la misma carpeta). El navegador predeterminado
es Chromium de Playwright; PLAYWRIGHT_CHANNEL permite usar Edge instalado.

La autorización real depende de las credenciales y permisos de la cuenta de Google.
Debe validarse manualmente con el usuario: selección, vista previa y publicación final
en Cloudinary. Los tests no afirman verificar la configuración externa de Google Cloud.
