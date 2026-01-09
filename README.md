# Microservice Bank Statements

[![Build and Push Docker Image](https://github.com/BancUS-FISProject/microservice-bank-statements/actions/workflows/docker-build-push.yml/badge.svg)](https://github.com/BancUS-FISProject/microservice-bank-statements/actions)
[![Run Tests](https://github.com/BancUS-FISProject/microservice-bank-statements/actions/workflows/test.yml/badge.svg)](https://github.com/BancUS-FISProject/microservice-bank-statements/actions)

Microservicio para gestionar estados de cuenta bancarios con generación automatizada mensual de transacciones.

## ✨ Características principales

- **Generación automática mensual**: Cron job que genera estados de cuenta el **día 1 de cada mes** con transacciones del mes anterior
- **Generación manual del mes actual**: Endpoint POST que consume transacciones del mes en curso desde el microservicio de transferencias
- **Estrategia configurable**: Soporte para estrategias `http` (producción) y `mock` (desarrollo/testing)
- **Autenticación JWT**: Middleware que extrae y valida datos del usuario desde tokens
- **Validación de Valores**: Ejemplo validación robusta de IBAN (ES + 22 dígitos)
- **CI/CD**: Pipeline automatizado con GitHub Actions, tests y despliegue en Docker Hub
- **OpenAPI**: Documentación completa de la API en formato OpenAPI 3.0

## 📋 Requisitos

- Node.js >= 24
- MongoDB 7+
- Docker / Docker Compose (recomendado para despliegue)

## Configuración e instalación

### Variables de entorno

Crear archivo `.env` con la siguiente configuración:

```bash
# Puerto del servidor
PORT=3000

# Entorno (development, production)
NODE_ENV=development

# Conexión MongoDB
MONGO_URI=mongodb://localhost:27017/bankstatements

# Estrategia de microservicios (http | mock)
MS_STRATEGY=http

# Endpoints de microservicios (para estrategia http)
STRATEGIES_HTTP_ACCOUNTS_BASE=http://microservice-accounts:8000
STRATEGIES_HTTP_TRANSACTIONS_BASE=http://microservice-transfers:8000
```

### Instalación local

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run dev

# Producción
npm start
```

### Docker Compose

```bash
# Levantar servicio con MongoDB
docker compose up -d --build

# Ver logs
docker compose logs -f

# Detener
docker compose down
```
##  Arquitectura del proyecto

```
src/
├── bank-statements/
│   ├── router.js                    # Definición de rutas y middlewares
│   ├── controllers/
│   │   └── bankStatementsController.js  # Handlers HTTP
│   ├── services/
│   │   └── bankStatementsService.js     # Lógica de negocio
│   └── repositories/
│       └── bankStatementsRepository.js  # Capa de persistencia MongoDB
├── db/
│   ├── index.js                     # Conexión a MongoDB
│   └── models/
│       └── bankStatement.js         # Schema Mongoose
├── lib/
│   ├── ms/                          # Estrategias de comunicación entre microservicios
│   │   ├── index.js                 # Factory de estrategias
│   │   └── strategies/
│   │       ├── http.js              # Estrategia HTTP real
│   │       └── mock.js              # Estrategia Mock para desarrollo
│   └── scheduler/
│       └── bankStatementsCron.js    # Cron job para generación mensual
├── middleware/
│   ├── auth.js                      # Extractor y validador JWT
│   └── validate.js                  # Middleware de validación Joi
├── validators/
│   └── bankStatementsValidators.js  # Schemas de validación
├── config.js                        # Configuración centralizada
└── server.js                        # Configuración Express
```

### Patrón de diseño

El proyecto sigue una arquitectura en capas:

1. **Router**: Define endpoints y aplica middlewares (auth, validación)
2. **Controller**: Maneja requests/responses HTTP
3. **Service**: Contiene la lógica de negocio
4. **Repository**: Abstrae la persistencia de datos
5. **Models**: Define esquemas de MongoDB con Mongoose

##  API Endpoints

**Base URL**: `/v1/bankstatements`

###  Endpoints disponibles

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check del servicio | No |
| `GET` | `/by-iban/:iban` | Listar todos los meses disponibles para un IBAN | Sí |
| `GET` | `/by-iban?iban=...&month=YYYY-MM` | Obtener estado de cuenta específico por IBAN y mes | Sí |
| `GET` | `/:id` | Obtener estado de cuenta por ID de MongoDB | No |
| `POST` | `/generate` | Generación bulk/single de estados de cuenta | No |
| `POST` | `/generate-current` | **Generar estado de cuenta del mes actual** | Sí |
| `DELETE` | `/:id` | Eliminar estado de cuenta por ID | No |
| `PUT` | `/account/:iban/statements` | Reemplazar todos los statements de una cuenta | No |

###  Endpoint destacado: Generación del mes actual

**`POST /v1/bankstatements/generate-current`**

Genera automáticamente el estado de cuenta del mes en curso consumiendo transacciones del microservicio externo.

**Características:**
- Consume `GET /v1/transactions/user/{iban}` del servicio de transacciones
- Filtra automáticamente las transacciones del mes actual
- Calcula totales de ingresos y egresos
- Muestra el posible balance
- Previene duplicados (verifica si ya existe statement para el mes)
- Requiere autenticación JWT

**Request:**
```bash
POST /v1/bankstatements/generate-current
Authorization: Bearer <token>
Content-Type: application/json

{
  "iban": "ES1111111111111111111111"
}
```

**Response exitosa (201):**
```json
{
  "message": "Estado de cuenta generado exitosamente",
  "created": true,
  "statement": {
    "_id": "678c7f2e8d9a1b2c3d4e5f6g",
    "account": {
      "iban": "ES1111111111111111111111",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "year": 2026,
    "month": 1,
    "date_start": "2026-01-01T00:00:00.000Z",
    "date_end": "2026-01-31T23:59:59.999Z",
    "transactions": [...],
    "total_incoming": 2500.50,
    "total_outgoing": 1200.00
  }
}
```

**Response si ya existe (200):**
```json
{
  "message": "El estado de cuenta ya existe",
  "created": false,
  "statement": {...}
}
```

 Ver más ejemplos en [bankstatements.http](bankstatements.http)

## 🧪 Testing

El proyecto cuenta con **19 tests** usando Jest + Supertest:
- **8 pruebas internas**: Tests de integración sin servidor real
- **11 pruebas externas**: Tests contra servidor en ejecución

```bash
# Ejecutar todos los tests
npm test

# Solo tests internos (no requiere servidor)
npm run test:internal

# Solo tests externos (requiere servidor en http://localhost:3000)
npm run test:external

# Con reporte de cobertura
npm test -- --coverage
```


### Estrategia de microservicios

El sistema soporta dos estrategias configurables mediante `MS_STRATEGY`:

- **`http`**: Comunicación real con microservicios externos (producción)
- **`mock`**: Datos simulados para desarrollo y testing


## 📊 Modelo de datos

### BankStatement Schema

```javascript
{
  account: {
    iban: String,           // IBAN español: ES + 22 dígitos
    name: String,           // Nombre del titular
    email: String           // Email del titular
  },
  date_start: Date,         // Inicio del período (primer día del mes)
  date_end: Date,           // Fin del período (último día del mes)
  transactions: [{
    date: Date,             // Fecha de la transacción
    amount: Number,         // Monto (positivo: ingreso, negativo: egreso)
    currency: String,       // Moneda (ej: "EUR")
    description: String,    // Descripción de la transacción
    type: String           // Tipo: "incoming" o "outgoing"
  }],
  total_incoming: Number,   // Total de ingresos del período
  total_outgoing: Number,   // Total de egresos del período
  year: Number,             // Año del estado de cuenta
  month: Number,            // Mes del estado de cuenta (1-12)
  createdAt: Date,          // Timestamp de creación (auto)
  updatedAt: Date           // Timestamp de actualización (auto)
}
```

**Índices:**
- Único compuesto: `{ 'account.iban': 1, year: 1, month: 1 }` (previene duplicados)

## 🔐 Autenticación y autorización

### JWT Token

El servicio utiliza JWT para autenticación. El middleware `auth.js` extrae el token del header `Authorization: Bearer <token>`.

**Payload esperado del token:**
```javascript
{
  id: String,              // ID único del usuario
  name: String,            // Nombre completo
  email: String,           // Email
  iban: String,            // IBAN del usuario
  phoneNumber: String,     // Teléfono
  subscription: String     // Tipo de suscripción
}
```

**Nota:** El API Gateway es responsable de verificar y validar el token. Este microservicio solo lo decodifica y extrae los datos del usuario.

##  Cron Job - Generación automática

El servicio ejecuta un cron job configurado para ejecutarse el **día 1 de cada mes a las 00:01**:

```javascript
// Patrón cron: '1 0 1 * *'
// Minuto 1, Hora 0, Día 1, Todos los meses
```

**Proceso:**
1. Consulta todas las cuentas activas desde el microservicio de cuentas
2. Para cada cuenta, obtiene las transacciones del mes anterior
3. Filtra transacciones por fecha del mes pasado
4. Calcula totales de ingresos y egresos
5. Crea el estado de cuenta en MongoDB
6. Envía notificación al usuario sobre el nuevo statement

Ver implementación en [src/lib/scheduler/bankStatementsCron.js](src/lib/scheduler/bankStatementsCron.js)


##  Docker

### Build local

```bash
# Build de la imagen
docker build -t microservice-bank-statements .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env microservice-bank-statements
```

### Docker Compose

```bash
# Iniciar servicios (app + MongoDB)
docker compose up -d --build

# Ver logs
docker compose logs -f microservice-bank-statements

# Detener servicios
docker compose down

# Detener y eliminar volúmenes
docker compose down -v
```

### Docker Hub

Imagen publicada en: `edithct/microservice-bank-statements`

```bash
# Pull de la imagen
docker pull edithct/microservice-bank-statements:latest

# Tag y push (para mantenedores)
docker tag microservice-bank-statements edithct/microservice-bank-statements:1.0.0
docker push edithct/microservice-bank-statements:1.0.0

```

##  Documentación adicional

- **OpenAPI Spec**: [openapi/bank-statements.yaml](openapi/bank-statements.yaml)
- **Ejemplos de requests**: [bankstatements.http](bankstatements.http)
- **Scripts de testing**: [test-endpoints.sh](test-endpoints.sh), [test-simple.sh](test-simple.sh)

### Ver documentación OpenAPI

```bash
# Servidor de documentación local
npm run openapi

# Abrir en navegador
# http://localhost:8081
```

##  Tecnologías utilizadas

- **Runtime**: Node.js 24
- **Framework**: Express 5
- **Base de datos**: MongoDB 7 con Mongoose
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: Joi
- **Cron jobs**: node-cron
- **HTTP Client**: Axios
- **Testing**: Jest + Supertest
- **Documentación**: OpenAPI 3.0 + Swagger UI
- **Containerización**: Docker + Docker Compose

##  CI/CD

El proyecto utiliza GitHub Actions para:

1. **Tests automáticos** en cada push/PR
2. **Build y push** de imagen Docker a Docker Hub
3. **Validación** de código y dependencias

Workflows:
- [.github/workflows/test.yml](.github/workflows/test.yml)
- [.github/workflows/docker-build-push.yml](.github/workflows/docker-build-push.yml)

## Scripts disponibles

```bash
npm start          # Iniciar servidor en producción
npm run dev        # Iniciar con hot-reload (nodemon)
npm test           # Ejecutar todos los tests
npm run test:internal    # Tests sin servidor
npm run test:external    # Tests con servidor
npm run openapi    # Servidor de documentación OpenAPI
```

## Autora

**Edith Esther Cáceres Tafur**

- GitHub: [@BancUS-FISProject](https://github.com/BancUS-FISProject)
- Repositorio: [microservice-bank-statements](https://github.com/BancUS-FISProject/microservice-bank-statements)


