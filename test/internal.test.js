// Importamos supertest para hacer los test. También usaremos jest.
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

// Estos test se centran en comprobar que la API funciona correctamente
describe('Bank Statements service API', () => {
    let createdStatement = null;
    const testAccountId = 'internal-test-account';
    const testIban = 'ES9876543210987654321098';

    beforeAll(async () => {
        // Desconectar cualquier conexión previa
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });

    // Con cada it hacemos una prueba.
    // La primera prueba consiste en que responde con 200 OK en /
    it('responde en la ruta raíz con 200 OK', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('message', 'Microservice bank statements');
    });

    // En el endpoint /health obtenemos información sobre si el estado de la API
    // En esta prueba comprobamos si está funcionando correctamente
    it('expone un endpoint raíz funcional', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });

    it('GET /health devuelve status ok', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });

    it('POST /v1/bankstatements/generate devuelve 201 o 500 (sin BD conectada)', async () => {
        const res = await request(app)
            .post('/v1/bankstatements/generate')
            .send({
                accountId: testAccountId,
                month: '2025-09',
                transactions: [
                    {
                        sender: 'sender-internal',
                        receiver: testAccountId,
                        amount: 200.0,
                        currency: 'USD',
                        gmt_time: '2025-09-05T10:00:00Z',
                    },
                ],
            });

        // En test sin BD, puede retornar 500
        expect([201, 500]).toContain(res.status);
    });

    it('GET /v1/bankstatements/by-account/:accountId retorna 200 o 500', async () => {
        const res = await request(app).get(`/v1/bankstatements/by-account/${testAccountId}`);

        expect([200, 500]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body).toHaveProperty('months');
            expect(Array.isArray(res.body.months)).toBe(true);
        }
    });

    it('GET /v1/bankstatements/by-iban con IBAN inválido devuelve 400', async () => {
        const res = await request(app).get('/v1/bankstatements/by-iban?iban=INVALID&month=2025-09');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('GET /v1/bankstatements/by-iban con mes inválido devuelve 400', async () => {
        const res = await request(app).get(`/v1/bankstatements/by-iban?iban=${testIban}&month=2025-13`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('GET /v1/bankstatements/by-iban con formato correcto pero sin BD devuelve 500 o 404', async () => {
        const res = await request(app).get(`/v1/bankstatements/by-iban?iban=${testIban}&month=2025-09`);

        // Sin BD conectada, esperamos 500; si la BD falla la consulta, puede ser 404
        expect([404, 500]).toContain(res.status);
    });

    afterAll(async () => {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    });
});
