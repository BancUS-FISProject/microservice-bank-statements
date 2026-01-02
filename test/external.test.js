const fetchFn =
    global.fetch ||
    ((...args) => import('node-fetch').then(m => m.default(...args)));

const BASE_URL = process.env.BANK_STATEMENTS_BASE_URL || 'http://127.0.0.1:3000';
const API_PREFIX = '/v1/bankstatemens';
const testAccountId = 'test-account-123';
const testIban = 'ES1234567890123456789012';
let createdStatementId = null;
let apiAvailable = true;

// Damos tiempo al servidor para que responda
jest.setTimeout(20000);

// Helper para hacer peticiones HTTP y parsear JSON de forma segura
async function http(method, path, body) {
    if (!apiAvailable) {
        // Si ya sabemos que no hay API, devolvemos un objeto vacío.
        return { status: 0, json: async () => ({}) };
    }

    try {
        const res = await fetchFn(`${BASE_URL}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
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

    it('POST /v1/bankstatemens/generate crea un statement con datos de prueba', async () => {
        const res = await http('POST', `${API_PREFIX}/generate`, {
            accountId: testAccountId,
            month: '2025-11',
            transactions: [
                {
                    sender: 'sender-test',
                    receiver: testAccountId,
                    amount: 150.0,
                    currency: 'EUR',
                    gmt_time: '2025-11-10T12:00:00Z',
                },
                {
                    sender: testAccountId,
                    receiver: 'receiver-test',
                    amount: 50.0,
                    currency: 'EUR',
                    gmt_time: '2025-11-15T14:00:00Z',
                },
            ],
        });

        if (skipIfNoApi()) return;

        expect(res.status).toBe(201);
        const body = await res.json();

        expect(body).toHaveProperty('created', true);
        expect(body).toHaveProperty('statement');
        expect(body.statement).toHaveProperty('_id');

        createdStatementId = body.statement._id;
    });

    it('GET /v1/bankstatemens/by-account/:accountId devuelve meses disponibles', async () => {
        const res = await http('GET', `${API_PREFIX}/by-account/${testAccountId}`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('months');
        expect(Array.isArray(body.months)).toBe(true);
    });

    it('GET /v1/bankstatemens/:id devuelve el statement creado', async () => {
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

    it('GET /v1/bankstatemens/by-iban con IBAN inválido devuelve 400', async () => {
        const res = await http('GET', `${API_PREFIX}/by-iban?iban=INVALID&month=2025-11`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toHaveProperty('error');
    });

    it('GET /v1/bankstatemens/by-iban con IBAN válido pero no existente devuelve 404', async () => {
        const res = await http('GET', `${API_PREFIX}/by-iban?iban=${testIban}&month=2025-11`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body).toHaveProperty('message', 'El IBAN no registra estados de cuenta correspondientes a este mes');
    });

    it('PUT /v1/bankstatemens/account/:accountId/statements reemplaza statements', async () => {
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

    it('DELETE /v1/bankstatemens/by-identifier elimina por accountId y month', async () => {
        const res = await http('DELETE', `${API_PREFIX}/by-identifier`, {
            accountId: testAccountId,
            month: '2025-11',
        });

        if (skipIfNoApi()) return;

        expect([200, 404]).toContain(res.status);
    });

    it('DELETE /v1/bankstatemens/by-identifier elimina por id si existe', async () => {
        if (!createdStatementId) {
            console.warn('[EXTERNAL TESTS] No hay statement creado, se omite este test.');
            return;
        }

        const res = await http('DELETE', `${API_PREFIX}/by-identifier`, {
            id: createdStatementId,
        });

        if (skipIfNoApi()) return;

        expect([200, 404]).toContain(res.status);
    });

    it('GET /v1/bankstatemens/:id devuelve 404 después del borrado', async () => {
        if (!createdStatementId) {
            console.warn('[EXTERNAL TESTS] No hay statement creado, se omite este test.');
            return;
        }

        const res = await http('GET', `${API_PREFIX}/${createdStatementId}`);

        if (skipIfNoApi()) return;

        expect(res.status).toBe(404);
    });
});
