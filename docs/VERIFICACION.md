# Verificación y alcance de la entrega

## Estado actual

Frontend conectado por código a los contratos del backend existente. Las variables de Cognito y API Gateway permanecen como ejemplos para completar manualmente. No se creó infraestructura ni repositorio GitHub. No se inicializó `.git` local en esta entrega; la guía indica cómo hacerlo en su carpeta independiente.

## Comprobaciones del frontend final

- 15 pruebas aprobadas con `npm test`: rutas por rol, token vencido sin bucle de redirección, contratos CRUD, envío y bandeja de contactos, desafío de contraseña temporal, sesión en memoria, renovación compartida, Bearer y manejo 401/403.
- Se usan Node test runner, jsdom y esbuild; no hay servidor de pruebas. El setup hace fallar cualquier intento de abrir un listener TCP/UDP.
- `npm run build` aprobado: genera archivos estáticos, no inicia Vite dev ni preview.
- Instalación npm final: 0 vulnerabilidades conocidas reportadas por npm en ese momento. No es una auditoría de seguridad completa.

Los SDK y API de las pruebas están simulados en memoria. No se han validado credenciales ni tráfico real contra una cuenta Cognito o Gateway. La prueba integral real queda para los pasos manuales de AWS.

## Backend existente, comprobado antes de la pausa

- 10 pruebas de integración aprobadas y `mvn clean verify` aprobado con JDK 17.0.20.1 portátil.
- Spring Boot 3.5.7, Hibernate 6.6.33.Final y SQLite JDBC 3.49.1.
- Antes de la pausa se comprobó respuesta pública y 401 sin JWT en localhost.
- Después de la instrucción de no ejecutar servidores, se cerraron únicamente los procesos iniciados por el asistente y no se volvieron a arrancar.
- No se realizaron nuevas modificaciones al backend en la fase final.

## Pendiente para ustedes

Cognito real, usuarios/grupos, integración HTTP alcanzable, authorizer, CORS, pruebas en navegador por roles, informe Word con capturas y carga en AVA. Las instrucciones están en AWS-MANUAL.md. El proyecto no se presenta como entrega universitaria final ya desplegada.
