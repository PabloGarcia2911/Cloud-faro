# Auditoría previa y trazabilidad

Fecha: 29 de septiembre de 2026.

## Fuente de referencia (solo lectura)

`C:/Users/pablo/Documents/faroapp`, HEAD observado `fee625643777b4f90e3a17a90747615bfaed13d2`.

Se revisaron `backend/pom.xml` y los archivos `ProductoController`, `ProductoService`, `ProductoRepository`, `Producto`. No se inspeccionaron secretos ni datos productivos. El repositorio tenía cambios previos en frontend Flutter, scripts y documentación; se conservaron. Se usó `GIT_OPTIONAL_LOCKS=0` y una excepción safe.directory limitada a cada comando de lectura, sin modificar su configuración Git.

Hallazgos: Spring Boot 3.5.7, Java objetivo 17, separación de capas, persistencia MongoDB, reglas de propiedad por negocio y modo demo con datos ajenos al alcance académico. Frontend principal Flutter. El proyecto nuevo no es una copia de FARO ni comparte su Git.

Adaptación: flujo `findAll/save/findById/delete`, comprobación de existencia, separación Controller-Service-Repository-Entity, campos nombre/descripción/precio/stock. Se reescribieron entidades como JPA con IDs Long, contratos ingleses y validación; se eliminaron dependencias de negocios, usuarios locales, ratings, reseñas, MongoDB y DemoDataService. React, Cognito, contacto y configuración SQLite se implementaron de forma independiente.

No se copiaron `.git`, `.env`, claves, archivos de firma, assets, builds, caches, logs, datos ni `render.yaml`.

## Pauta

Fuente: `C:/Users/pablo/Downloads/Actividad Sumativa Nº1.pdf`, 9 páginas; extracción completa y revisión visual de páginas 2–5 con contratos y ejemplos.

| Requisito | Implementación |
|---|---|
| CSR + SQLite, págs. 2–3 | controller/service/repository/entity, productos_db.db |
| 3 controladores y matriz de roles, pág. 2 | SecurityConfig, PublicController, ProductController, ContactController |
| Resource Server + converter, pág. 3 | JWKS Cognito, JwtAuthenticationConverter, ROLE_* |
| React 3000 y Spring 8081, pág. 1 | Vite strictPort 3000, server.port=8081 |
| 4 vistas + guard + Axios, pág. 4 | App.jsx, pages/, ProtectedRoute, api.js |
| Cognito + Gateway, pág. 5 | Preparación de configuración; ejecución manual pendiente |
| Informe Word con capturas, págs. 6–8 | Checklist AWS; capturas reales pendientes |
| Demo funcional por roles, pág. 7 | Pruebas locales y guion README; Cognito real pendiente |

## Ajustes técnicos a los ejemplos

La pauta muestra `org.hibernate.community:hibernate-community-dialects:6.4.4.Final`. La coordenada Maven publicada correcta usa grupo `org.hibernate.orm`; el paquete Java del dialecto sí es `org.hibernate.community.dialect.SQLiteDialect`. Se delegan versiones al BOM de Spring Boot 3.5.7 para alinear Hibernate Core y community dialects, en lugar de mezclar Hibernate 6.6 con un dialecto 6.4. SQLite JDBC también usa la versión gestionada por Boot. Se mantiene el motor y dialecto exigidos.

La configuración de ejemplo de la pauta permite todo `/api/contact/**` a autenticados, pero el requisito textual exige que GET sea ADMIN/EDITOR. Se implementó la restricción textual más precisa. Sin JWT corresponde 401; con JWT válido y permisos insuficientes corresponde 403.

El texto pide estado global o memoria para JWT y luego ilustra localStorage. Se eligió memoria. `spring.jpa.show-sql=false` evita ruido de SQL; puede activarse para exposición. API Gateway no puede conectar a localhost del estudiante: ver AWS-MANUAL para la decisión de conectividad pendiente.
