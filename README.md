# 📺 Fire TV - Local ADB Microservice

Un microservicio ultraligero escrito en Node.js (Express + TypeScript) que funciona como un _wrapper_ asíncrono sobre el binario oficial de Android Debug Bridge (ADB).

Su propósito central es permitirte **controlar, automatizar y enviar comandos** a cualquier Fire TV Stick físico en tu red local utilizando peticiones HTTP REST simples.

---

## 🚀 Arquitectura y Decisiones de Diseño

- **100% Sin dependencias pesadas de ADB en Node:** Utiliza el binario nativo de linux `android-tools-adb` mediante `child_process.exec` para garantizar máxima velocidad y nula latencia.
- **Seguridad por API Key:** Todo el tráfico HTTP está bloqueado mediante un Middleware que exige el pase del header `x-api-key`.
- **Persistencia de Llaves RSA (Docker):** El problema número #1 al dockerizar ADB es la autorización RSA del TV. Este sistema mapea un _Docker Volume Named_ directamente a `/root/.android/` para que la autorización solo debas otorgarla con el control remoto del TV **una única vez** en la vida.
- **Red Host (Host Network):** El contenedor de Docker se lanza mediante `network_mode: "host"`. Esto es crucial para que ADB logre detectar el Fire TV a través del _broadcast_ de tu router en la red local.

---

## 🛠️ Requisitos Previos

Cualquier persona con este repositorio y un Fire TV asumiendo que ambos están conectados al mismo WiFi.
Necesitarás tener instalado en tu computadora o servidor local:

