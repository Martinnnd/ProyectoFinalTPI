# Iniciar sesión con Google

Implementación coordinada con el BE de la rama `inicio-sesion-google`. Configuración completa y migración: [guía del backend](https://github.com/lucyjv/ProyectoFinalTPI.Backend/blob/inicio-sesion-google/docs/GOOGLE_LOGIN.md).

## Activar

Crear un cliente OAuth de tipo Aplicación web en Google Cloud, registrar los orígenes exactos del FE y configurar `Google__ClientId` en el BE. No se usa client secret ni una variable `NEXT_PUBLIC_` de Google. El FE obtiene la configuración en runtime desde `GET /api/auth/google/config`. Sin Client ID, el botón permanece oculto y el formulario actual sigue funcionando.

El perfil de desarrollo debe poder enviar las cookies Secure del BE; se recomienda el perfil HTTPS (`NEXT_PUBLIC_API_BASE_URL=https://localhost:7014`, certificado local confiable). Mantener la configuración CORS existente con el origen correcto. La autenticación real requiere un Client ID válido, orígenes autorizados, conectividad a Google y cookies habilitadas.

Google Identity Services muestra el botón oficial “Continuar con Google” en login y registro. El BE valida la identidad y decide si corresponde entrar a la cuenta existente o pedir username para crear una nueva. La credencial de Google se mantiene solo en memoria durante ese paso, no se registra en consola ni se persiste. La sesión de Nostalgiar conserva el mismo mecanismo del login actual.

## Comportamiento

- María, cuenta antigua con contraseña y mismo Gmail: acceso inmediato a su cuenta existente; conserva también contraseña y todos sus datos.
- Pedro, cuenta antigua con otro correo: su nuevo Gmail crea una cuenta independiente después de elegir username.
- Víctor, nuevo registro con Google: acceso exclusivo por Google; no puede registrar ni recuperar una contraseña local.
- Las cuentas con contraseña creadas después del corte no se vinculan automáticamente. El corte lo establece una migración en el BE.

## Verificar

```sh
npm ci
npm run check
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npx playwright test --config playwright.google-auth.config.ts
```

La variable de Playwright es opcional si está instalado Google Chrome. No ejecutar simultáneamente otro `next dev` desde el mismo checkout.

Los tests de navegador simulan el SDK y la respuesta del BE para comprobar navegación, registro con username, errores de nombre ocupado y modo sin configurar. No sustituyen una prueba real contra Google. Las verificaciones criptográficas y las reglas de cuentas están cubiertas por tests del BE. Para validar con el proveedor real, completar la configuración de Google y probar los tres casos con cuentas de prueba.
