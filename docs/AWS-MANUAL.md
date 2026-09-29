# Guía completa: configuración manual y entrega de Cloud-faro

Esta guía la ejecutan Pablo y su compañera. No hay automatizaciones de AWS, despliegues, túneles ni servidores ejecutándose como parte de la entrega. Los comandos de arranque siguientes son instrucciones para cuando ustedes decidan hacer la demo. El frontend está conectado por código al backend; la comprobación real con Cognito y Gateway se realiza siguiendo estos pasos.

## 1. Preparar el repositorio compartido

Seguir primero [GITHUB-COLABORACION.md](GITHUB-COLABORACION.md). Crear un repositorio nuevo y vacío, independiente de FARO, y compartir acceso con la compañera. Cada integrante trabaja con su copia y su `.env` local. No copiar carpetas ni Git de FARO.

## 2. Preparar el equipo

1. Instalar JDK 17, Maven 3.9+, Node.js 22 LTS y Git.
2. Comprobar `java -version`, `mvn -version`, `node --version` y `git --version`. Maven debe mostrar Java 17. Si hay varios Java, configurar `JAVA_HOME` a JDK 17 en esa terminal.
3. Desde `frontend`, ejecutar `npm ci`. Esto instala dependencias; no inicia el frontend.
4. Opcionalmente ejecutar `npm test` y `npm run build`: son pruebas en memoria y compilación estática, sin servidor. Desde `backend`, `mvn test` ejecuta pruebas con MockMvc y SQLite de prueba.

## 3. Crear Cognito User Pool

1. Entrar a la consola AWS de la cuenta/laboratorio correspondiente y elegir una región. Registrar la región; usarla para Cognito y Gateway.
2. Abrir **Amazon Cognito → User pools → Create user pool**. El asistente puede aparecer como “Create application”. Elegir aplicación **Single-page application (SPA)** y nombre `Cloud-faro-web`.
3. Elegir identificador de inicio de sesión **Username** para poder usar `admin-demo`, `editor-demo` y `user-demo`. Si se elige email en cambio, ingresar ese correo en el formulario React.
4. Para esta demo, no añadir atributos obligatorios adicionales. Si el asistente requiere email, rellenarlo al crear cada usuario.
5. Nombre del pool: `Cloud-faro-academico`. Desactivar autorregistro si solo se crearán cuentas desde consola. Para los usuarios de esta demo seleccionar **No MFA**; el frontend no implementa SMS/TOTP.
6. Crear y anotar **User Pool ID**. No confundirlo con App Client ID ni con un Identity Pool. Esta aplicación no requiere Identity Pool.

Los nombres de algunas secciones pueden variar con el idioma y la versión del asistente. La configuración que debe quedar es la indicada. [Asistente oficial de Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/getting-started-user-pools-application.html).

## 4. Configurar App Client

1. Dentro del pool abrir **Applications → App clients** (o **App integration → App clients**) y seleccionar el cliente creado por el asistente, o crear `Cloud-faro-spa`.
2. Confirmar **sin client secret**. Si el cliente tiene secret, crear otro cliente público; nunca incluir el secret en React.
3. En configuración de autenticación habilitar `ALLOW_USER_SRP_AUTH` y `ALLOW_REFRESH_TOKEN_AUTH`.
4. Mantener **refresh token rotation desactivado** para el SDK y flujo usados aquí. No activar desafíos personalizados ni seguimiento obligatorio de dispositivos para la demo.
5. Anotar **App Client ID**. Este identificador se usará en frontend, backend y audience de Gateway.
6. Este formulario autentica con SDK/SRP: no necesita Hosted UI, dominio Cognito ni callback OAuth. Si el asistente ofrece una Return URL opcional, se puede omitir. No reemplazar el código por el ejemplo OIDC que sugiera la consola.

[Opciones del App Client](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_CreateUserPoolClient.html). La rotación usa otro mecanismo de renovación y requiere adaptar este cliente: [refresh tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-refresh-token.html).

## 5. Crear grupos y tres usuarios