1. [Docker](https://docs.docker.com/get-docker/)
2. [Docker Compose](https://docs.docker.com/compose/install/)

---

## ⚙️ Paso 1: Configurar el Fire TV Stick (Obligatorio)

Para que el microservicio pueda hablar con el televisor, debes activar el modo desarrollador.

1. Navega en tu Fire TV a **Configuración** ➔ **Mi Fire TV** ➔ **Acerca de**.
2. Presiona el botón circular (Select) rápidamente **7 veces seguidas** sobre el nombre de tu Fire TV.
3. Volverás a ver una nueva opción llamada **Opciones para desarrolladores** en el menú anterior, entra allí.
4. Habilita el **Depurado ADB** (ADB Debugging).
5. Ve a **Configuración** ➔ **Red** (Network) y anota la **Dirección IP** de tu Fire TV (ej. `192.168.1.55`).

---

## 💻 Paso 2: Instalación y Arranque (Docker)

Descarga o clona este proyecto y entra en la carpeta:

```bash
# 1. Copia el archivo de entorno base
cp .env.example .env

# 2. Edita el archivo .env
# Pon la IP de tu Fire TV y define una API Key fuerte.
nano .env

# 3. Construye y levanta el microservicio en segundo plano (-d)
docker compose up -d --build
```

---

## 🔐 Paso 3: Autorizar la Conexión (El paso más importante)

La primera vez que arranques el servidor e intentes conectarte, la pantalla del Fire TV mostrará un popup advirtiendo "Aceptar depuración USB/Red de esta computadora".

Ejecuta este comando apuntando al servidor:

```bash
curl -X POST http://localhost:8000/tv/connect \
     -H "x-api-key: my_super_secret_api_key_123"
```

Inmediatamente mira tu televisor, selecciona la casilla de **"Permitir siempre desde esta computadora"** y presiona **Aceptar** con el control remoto.

_Nota:_ Gracias a la configuración del volumen de docker (`adb_keys:/root/.android/`), este diálogo **NO** te volverá a salir, incluso si reinicias el servidor o la computadora.

---

## 🔌 Referencia de la API (Endpoints)

Todas las rutas a la API (excepto el healthcheck) requieren tu contraseña en la cabecera `x-api-key`.

### 1. Health Check

Revisar si el contenedor está vivo.

```bash
curl http://localhost:8000/health
```

### 2. Conectar al TV

Útil si el Fire TV y el router perdieron conexión temporal.

```bash
curl -X POST http://localhost:8000/tv/connect \
     -H "x-api-key: my_super_secret_api_key_123"
```

### 3. Enviar un Comando (Key Event)

Simula que estás oprimiendo un botón físico del control remoto.

**Endpoint:** `POST /tv/keyevent/:code`

```bash
curl -X POST http://localhost:8000/tv/keyevent/3 \
     -H "x-api-key: my_super_secret_api_key_123"
```

**Códigos de Botones Comunes para Fire TV:**

- `3` : **HOME** (Te saca a la pantalla de inicio principal)
- `4` : **BACK** (Atrás)
- `19` : ARRIBA
- `20` : ABAJO
- `21` : IZQUIERDA
- `22` : DERECHA
- `23` : SELECT / ENTER (El círculo central)
- `85` : PLAY / PAUSE
- `89` : FAST FORWARD
- `88` : REWIND
- `24` : VOLUMEN ARRIBA
- `25` : VOLUMEN ABAJO
- `26` : POWER (Pone a dormir el televisor)

### 4. Abrir una Aplicación Específica por su Paquete

Abre una app de forma instantánea sin tener que navegar por los menús.

**Endpoint:** `POST /tv/app/:package_name`

```bash
curl -X POST http://localhost:8000/tv/app/com.netflix.ninja \
     -H "x-api-key: my_super_secret_api_key_123"
```

**Paquetes Comunes (Packages):**

- **Netflix:** `com.netflix.ninja`
- **YouTube:** `com.amazon.firetv.youtube`
- **Prime Video:** `com.amazon.avod`
- **Spotify:** `com.spotify.tv.android`
- **Twitch:** `tv.twitch.android.viewer`

---

## ⚡ API Avanzada (Fase 7)

### 5. Control Multimedia y Volumen

Controla la reproducción o el audio sin importar qué app esté encendida.

**Endpoint:** `POST /tv/media/:control`
_Acciones Válidas:_ `playpause`, `next`, `prev`, `volup`, `voldown`, `mute`.

```bash
curl -X POST http://localhost:8000/tv/media/volup \
     -H "x-api-key: my_super_secret_api_key_123"
```

### 6. Escribir Texto en Pantalla

Si estás en una barra de búsqueda del TV (como en YouTube), en lugar de usar el teclado en pantalla letra por letra, manda una cadena de texto directa.

**Endpoint:** `POST /tv/text`

```bash
curl -X POST http://localhost:8000/tv/text \
     -H "x-api-key: my_super_secret_api_key_123" \
     -H "Content-Type: application/json" \
     -d '{"text": "mi busqueda larga"}'
```

### 7. Control de Energía (Power)

Suspende (apaga la pantalla) o despierta el Fire TV de forma remota.

**Endpoint:** `POST /tv/power/:action`
_Acciones Válidas:_ `sleep`, `awake`, `toggle`.

```bash
curl -X POST http://localhost:8000/tv/power/sleep \
     -H "x-api-key: my_super_secret_api_key_123"
```

### 8. Abrir enlaces web (URLs)

Lanza el navegador web a una URL específica u obligatorya que una app capture el Deep Link nativamente.

**Endpoint:** `POST /tv/url`

```bash
curl -X POST http://localhost:8000/tv/url \
     -H "x-api-key: my_super_secret_api_key_123" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.google.com"}'
```

### 9. Asistente de Voz / Comandos Inteligentes (Alexa)

Si tienes algo complejo en mente, en lugar de interactuar con botones o aplicaciones, inyecta comandos semánticos y de texto directamente al motor global de Alexa / Android TV. (Requiere apretar Enter `keyevent 66` automáticamente luego de enviado, la API ya lo hace).

**Endpoint:** `POST /tv/alexa`

```bash
curl -X POST http://localhost:8000/tv/alexa \
     -H "x-api-key: my_super_secret_api_key_123" \
     -H "Content-Type: application/json" \
     -d '{"query": "reproduce the office en prime video"}'
```

### 10. Capturar la Pantalla (Screenshot)

Descarga la imagen en vivo del televisor directamente a tu computadora central en formato binario.

**Endpoint:** `GET /tv/screenshot`

```bash
curl -X GET http://localhost:8000/tv/screenshot \
     -H "x-api-key: my_super_secret_api_key_123" \
     --output mi_captura.png
```

---

## ⚠️ Troubleshooting (Solución de problemas)

- **Connection Refused:** Significa que el Fire TV no tiene el "ADB Debugging" activado, o que la IP configurada en `.env` es incorrecta.
- **Unauthorized / Device Offline:** Significa que no aceptaste el "Prompt" que salió en la pantalla del televisor. Chequea que hayas marcado la casilla de "recordar siempre" o intenta reiniciar el TV.
- **Network Error / No Route to Host:** Tu computadora servidor y el televisor están en dos redes WiFi/VLAN distintas y no se pueden ver. Ambos deben estar en el mismo espectro local (ej. 192.168.1.X).
