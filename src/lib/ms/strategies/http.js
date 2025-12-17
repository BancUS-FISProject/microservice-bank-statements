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
            const url = `${base}/accounts/${id}`;
            const res = await client.get(url);
            return res.data;
        } catch (err) {
            return { error: true, message: err.message };
        }
    },

    getTransactions: async (accountId) => {
        try {
            const base = endpoints.transactions;
            const client = createClient(base);
            const url = `${base}/transactions/user/${accountId}`;
            const res = await client.get(url);
            return res.data;
        } catch (err) {
            return { error: true, message: err.message };
        }
    },

    getAllAccounts: async () => {
        try {
            const base = endpoints.accounts;
            const client = createClient(base);
            const url = `${base}/accounts`;
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
            const url = `${base}/notifications`;
            const res = await client.post(url, payload);
            return res.data;
        } catch (err) {
            return { error: true, message: err.message };
        }
    },
};