1. **User management → Groups → Create group**: crear exactamente `ADMIN`, `EDITOR` y `USER`. No agregar el prefijo `ROLE_`; Spring lo agrega. No hace falta asociar roles IAM a estos grupos.
2. **Users → Create user**: crear `admin-demo`, `editor-demo`, `user-demo`. Completar los atributos requeridos. Elegir contraseñas temporales que cumplan la política del pool; guardar las credenciales fuera del repositorio.
3. En cada grupo, **Add users**, asignar únicamente la cuenta correspondiente. Para comprobar permisos, no poner USER/EDITOR también en ADMIN.
4. Al primer login desde React, usar la contraseña temporal. La pantalla pedirá una nueva contraseña y su confirmación. Al completar el desafío, Cognito confirmará la cuenta y emitirá los tokens.
5. Si aparece que faltan atributos obligatorios, completarlos en el perfil del usuario en Cognito. Si la contraseña temporal venció, restablecerla desde consola.
6. Si cambian grupos de una cuenta, cerrar sesión y entrar otra vez para obtener un token con los grupos actualizados.

[Grupos de Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html) y [usuarios creados por un administrador](https://docs.aws.amazon.com/cognito/latest/developerguide/how-to-create-user-accounts.html).

## 6. Rellenar las variables locales

Anotar estos tres valores (son identificadores, no claves AWS):

| Dato | Ejemplo de forma, reemplazar |
|---|---|
| Región | `us-east-1` |
| User Pool ID | `us-east-1_XXXXXXXXX` |
| App Client ID | `xxxxxxxxxxxxxxxxxxxxxxxxxx` |

Construir el issuer con región y pool: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX`. No usar el dominio de Hosted UI ni un ARN.

En `frontend`, copiar `.env.example` a `.env` y completar:

```dotenv
VITE_API_BASE_URL=http://localhost:8081/api
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

En PowerShell, **cuando decidan iniciar el backend**, desde `backend`:

```powershell
$env:COGNITO_ISSUER_URI='https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX'
$env:COGNITO_CLIENT_ID='xxxxxxxxxxxxxxxxxxxxxxxxxx'
mvn spring-boot:run
```

Spring no carga `backend/.env` automáticamente. El archivo `.env.example` es una referencia: las variables deben existir en la terminal de Maven. Se crea `productos_db.db` dentro de `backend` si se ejecuta desde allí.

En otra terminal, **cuando decidan iniciar React**, desde `frontend`:

```powershell
npm run dev
```

Abrir `http://localhost:3000/login`. Si cambian `.env`, detener y volver a iniciar Vite. No usar 127.0.0.1 ni otro puerto: el origen CORS configurado es exactamente `http://localhost:3000`.

## 7. Comprobar primero React → Spring

1. Abrir `http://localhost:8081/api/public/info`: debe responder JSON sin login.
2. Entrar como ADMIN. Crear `Cuaderno`, descripción `Producto de demo`, precio `1990.50`, stock `10`.
3. Editarlo; revisar la lista y eliminarlo. Crear otro para comprobar persistencia después.
4. Cerrar sesión y entrar como USER: puede listar productos y enviar contacto; abrir `/admin/productos` directamente debe mostrar “Acceso denegado”.
5. Entrar como EDITOR: puede listar, enviar contacto y leer la bandeja; no puede administrar productos.
6. En DevTools → Network comprobar que las solicitudes protegidas llevan `Authorization: Bearer ...`. Usar access token, no ID token. No pegar JWTs completos en capturas compartidas.
7. Reiniciar manualmente Spring y verificar que el producto conservado sigue en SQLite. La base no se sube a Git.

## 8. Hacer que AWS alcance el backend

**La pauta propone localhost:8081 como integración, pero AWS no puede acceder al localhost de su PC.** Gateway necesita un destino HTTP accesible desde AWS. Mantener Spring en 8081 y usar una URL HTTPS temporal permite demostrar el flujo conservando los puertos exigidos. [Integraciones HTTP oficiales](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-http.html).

Si el docente admite túneles temporales, esta es una opción manual de demostración:

1. Instalar `cloudflared` siguiendo la [guía oficial](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/).
2. Con Spring iniciado por ustedes, abrir otra terminal y ejecutar únicamente cuando decidan exponer el backend:

```powershell
cloudflared tunnel --url http://localhost:8081
```

3. Copiar la URL HTTPS `https://...trycloudflare.com` que se muestra. Llamarla **BACKEND_PUBLIC_URL**.
4. Abrir `BACKEND_PUBLIC_URL/api/public/info` y verificar el JSON. Si falla, no seguir a Gateway hasta resolverlo.
5. Mantener la terminal abierta durante la demo. Al detener el túnel deja de estar disponible; una nueva ejecución suele generar otra URL y obliga a actualizar la integración.

Esto expone temporalmente el backend; Spring sigue exigiendo JWT en las rutas privadas. No iniciar ni reutilizar túneles de FARO. Si el docente no admite esta opción, acordar un backend alojado o integración privada VPC Link; no poner una dirección ficticia ni localhost en Gateway. Los Quick Tunnels son para desarrollo/pruebas y pueden ser incompatibles con un `config.yaml` preexistente en `.cloudflared`; no sobrescribir configuraciones ajenas. [Límites y uso](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/).

## 9. Crear HTTP API Gateway

1. AWS → **API Gateway → Create API → HTTP API → Build**. Nombre `Cloud-faro-http-api`.
2. Elegir integración **HTTP** con la URL base HTTPS de BACKEND_PUBLIC_URL; método de integración `ANY`.
3. Crear las siete rutas de la tabla del paso 11. Eliminar una ruta `$default` creada automáticamente si no se va a usar.
4. Elegir stage `$default` con auto-deploy para simplificar la URL. Registrar el **Invoke URL**: `https://API_ID.execute-api.REGION.amazonaws.com`.
5. En **Integrations**, editar la integración HTTP. En **Parameter mappings → Request**, agregar tipo **Path**, acción **Overwrite**, valor `$request.path` (equivalente a `overwrite:path`). Esto preserva `/api/...` y evita pasar el nombre del stage al backend.
6. Asociar esa integración a cada una de las siete rutas. Guardar. Si auto-deploy está desactivado, publicar manualmente los cambios al stage.

La integración reenvía la solicitud al origen; no crear un mapeo manual de Authorization, que es una cabecera reservada. [Mapeo de path y headers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-parameter-mapping.html).

## 10. Crear JWT Authorizer

1. **Authorization → Manage authorizers → Create**. Tipo **JWT**, nombre `Cloud-faro-cognito`.
2. Identity source: `$request.header.Authorization`.
3. Issuer URL: exactamente el issuer configurado en Spring, sin añadir rutas OAuth ni JWKS.
4. Audience: App Client ID de `Cloud-faro-spa`.
5. Guardar y asociar a todas las rutas privadas. En ellas añadir scope `aws.cognito.signin.user.admin`, que debe aparecer en los access tokens emitidos por el flujo SRP. Este scope **no** significa rol ADMIN del catálogo: el control de grupos lo hace Spring.

Cognito access tokens pueden usar `client_id` en vez de `aud`; el authorizer admite esa comprobación cuando no hay `aud`. [Validación JWT de Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html).

## 11. Revisar rutas y CORS

| Ruta de Gateway | Authorizer | Permiso aplicado por Spring |
|---|---|---|
| GET /api/public/info | NONE | Público |
| GET /api/products | JWT | ADMIN, EDITOR, USER |
| POST /api/products | JWT | ADMIN |
| PUT /api/products/{id} | JWT | ADMIN |
| DELETE /api/products/{id} | JWT | ADMIN |
| POST /api/contact | JWT | ADMIN, EDITOR, USER |
| GET /api/contact | JWT | ADMIN, EDITOR |

En **CORS → Configure** colocar:

| Campo | Valor |
|---|---|
| Allow origins | `http://localhost:3000` |
| Allow methods | GET, POST, PUT, DELETE, OPTIONS |
| Allow headers | Authorization, Content-Type |
| Allow credentials | Desactivado (se usa Bearer, no cookies) |
| Max age | 300 segundos, opcional |

Guardar. HTTP API responde automáticamente al preflight con CORS configurado. OPTIONS no debe requerir JWT. Si conservan una ruta `$default` con authorizer, añadir `OPTIONS /{proxy+}` sin autorización según la documentación; con las siete rutas explícitas y sin `$default`, no es necesario. [CORS de HTTP API](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html).

## 12. Conectar React al Gateway

1. Abrir `INVOKE_URL/api/public/info`; debe mostrar el mismo JSON de Spring.
2. En `frontend/.env`, cambiar solo:

```dotenv
VITE_API_BASE_URL=https://API_ID.execute-api.REGION.amazonaws.com/api
```

3. Para stage nombrado `demo`, usar `https://API_ID.execute-api.REGION.amazonaws.com/demo/api`. El paso 9 elimina ese prefijo antes de reenviar al backend.
4. Reiniciar manualmente React, iniciar sesión de nuevo y repetir las operaciones del paso 7.
5. En Network verificar que las peticiones de productos/contactos van a `execute-api`, no directamente a 8081. El login seguirá llamando a Cognito; es correcto.
6. Verificar OPTIONS, Bearer, respuestas 201/200/204, 401 sin token y 403 con rol insuficiente. Para provocar 403, usar un cliente HTTP con access token USER y POST `/api/products`; el frontend oculta esa acción, pero el backend también debe rechazarla.

Ejemplo de preflight para ejecutar manualmente en PowerShell (reemplazar URL):

```powershell
curl.exe -i -X OPTIONS 'https://API_ID.execute-api.REGION.amazonaws.com/api/products' -H 'Origin: http://localhost:3000' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: authorization,content-type'
```

Esperado: respuesta exitosa con `Access-Control-Allow-Origin: http://localhost:3000` y métodos/cabeceras permitidos.

## 13. Evidencias, informe Word y AVA

La pauta separa evaluación teórica (30%), código + informe (40%) y demo/exposición (30%). Registrar nombres de hasta tres integrantes. Fecha indicada: miércoles 30 de septiembre; comprobar horario final en AVA.

Crear ustedes un documento `.docx` con esta estructura:

1. Portada: asignatura, Actividad Sumativa Nº1, Cloud-faro, integrantes, docente y fecha.
2. Arquitectura: React → Cognito para login; React → Gateway → Spring CSR → SQLite para datos. Explicar el túnel si se usa.
3. Cognito: capturas legibles del pool/región, App Client sin secret, flujos SRP/refresh, tres grupos y usuarios asignados. Explicar qué identifica cada ID.
4. Gateway: capturas de authorizer (issuer/audience), siete rutas y autorizaciones, integración HTTP y path mapping, CORS y stage.
5. Pruebas: login, token con valores sensibles ocultos, catálogo, CRUD ADMIN, bloqueo USER/EDITOR, contacto, bandeja, 401, 403 y persistencia tras reinicio.
6. Explicación del ciclo JWT: emisión Cognito, almacenamiento en memoria, Bearer Axios, validación Gateway, firma/issuer/exp/client_id/token_use en Spring, conversión de grupos, renovación y cierre local.
7. Conclusiones y referencias oficiales.

Preparar el ZIP desde el código fuente, sin `node_modules`, `target`, `dist`, bases `.db`, `.env`, logs, claves ni `.git`. Incluir `package-lock.json` y `.env.example`. Adjuntar ZIP y Word en AVA según lo solicitado; conservar capturas reales. El Word con evidencias y la evaluación AWS no están completados por este proyecto.

Guion de demo: público → login ADMIN → crear/editar → login USER → lista/contacto y bloqueo → login EDITOR → bandeja → seguridad 401/403 → persistencia → explicación de CSR/JWT. Repartir la exposición y practicar ambas cuentas de desarrollo.

## 14. Diagnóstico rápido y cierre

| Síntoma | Qué revisar |
|---|---|
| Login solicita SECRET_HASH | Se creó App Client con secret; crear cliente público y actualizar IDs |
| USER_SRP_AUTH no habilitado | Flujos del App Client |
| Usuario no existe | Pool, región, identificador de login y cuenta creada |
| Contraseña temporal rechazada | Política/vencimiento; restablecer temporal en Cognito |
| 401 en Spring | Access token, issuer, client_id, token_use y hora del equipo |
| 401/403 en Gateway | Audience, issuer, scope y ruta con authorizer correcto |
| 403 en operaciones | Grupo exacto y token nuevo tras cambiar grupos |
| Error CORS | Origen exacto, preflight sin JWT, Authorization y Content-Type permitidos |
| 404 desde Gateway | `/api` duplicado/faltante o stage reenviado; revisar path mapping |
| 502/504 | Backend/túnel detenido o URL temporal antigua |
| Sesión desaparece al recargar | Esperado: tokens solo en memoria; volver a iniciar sesión |

Al terminar, detener manualmente React, Spring y el túnel con Ctrl+C en sus terminales. Revisar costos y eliminar solo los recursos académicos que ya no necesiten, después de guardar evidencias. No tocar recursos de FARO.
