function randomId() {
    return Math.random().toString(36).slice(2, 10);
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function mockAccount(id) {
    return {
        id,
        name: `User ${id}`,
        iban: `ES${Math.floor(100000000 + Math.random() * 900000000)}`,
        cards: [`card_${randomId()}`, `card_${randomId()}`],
        creation_date: randomDate(new Date(2015, 0, 1), new Date()),
        email: `user${id}@example.com`,
        subscription: ['free', 'standard', 'premium'][Math.floor(Math.random() * 3)],
        balance: parseFloat((Math.random() * 10000).toFixed(2)),
        isBlocked: Math.random() > 0.9,
    };
}

function mockTransaction(accountId) {
    const sender = `acc_${Math.floor(Math.random() * 1000)}`;
    const receiver = `acc_${Math.floor(Math.random() * 1000)}`;
    return {
        sender,
        receiver,
        quantity: Math.floor(Math.random() * 1000),
        status: 'pending',
        currency: 'USD',
        sender_balance: parseFloat((Math.random() * 10000).toFixed(2)),
        receiver_balance: parseFloat((Math.random() * 10000).toFixed(2)),
        gmt_time: new Date().toISOString(),
    };
}

module.exports = {
    getAccount: async (id) => {
        return mockAccount(id);
    },

    getTransactions: async (accountId) => {
        // return a list of 3 mock transactions
        return Array.from({ length: 3 }).map(() => mockTransaction(accountId));
    },

    sendNotification: async (payload) => {
        // simulate sending notification
        return { ok: true, id: randomId(), payload };
    },
};
