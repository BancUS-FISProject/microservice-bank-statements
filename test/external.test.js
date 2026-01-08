const fetchFn =
    global.fetch ||
    ((...args) => import('node-fetch').then(m => m.default(...args)));

const BASE_URL = process.env.BANK_STATEMENTS_BASE_URL || 'http://127.0.0.1:3000';
const API_PREFIX = '/v1/bankstatements';
const testAccountId = 'test-account-123';
const testIban = 'ES1111111111111111111111';
const testJWTToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJuYW1lIjoiVXNlciAxIiwiZW1haWwiOiJ1c2VyMUBleGFtcGxlLmNvbSIsImlibmFuIjoiRVMxMTExMTExMTExMTExMTExMTExMTExIiwicGhvbmVOdW1iZXIiOiIrMzQ2MDEwMDAwMDEiLCJzdWJzY3JpcHRpb24iOiJiYXNpY28iLCJpYXQiOjE3Njc3ODIzNTZ9.test';
let createdStatementId = null;
let apiAvailable = true;

// Damos tiempo al servidor para que responda
jest.setTimeout(20000);

// Helper para hacer peticiones HTTP y parsear JSON de forma segura
async function http(method, path, body, includeAuth = true) {
    if (!apiAvailable) {
        // Si ya sabemos que no hay API, devolvemos un objeto vacío.
        return { status: 0, json: async () => ({}) };
    }

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (includeAuth) {
            headers['Authorization'] = `Bearer ${testJWTToken}`;
        }
        const res = await fetchFn(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        return res;
    } catch (err) {
        apiAvailable = false;
        // Como ya ha fallado por la URL, mandamos este aviso
        console.warn(
            `\n[EXTERNAL TESTS] No se ha podido conectar con ${BASE_URL}. ` +
            'Se omiten los tests externos (solo se ejecutan los internos).\n' +
            `Error: ${err}`
        );
        return { status: 0, json: async () => ({}) };
    }
}

function skipIfNoApi() {
    if (!apiAvailable) {
        console.warn(
            '[EXTERNAL TESTS] Servicio no disponible, este test externo se omite.'
        );
        return true;
    }
    return false;
}

describe('Bank Statements API – tests externos (servicio real)', () => {
    it('GET / devuelve status ok', async () => {
        const res = await http('GET', '/');

        if (skipIfNoApi()) return;

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('status', 'ok');
    });

    it('GET /health devuelve status ok', async () => {
        const res = await http('GET', '/health');

        if (skipIfNoApi()) return;

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('status', 'ok');
    });

    it('POST /v1/bankstatements/generate-current crea un statement del mes actual', async () => {
        const res = await http('POST', `${API_PREFIX}/generate-current`, {
            iban: testIban
        });

        if (skipIfNoApi()) return;

        // Puede ser 201 (creado), 200 (ya existe), 404 (sin transacciones) o 502 (error servicio)
        expect([200, 201, 404, 502]).toContain(res.status);
        const body = await res.json();

        if (res.status === 201) {
            expect(body).toHaveProperty('created', true);
            expect(body).toHaveProperty('statement');
            expect(body.statement).toHaveProperty('_id');
            createdStatementId = body.statement._id;
        } else if (res.status === 200) {
            expect(body).toHaveProperty('existing', true);
            expect(body).toHaveProperty('statement');
        }
    });

    it('GET /v1/bankstatements/by-iban/:iban devuelve meses disponibles', async () => {
        const res = await http('GET', `${API_PREFIX}/by-iban/${testIban}`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('months');
        expect(Array.isArray(body.months)).toBe(true);
    });

    it('GET /v1/bankstatements/:id devuelve el statement creado', async () => {
        if (!createdStatementId) {
            console.warn('[EXTERNAL TESTS] No hay statement creado, se omite este test.');
            return;
        }

        const res = await http('GET', `${API_PREFIX}/${createdStatementId}`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('detail');
        expect(body.detail).toHaveProperty('_id', createdStatementId);
    });

    it('GET /v1/bankstatements/by-iban con IBAN inválido devuelve 400', async () => {
        const res = await http('GET', `${API_PREFIX}/by-iban?iban=INVALID&month=2025-11`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toHaveProperty('error');
    });

    it('GET /v1/bankstatements/by-iban con IBAN válido pero no existente devuelve 404', async () => {
        const nonExistentIban = 'ES9999999999999999999999';
        const res = await http('GET', `${API_PREFIX}/by-iban/${nonExistentIban}`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body).toHaveProperty('error');
    });

    it('PUT /v1/bankstatements/account/:accountId/statements reemplaza statements', async () => {
        const res = await http('PUT', `${API_PREFIX}/account/${testAccountId}/statements`, [
            {
                account: {
                    iban: testIban,
                    name: 'Cuenta Test',
                    email: 'test@example.com',
                },
                date_start: '2025-10-01T00:00:00.000Z',
                date_end: '2025-10-31T23:59:59.999Z',
                transactions: [
                    {
                        date: '2025-10-10T12:00:00.000Z',
                        amount: 100,
                        currency: 'EUR',
                        description: 'Test transaction',
                    },
                ],
                total_incoming: 100,
                total_outgoing: 0,
                year: 2025,
                month: 10,
            },
        ]);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('updated', true);
    });

    it('DELETE /v1/bankstatements/:id elimina statement por ID', async () => {
        if (!createdStatementId) {
            console.warn('[EXTERNAL TESTS] No hay statement creado, se omite este test.');
            return;
        }

        const res = await http('DELETE', `${API_PREFIX}/${createdStatementId}`);

        if (skipIfNoApi()) return;

        expect([200, 404]).toContain(res.status);
    });

    it('DELETE /v1/bankstatements/:id con ID inválido devuelve 400', async () => {
        const res = await http('DELETE', `${API_PREFIX}/INVALID_ID`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(400);
    });

    it('GET /v1/bankstatements/:id devuelve 404 después del borrado', async () => {
        if (!createdStatementId) {
            console.warn('[EXTERNAL TESTS] No hay statement creado, se omite este test.');
            return;
        }

        const res = await http('GET', `${API_PREFIX}/${createdStatementId}`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(404);
    });
});
