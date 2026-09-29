# GitHub independiente y trabajo en pareja

No se creó un repositorio remoto ni se invitó a nadie. Esta carpeta se entrega sin `.git`: los siguientes pasos crean su historial independiente cuando ustedes lo decidan.

## 1. Crear el repositorio remoto

En GitHub: **+ → New repository**, nombre `Cloud-faro`, visibilidad según lo solicitado por el docente (privado si aún no lo van a publicar). No usar importación de FARO. Dejar sin marcar README, `.gitignore` y licencia, porque el código ya contiene archivos de inicio. Crear y copiar su URL HTTPS.

[Crear un repositorio](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

## 2. Inicializar y subir solo Cloud-faro

Preferir una carpeta de trabajo propia, por ejemplo `C:/Users/pablo/Documents/Cloud-faro`, fuera de FARO. Extraer allí el ZIP fuente entregado; entrar a la carpeta que contiene **README.md, backend y frontend**. No ejecutar estos comandos en FARO ni en una carpeta padre de ambos proyectos.

```powershell
git init -b main
git rev-parse --show-toplevel
git remote -v
```

El primer resultado debe ser exactamente la carpeta nueva de Cloud-faro; `remote -v` debe estar vacío. Si hay identidad Git sin configurar, definirla solo en este repositorio:

```powershell
git config user.name 'TU NOMBRE'
git config user.email 'TU CORREO DE GITHUB'
git add .
git status --short
git diff --cached --stat
```

Revisar que no aparezcan `.env`, `.db`, contraseñas, claves, logs, dependencias instaladas ni builds. `.env.example` sí se incluye. Después:

```powershell
git commit -m "Base académica Cloud-faro"
git remote add origin https://github.com/TU_USUARIO/Cloud-faro.git
git push -u origin main
```

Reemplazar TU_USUARIO por el propietario real. Autenticarse con Git Credential Manager o el mecanismo de GitHub configurado; no escribir tokens en la URL remota ni en archivos del proyecto.

## 3. Invitar a la compañera

GitHub → repositorio → **Settings → Collaborators → Add people** → buscar su usuario → enviar invitación. Ella debe aceptarla. Si usan una organización, gestionar acceso con el equipo/permisos que corresponda. [Invitar colaboradores](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository).

Ella clona:

```powershell
git clone https://github.com/TU_USUARIO/Cloud-faro.git
cd Cloud-faro
cd frontend
npm ci
Copy-Item .env.example .env
```

Ambos completan sus variables locales con el mismo pool/cliente académico si usan la misma cuenta AWS. Compartir IDs está bien; las contraseñas se intercambian por un canal privado, nunca en issues ni commits. GitHub da acceso al código, no a la cuenta AWS: acordar por separado quién configura la consola y quién captura evidencias.

## 4. Flujo de trabajo sugerido

Antes de cada tarea:

```powershell
git switch main
git pull --ff-only
git switch -c feat/descripcion-corta
```

Trabajar en una tarea acotada, revisar el diff y ejecutar las comprobaciones aplicables. Para frontend: `npm test` y `npm run build` desde frontend, sin iniciar servidores. Para backend: `mvn test` desde backend.

```powershell
git add RUTA_DE_LOS_ARCHIVOS_CAMBIADOS
git commit -m "Describe el cambio"
git push -u origin feat/descripcion-corta
```

Abrir un Pull Request hacia `main`, pedir revisión a la compañera y fusionar tras verificar. No compartir una misma rama para cambios simultáneos ni usar force-push en main. Para actualizar una rama con main: guardar cambios, `git fetch origin`, `git merge origin/main`, resolver conflictos revisando el resultado y volver a probar.

Reparto práctico: una persona Cognito y usuarios, otra Gateway/CORS; ambas revisan las variables, permisos y el informe. Las páginas React están separadas en `src/pages` para reducir conflictos.

## 5. Criterio de listo para entrega

- README e instrucciones actualizados.
- Pruebas aprobadas; cada integrante entiende CSR y JWT.
- AWS configurado manualmente y demostrado con tres roles.
- Capturas reales e informe Word terminados.
- ZIP sin configuración privada ni datos de prueba.
- Ningún cambio, archivo ni remoto perteneciente a FARO.
