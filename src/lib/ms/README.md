MS helper con estrategias para llamadas síncronas a otros microservicios.

Cómo funciona
- Seleccionar estrategia mediante variable de entorno `MS_STRATEGY` ("mock" o "http"). Por defecto: mock.
- Endpoints configurables vía variables de entorno:
  - `ACCOUNTS_SERVICE_BASE` (por defecto http://localhost:4000)
  - `TRANSACTIONS_SERVICE_BASE` (por defecto http://localhost:4001)
  - `NOTIFICATIONS_SERVICE_BASE` (por defecto http://localhost:4002)

Exports
- `getAccount(id)` -> Promise resolving to account shape
- `getTransactions(accountId)` -> Promise resolving to array of transactions
- `sendNotification(payload)` -> Promise resolving to send result

Estrategias
- mock: retorna datos simulados y no requiere servicios externos.
- http: usa axios para hacer llamadas a los endpoints definidos en las vars de entorno.

Ejemplo rápido (desde la raíz del proyecto):
```bash
node -e "require('./lib/ms').getAccount('1').then(console.log)"
```
