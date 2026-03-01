Actúa como un desarrollador backend Senior experto en Node.js, TypeScript y arquitecturas de microservicios.
Tu tarea es inicializar un proyecto de Express con TypeScript diseñado para actuar como un wrapper del binario de sistema operativo ADB (Android Debug Bridge).

Ejecuta las siguientes acciones sin omitir detalles:
1. Genera los comandos de terminal necesarios para inicializar el `package.json` y el `tsconfig.json`.
2. Proporciona la lista exacta de dependencias y devDependencies para instalar (incluyendo express, dotenv, cors y sus respectivos @types).
3. Configura el `tsconfig.json` con `"strict": true`, `"target": "ES2022"`, y `"moduleResolution": "node"`.
4. Crea la estructura de carpetas: `/src/controllers`, `/src/middleware`, `/src/routes`, `/src/services`.
5. Proporciona el código para `src/index.ts` que levante el servidor en el puerto especificado en el archivo `.env` (por defecto 8000).

Ahora vamos a implementar el servicio de comunicación con el sistema operativo.
Crea el archivo `src/services/adb.service.ts`.

Requisitos estrictos de arquitectura:
1. Usa el módulo nativo `child_process` de Node.js, específicamente `exec` envuelto en una Promesa (utiliza `util.promisify(exec)`).
2. El servicio debe leer la IP del dispositivo desde `process.env.FIRE_TV_IP`.
3. Crea un método `connectDevice()` que ejecute `adb connect <IP>:5555`.
4. Crea un método `executeCommand(command: string)` que reciba argumentos, los concatene con `adb -s <IP>:5555 shell` y los ejecute.
5. Implementa un manejo de errores robusto. Si el comando de sistema operativo falla (stderr tiene contenido o hay un error de timeout), el servicio debe lanzar un error descriptivo de TypeScript, no fallar silenciosamente.

Implementa la capa de seguridad usando el patrón de Middleware.
Crea el archivo `src/middleware/auth.middleware.ts`.

Especificaciones de seguridad:
1. Lee una clave secreta desde `process.env.API_KEY`.
2. El middleware debe interceptar todas las peticiones entrantes e inspeccionar el header `x-api-key` (o `Authorization`).
3. Si el header no existe o no coincide exactamente con el valor en el `.env`, debe retornar inmediatamente un código HTTP 401 Unauthorized con un mensaje en formato JSON estándar.
4. Si la clave es válida, debe llamar a `next()` para permitir que la petición llegue al controlador.
Asegúrate de tipar correctamente los objetos Request, Response y NextFunction de Express.

Crea la capa de controladores y rutas para exponer el servicio ADB.

1. Crea `src/controllers/tv.controller.ts`:
   - Implementa un endpoint para forzar la conexión (`/connect`).
   - Implementa un endpoint para enviar eventos de teclado físicos (`/keyevent/:code`), donde `:code` es un número. Llama al método del servicio correspondiente (`input keyevent <code>`).
   - Implementa un endpoint para abrir aplicaciones (`/app/:package`), ejecutando `monkey -p <package> -c android.intent.category.LAUNCHER 1`.
   - Todos los controladores deben tener bloques try/catch que retornen un HTTP 500 con el mensaje de error del servicio ADB si algo falla.

2. Crea `src/routes/tv.routes.ts`:
   - Define las rutas de Express y conéctalas con los métodos del controlador.
   - **Crucial:** Aplica el middleware `auth.middleware.ts` creado en el paso anterior a TODAS las rutas de este archivo para protegerlas.

Para finalizar, genera los archivos de infraestructura para desplegar este microservicio.

1. Crea un `Dockerfile` optimizado:
   - Usa una imagen base oficial de Node.js ligera (ej. `node:20-slim`).
   - **Requisito del sistema operativo:** Usa `apt-get` para instalar el paquete `android-tools-adb`. Sin esto, el contenedor no podrá ejecutar los comandos.
   - Copia los archivos, compila el código TypeScript (`npm run build`) y expón el puerto adecuado. Define el comando de inicio para correr el código compilado en `/dist`.

2. Crea un `docker-compose.yml`:
   - Define el servicio, construye la imagen desde el Dockerfile y mapea el puerto 8000.
   - Define las variables de entorno `FIRE_TV_IP` y `API_KEY`.
   - **Arquitectura crítica:** Configura un volumen nombrado (`adb_keys`) y mapéalo a la ruta `/root/.android` dentro del contenedor. Esto es obligatorio para que el Fire TV no revoque la autorización RSA cada vez que el contenedor se reinicie.