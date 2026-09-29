# Cloud-faro

Proyecto académico independiente para la Actividad Sumativa Nº1. Backend Spring Boot 3 / Java 17, React y SQLite. Identidad mediante Amazon Cognito y preparación para AWS HTTP API Gateway.

## Por dónde seguir

El frontend está listo para completar la configuración manual. Empieza por [la guía completa de AWS y entrega](docs/AWS-MANUAL.md) y [GitHub con tu compañera](docs/GITHUB-COLABORACION.md). No hay servidores en ejecución ni recursos AWS creados por esta entrega. Los comandos de inicio de abajo los ejecutas tú cuando decidas hacer la demo.

## Inicio local

Requisitos: JDK 17, Maven 3.9+, Node.js 22 LTS y npm. No se necesitan credenciales AWS para compilar, probar, abrir el login o consultar información pública. El login real y las operaciones protegidas requieren completar [AWS manual](docs/AWS-MANUAL.md).

Terminal 1 (PowerShell, desde esta carpeta):

```powershell
cd backend
# Para probar /api/public/info se pueden omitir estas dos variables.
# Para login real, reemplazar por los identificadores del mismo App Client del frontend.
$env:COGNITO_ISSUER_URI='https://cognito-idp.REGION.amazonaws.com/USER_POOL_ID'
$env:COGNITO_CLIENT_ID='APP_CLIENT_ID'
mvn spring-boot:run
```

El backend escucha en http://localhost:8081. SQLite crea `backend/productos_db.db` al ejecutar desde `backend`. El archivo no se incluye en Git ni contiene datos iniciales. El pool JDBC usa una conexión para evitar escrituras simultáneas en esta demo SQLite.

Terminal 2:

```powershell
cd frontend
Copy-Item .env.example .env
# Editar .env con los IDs de Cognito. No poner secretos en variables VITE_*.
npm ci
npm run dev
```

Abrir http://localhost:3000. El servidor no cambia automáticamente de puerto si el 3000 está ocupado. `backend/.env.example` es una referencia: Spring NO carga archivos `.env` automáticamente; usar variables de entorno como arriba. Vite sí carga `frontend/.env` al arrancar y requiere reinicio después de editarlo.

Prueba pública: `Invoke-RestMethod http://localhost:8081/api/public/info`. Una llamada a `/api/products` sin token devuelve 401. No hay cuentas locales, claves de firma ni bypass de seguridad.

## Arquitectura

`Controller -> Service -> Repository -> Entity -> SQLite`. Paquete `cl.cloudfaro`, sin dependencia del repositorio FARO. DTOs con Bean Validation; servicios transaccionales; repositorios JPA. El cliente usa React Router DOM, `ProtectedRoute`, una única instancia Axios y el SDK Cognito con autenticación SRP.

| Método y ruta | Público | USER | EDITOR | ADMIN |
|---|---|---|---|---|
| GET /api/public/info | Sí | Sí | Sí | Sí |
| GET /api/products | No | Sí | Sí | Sí |
| POST /api/products | No | No | No | Sí |
| PUT /api/products/{id} | No | No | No | Sí |
| DELETE /api/products/{id} | No | No | No | Sí |
| POST /api/contact | No | Sí | Sí | Sí |
| GET /api/contact | No | No | Sí | Sí |

Las rutas React son `/login`, `/productos`, `/admin/productos` y `/contacto`. La última incluye la bandeja de mensajes para ADMIN/EDITOR. El guard decodifica el JWT para la interfaz; la autorización efectiva siempre está en Spring. Cognito `cognito:groups` se mapea a `ROLE_*` con `JwtAuthenticationConverter`.

Spring valida firma RS256 mediante JWKS, emisor, tiempos del JWT, `token_use=access` y `client_id`. No se aceptan ID tokens como Bearer. JWKS se descarga al validar un token, por lo que el endpoint público funciona sin un User Pool configurado. Los IDs de ejemplo no permiten autenticación real.

Tokens de acceso, ID y renovación permanecen en memoria mediante almacenamiento personalizado del SDK. Se renuevan con `getSession` al vencer y se descartan al cerrar sesión, ante 401 o al recargar. Un 403 muestra falta de permisos y no cierra la sesión. El cierre local no revoca de inmediato access tokens ya emitidos: conservan su vencimiento. No hay persistencia de tokens en localStorage.

## Contratos de ejemplo

POST y PUT productos:

```json
{"name":"Cuaderno","description":"Producto de demostración","price":1990.50,"stock":10}
```

POST contacto:

```json
{"subject":"Consulta","message":"Mensaje académico de prueba"}
```

POST devuelve 201; PUT, 200; DELETE, 204; ID inexistente, 404; campos inválidos, 400; sin JWT válido, 401; rol insuficiente, 403. El remitente del mensaje proviene del `sub` autenticado, no del cuerpo enviado por el cliente.

## Verificación

```powershell
cd backend
mvn test
mvn package
cd ../frontend
npm ci
npm test
npm run build
```

[Resultados y límites de la verificación](docs/VERIFICACION.md). Las pruebas de integración usan un JwtDecoder simulado y una SQLite separada en `target`; prueban la cadena real de filtros y el converter, pero no sustituyen una prueba real contra Cognito. Las pruebas de React verifican acceso por URL, expiración e interceptor Bearer.

## Entrega y demostración

1. Completar [AWS-MANUAL](docs/AWS-MANUAL.md), crear un usuario de prueba por rol y rellenar las variables.
2. Iniciar backend y frontend. Como ADMIN crear, editar y eliminar un producto.
3. Como USER o EDITOR listar productos y enviar contacto. Abrir directamente `/admin/productos` para demostrar el bloqueo.
4. Como EDITOR leer contactos; como USER comprobar 403 al llamar GET `/api/contact` desde un cliente HTTP.
5. Mostrar 401 sin JWT y 403 con JWT válido sin permiso; inspeccionar Bearer en DevTools sin incluir tokens completos en el informe.
6. Reiniciar el backend y comprobar que los datos creados persisten en SQLite.
7. Tras configurar Gateway, repetir con `VITE_API_BASE_URL=https://API_ID.execute-api.REGION.amazonaws.com/api` (o incluir el stage si no es `$default`).

La pauta pide además un informe Word con capturas reales de AWS, ZIP de frontend/backend y exposición. No se fabrican capturas ni se presenta AWS como configurado. El checklist detalla las evidencias pendientes. `Cloud-faro.zip` contiene solamente el código y documentación del proyecto.

## Origen e independencia

[Auditoría y correspondencia con la pauta](docs/AUDITORIA.md). Solo se adaptó el patrón y el flujo básico del CRUD propio de FARO. No se copiaron MongoDB, Flutter, configuración de Render, secretos, firmas, logs, builds ni datos. Este directorio está separado de FARO y se entrega sin `.git`; la guía de colaboración indica cómo inicializarlo y conectar tu repositorio nuevo. No se publicaron servicios ni se crearon recursos AWS.
