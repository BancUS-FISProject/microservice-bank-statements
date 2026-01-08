const axios = require('axios');
const config = require('../../../config');

function createClient(baseURL) {
    return axios.create({ baseURL, timeout: 5000, headers: { 'Content-Type': 'application/json' } });
}

const endpoints = (config && config.microservices && config.microservices[config.strategy]) || (config && config.microservices && config.microservices.http) || {};

module.exports = {
    getAccount: async (id) => {
        try {
            const base = endpoints.accounts;
            const client = createClient(base);
            const url = `${base}/v1/accounts/${id}`;
            const res = await client.get(url);
            return res.data;
        } catch (err) {
            return { error: true, message: err.message };
        }
    },

    getTransactions: async (iban, token = null) => {
        try {
            const base = endpoints.transactions;
            const url = `${base}/v1/transactions/user/${iban}`;
            const headers = { 'Content-Type': 'application/json' };

            if (token) {
                headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                console.log('[http] getTransactions -> enviando token:', headers.Authorization.substring(0, 20) + '...');
            } else {
                console.warn('[http] getTransactions -> NO se proporcionó token');
            }

            const res = await axios.get(url, { headers, timeout: 5000 });
            return res.data;
        } catch (err) {
            console.error('[http] getTransactions error:', err.message);
            if (err.response) {
                console.error('[http] Response status:', err.response.status);
                console.error('[http] Response data:', err.response.data);
            }
            return { error: true, message: err.message };
        }
    },

    getAllAccounts: async () => {
        try {
            const base = endpoints.accounts;
            const client = createClient(base);
            const url = `${base}/v1/accounts`;
            const res = await client.get(url);
            return res.data;
        } catch (err) {
            return { error: true, message: err.message };
        }
    },

    sendNotification: async (payload) => {
        try {
            const base = endpoints.notifications;
            const client = createClient(base);
            const url = `${base}/v1/notifications`;
            const res = await client.post(url, payload);
            return res.data;
        } catch (err) {
            return { error: true, message: err.message };
        }
    },
};
