# Recuperación de contraseña

Desde el login, **Olvidé mi contraseña** abre `/auth/recuperar`. El usuario ingresa su email y recibe una respuesta que no revela si la cuenta existe. El backend procesa el envío con Resend en segundo plano.

El correo abre `/auth/restablecer#token=...`. La pantalla toma el código, lo conserva solamente en memoria y lo quita de la dirección del navegador. Si se recarga esa pantalla, hay que volver a abrir el enlace completo del correo. Las páginas de recuperación no permiten indexación y usan `no-referrer`.

Al guardar la nueva contraseña, el backend consume el enlace y revoca las sesiones anteriores. El frontend limpia su sesión y ofrece volver al login. No inicia sesión automáticamente.

## Antes de probar con correos reales

- Aplicar en la base local la migración del backend `20261112192958_AgregarRecuperacionContrasena`.
- Tener verificado `notify.nostalgiar.com.ar` en Resend.
- Configurar `CorreoResend:ApiKey` en los secretos del backend, nunca en variables `NEXT_PUBLIC_`.
- Para probar localmente, configurar `RecuperacionContrasena:UrlRestablecimiento` con `http://localhost:3001/auth/restablecer` y `RecuperacionContrasena:Habilitado` en `true`, en Development. Usar el puerto real del frontend si es distinto.
- El frontend usa la dirección del backend configurada en `NEXT_PUBLIC_API_URL` (o `NEXT_PUBLIC_API_BASE_URL`). No necesita claves de Resend.

## Comprobación manual

1. Abrir el login y entrar en **Olvidé mi contraseña**.
2. Ingresar un email de una cuenta local y enviar. Debe aparecer **Revisá tu correo** con el mensaje genérico. Repetir con un email inexistente: la respuesta visible debe ser la misma.
3. Abrir el enlace recibido. Debe verse **Nueva contraseña** y desaparecer el `#token=...` de la dirección.
4. Ingresar contraseñas distintas. Debe indicar que no coinciden, sin guardar cambios.
5. Ingresar dos contraseñas iguales de entre 8 y 100 caracteres. Debe indicar **Contraseña actualizada**.
6. Iniciar sesión con la clave nueva. La anterior debe fallar y las sesiones abiertas antes del cambio deben dejar de acceder a recursos protegidos.
7. Volver a usar el mismo enlace. Al intentar guardarlo, debe ofrecer **Solicitar otro enlace**. Lo mismo debe ocurrir con uno vencido.
8. Abrir `/auth/restablecer` sin código: debe ofrecer pedir otro enlace, sin mostrar el formulario.

La respuesta 202 confirma que se recibió la solicitud; no garantiza entrega del correo. La cola actual del backend está en memoria: un reinicio puede perder solicitudes pendientes. Se puede volver a pedir el enlace respetando el intervalo de solicitudes.

## Pruebas preparadas

No se ejecutaron automáticamente. Desde la carpeta del frontend:

```powershell
npx vitest run src/components/auth/passwordRecovery.test.ts src/components/auth/passwordRecoveryApi.test.ts src/components/auth/authApi.test.ts
npx playwright test --config playwright.password-recovery.config.ts
```

Las pruebas de navegador simulan las respuestas de la API: no envían correos ni modifican la base. Cubren el recorrido desde el login, confirmación de contraseña, enlace mal formado, enlace vencido o usado y respuestas 429/503. La prueba con Resend y el backend reales se realiza con los pasos anteriores.
