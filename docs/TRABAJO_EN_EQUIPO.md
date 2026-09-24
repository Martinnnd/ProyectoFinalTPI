# Equipos por época

La separación motor/presentación del PDF se mantiene. Cada pareja es dueña de src/eras/70s, 80s, 90s o 2000s. Persona A: theme.ts/theme.css. Persona B: Chrome.tsx/Player.tsx. Ambas acuerdan content.ts y verifican contract.test.ts.

No duplicar estado, almacenamiento ni acceso a proveedores dentro de una época. Usar callbacks de contracts.ts y los componentes compartidos de eras/shared. No importar otra época ni los agregadores del motor. Mantener clases limitadas a la década.

El coordinador integra contracts.ts, registry.ts, App.tsx, src/app/layout.tsx, componentes comunes y CSS global. Una nueva época requiere acordar cambios en Decade, registro, validación de años y tests; no agregar if/switch visuales al motor.

Trabajar en ramas como era/80s-reproductor; la otra persona de la pareja revisa la PR. Los cambios comunes necesitan revisión de las parejas afectadas. Cada época se puede abrir con http://localhost:3001/?era=1970 (o 1980, 1990, 2000).

Comandos: npm run check; npm run test:era -- 80s; npm test; npm run build. Recorrer mapa, feed, perfil y móvil. No configurar CODEOWNERS con nombres ficticios.

La transferencia a la base vacía se explica en [la guía de migración](../README-MIGRACION-A-PROYECTOFINALTPI.md). No copiar un componente aislado antes de tener su contrato y dependencias.
