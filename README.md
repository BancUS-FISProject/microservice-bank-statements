# Microservice of Bank Statements

Pequeño microservicio para gestionar estados de cuenta y transacciones.

Contenido rápido
- Servidor Express (CommonJS) en `src/server.js`.
- Rutas y lógica en `src/bank-statements/` (router, controllers, services, repositories).
- Conexión a MongoDB con Mongoose en `src/db/` y modelos en `src/db/models`.

Requisitos
- Node.js >= 24 (recomendado actualizar a >=18/20 para compatibilidad plena con las versiones de las dependencias)
- Docker / Docker Compose (opcional)

Instalación local
1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno: crear `.env` en la raíz (ya existe un `.env` de ejemplo mínimo) con al menos:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/bankstatements
```

3. Ejecutar en desarrollo (usa `nodemon`):

```bash
npm run dev
```

Ejecución con Docker Compose (desarrollo)
1. Levantar servicios (app + mongo):

```bash
docker compose up -d --build
```

2. Ver logs:

```bash
docker compose logs -f app
docker compose logs -f mongo
```

Arquitectura / archivos importantes
- `src/bank-statements/router.js` — define endpoints:
	- GET  /v1/bankstatemens/by-account/:accountId  — listar estados por cuenta (acepta query params `from` y `to`). Devuelve solo id, date_start y date_end y añade `month_name` calculado desde `date_start`. Solo devuelve registros cuyo `date_end` sea anterior a la fecha actual.
	- GET  /v1/bankstatemens/:id — obtener detalle por id.
	- POST /v1/bankstatemens/transaction — registrar una transacción (actualmente crea un documento — ver `services` y `repositories`).
- `src/bank-statements/controllers` — controladores HTTP.
- `src/bank-statements/services` — lógica de negocio (usa el repositorio).
- `src/bank-statements/repositories` — persistencia (usa Mongoose).
- `src/db/models/bankStatement.js` — modelo `BankStatement` con campos:
	- `account_id` (String)
	- `date_start` (Date)
	- `date_end` (Date)
	- `transactions` (Array of { date, amount, type, description })
- `src/db/models/monthInterval.js` — modelo `MonthInterval` con:
	- `month` (Number), `date_start`, `date_end`, `year`.

Archivo de pruebas (REST Client)
- `bankstatements.http` contiene ejemplos para probar los endpoints desde la extensión REST Client de VS Code.

Pruebas con REST Client
- Abre `bankstatements.http` en VS Code.
- Instala la extensión "REST Client" si no la tienes.
- Haz click en "Send Request" sobre cualquiera de las peticiones para ejecutarla y ver la respuesta en el panel lateral.

Notas y recomendaciones
- Se creó un `.gitignore` para node, editores y artefactos.
- Las dependencias incluyen `express`, `dotenv`, `mongoose` y `nodemon` (dev).
- Si planeas producción, crear un Dockerfile/compose específico para production y usar `NODE_ENV=production`.

Problemas conocidos
- Algunas versiones de `mongoose` y `mongodb` requieren Node >= 18/20; con Node 16 aparecen advertencias de engine. Recomiendo actualizar Node para evitar incompatibilidades.

Contacto
- Repositorio: git@github.com:Edithct/microservice-bank-statements.git
