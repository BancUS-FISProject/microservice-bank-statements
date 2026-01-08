# Microservice Bank Statements

[![Build and Push Docker Image](https://github.com/BancUS-FISProject/microservice-bank-statements/actions/workflows/docker-build-push.yml/badge.svg)](https://github.com/BancUS-FISProject/microservice-bank-statements/actions)
[![Run Tests](https://github.com/BancUS-FISProject/microservice-bank-statements/actions/workflows/test.yml/badge.svg)](https://github.com/BancUS-FISProject/microservice-bank-statements/actions)

Microservicio para gestionar estados de cuenta bancarios con generación automatizada mensual de transacciones.

## Características

- **Generación automática**: Los estados de cuenta se generan el **día 1 de cada mes** con las transacciones del **mes anterior**
- **Generación manual del mes actual**: Endpoint POST que consume transacciones y genera estados de cuenta del mes en curso
- **Autenticación JWT**: Middleware opcional que extrae datos del usuario desde el token
- **Validación IBAN**: Validación de IBANs españoles (ES + 22 dígitos)
- **CI/CD**: GitHub Actions con tests automáticos
- **Mock data**: Transacciones de prueba para desarrollo (mes actual y anterior)

## 📋 Requisitos

- Node.js >= 24
- MongoDB 7+
- Docker / Docker Compose (opcional)

## ⚡ Inicio rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (.env)
PORT=3000
MONGO_URI=mongodb://localhost:27017/bankstatements

# Desarrollo
npm run dev

# Docker
docker compose up -d --build
```

## 📡 API Endpoints

**Base URL**: `/v1/bankstatements`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Health check del servicio |
| `GET` | `/by-iban/:iban` | Listar meses disponibles para un IBAN |
| `GET` | `/by-iban?iban=...&month=YYYY-MM` | Obtener statement específico por IBAN y mes |
| `GET` | `/:id` | Obtener statement por ID de MongoDB |
| `POST` | `/generate` | Generar statements (bulk o single) |
| `POST` | `/generate-current` | **🆕 Generar estado de cuenta del mes actual** |
| `DELETE` | `/:id` | Eliminar statement por ID |
| `PUT` | `/account/:iban/statements` | Reemplazar statements de una cuenta |

### 🆕 Generación de Estado de Cuenta del Mes Actual

El endpoint `POST /v1/bankstatements/generate-current` consume el servicio de transacciones (`GET /v1/transactions/user/{iban}`) y genera un estado de cuenta del mes actual:

- **Consume** transacciones del microservicio externo
- **Filtra** solo las transacciones del mes en curso
- **Calcula** totales de entradas/salidas automáticamente
- **Persiste** el estado de cuenta en MongoDB
- **Previene duplicados**: Verifica si ya existe un statement para el mes actual
- **Envía notificación** al usuario (si el servicio está disponible)

**Ejemplo de uso:**

```bash
POST /v1/bankstatements/generate-current
Content-Type: application/json

{
  "iban": "ES1111111111111111111111"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Estado de cuenta generado exitosamente",
  "created": true,
  "statement": {
    "_id": "...",
    "account": { "iban": "...", "name": "...", "email": "..." },
    "year": 2026,
    "month": 1,
    "transactions": [...],
    "total_incoming": 1500.50,
    "total_outgoing": 800.00
  }
}
```

Ver ejemplos de uso en [bankstatements.http](bankstatements.http)

## 🧪 Testing

**19 tests** usando Jest + Supertest:
- **8 pruebas internas**: Integración sin servidor
- **11 pruebas externas**: Contra servidor real

```bash
# Todas las pruebas
npm test

# Solo internas
npm run test:internal

# Solo externas (requiere servidor en http://localhost:3000)
npm run test:external

# Con cobertura
npm test -- --coverage
```

## Arquitectura

```
src/
├── bank-statements/
│   ├── router.js          # Rutas y validaciones
│   ├── controllers/       # Handlers HTTP
│   ├── services/          # Lógica de negocio
│   └── repositories/      # Persistencia MongoDB
├── db/
│   └── models/
│       └── bankStatement.js  # Schema Mongoose
├── middleware/
│   ├── auth.js            # Extractor JWT
│   └── validate.js        # Validador Joi
├── validators/            # Schemas de validación
└── lib/
    └── scheduler/
        └── bankStatementsCron.js  # Cron mensual
```

## Modelo de datos

**BankStatement**:
```javascript
{
  account: {
    iban: String,           // ES + 22 dígitos
    name: String,
    email: String
  },
  date_start: Date,         // Inicio del mes
  date_end: Date,           // Fin del mes
  transactions: [{
    date: Date,
    amount: Number,
    currency: String,
    description: String
  }],
  total_incoming: Number,   // Total recibido
  total_outgoing: Number,   // Total enviado
  year: Number,
  month: Number             // 1-12
}
```

## Autenticación

JWT opcional extraído de `Authorization: Bearer <token>`:
```javascript
// Payload esperado
{
  id: String,
  name: String,
  email: String,
  iban: String,
  phoneNumber: String,
  subscription: String
}
```

El API Gateway verifica el token; el microservicio solo lo decodifica.

## Docker

```bash
# Build y tag
docker compose build
docker tag microservice-bank-statements edithct/microservice-bank-statements:1.1.0

# Push a Docker Hub
docker push edithct/microservice-bank-statements:1.1.0
docker push edithct/microservice-bank-statements:latest
```

## Autora

**Edith Esther Cáceres Tafur**  
Repositorio: [github.com/BancUS-FISProject/microservice-bank-statements](https://github.com/BancUS-FISProject/microservice-bank-statements)
