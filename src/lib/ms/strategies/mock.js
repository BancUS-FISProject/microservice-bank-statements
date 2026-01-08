function randomId() {
    return Math.random().toString(36).slice(2, 10);
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateValidIBAN() {
    // Generar IBAN español válido: ES + 22 dígitos
    const digits = Array.from({ length: 22 }, () => Math.floor(Math.random() * 10)).join('');
    return `ES${digits}`;
}

function mockAccount(id, iban = null) {
    return {
        id: String(id),
        name: `User ${id}`,
        iban: iban || generateValidIBAN(),
        creation_date: randomDate(new Date(2015, 0, 1), new Date()),
        email: `user${id}@example.com`,
        phoneNumber: `+34${600 + id}${String(id).padStart(6, '0')}`,
        subscription: ['basico', 'estudiante', 'profesional'][Math.floor(Math.random() * 3)],
        balance: parseFloat((Math.random() * 10000).toFixed(2)),
        isBlocked: Math.random() > 0.9,
    };
}

// Pool global de cuentas para transacciones coherentes
const _mockAccountsPool = [
    mockAccount(1, 'ES1111111111111111111111'),
    mockAccount(2, 'ES2222222222222222222222'),
    mockAccount(3, 'ES3333333333333333333333'),
    mockAccount(4, 'ES4444444444444444444444'),
    mockAccount(5, 'ES5555555555555555555555'),
    mockAccount(6, 'ES6666666666666666666666'),
    mockAccount(7, 'ES7777777777777777777777'),
    mockAccount(8, 'ES8888888888888888888888'),
    mockAccount(9, 'ES9999999999999999999999'),
    mockAccount(10, 'ES1234567890123456789012'),
];

function mockTransaction(accountId, accountIban, forCurrentMonth = false) {
    const isIncoming = Math.random() > 0.5;
    const otherAccount = _mockAccountsPool[Math.floor(Math.random() * _mockAccountsPool.length)];

    // Evitar transacciones consigo mismo
    const otherIban = otherAccount.iban !== accountIban
        ? otherAccount.iban
        : _mockAccountsPool[(Math.floor(Math.random() * _mockAccountsPool.length) + 1) % _mockAccountsPool.length].iban;

    const amount = Math.floor(25 + Math.random() * 3000); // 25-3025 EUR (rango más amplio)

    // Generar fechas: mes actual o mes anterior según parámetro
    const now = new Date();
    let year, month, lastDay;

    if (forCurrentMonth) {
        // Mes ACTUAL (enero 2026)
        year = now.getFullYear();
        month = now.getMonth();
        lastDay = new Date(year, month + 1, 0).getDate();
    } else {
        // Mes ANTERIOR (diciembre 2025)
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        year = previousMonth.getFullYear();
        month = previousMonth.getMonth();
        lastDay = new Date(year, month + 1, 0).getDate();
    }

    const gmt_time = new Date(
        year,
        month,
        1 + Math.floor(Math.random() * lastDay), // día aleatorio del mes
        Math.floor(Math.random() * 24), // hora
        Math.floor(Math.random() * 60), // minuto
        Math.floor(Math.random() * 60)  // segundo
    );

    // Variedad de estados
    const statuses = ['completed', 'completed', 'completed', 'pending', 'processing'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
        sender: isIncoming ? otherIban : accountIban,
        receiver: isIncoming ? accountIban : otherIban,
        quantity: amount,
        amount: amount,
        status: status,
        currency: 'EUR',
        description: isIncoming
            ? `Transferencia recibida de ${otherAccount.name}`
            : `Transferencia enviada a ${otherAccount.name}`,
        sender_balance: parseFloat((5000 + Math.random() * 20000).toFixed(2)),
        receiver_balance: parseFloat((5000 + Math.random() * 20000).toFixed(2)),
        gmt_time: gmt_time.toISOString(),
    };
}

module.exports = {
    getAccount: async (id) => {
        const account = _mockAccountsPool.find(a => a.id === String(id) || a.iban === id);
        return account || _mockAccountsPool[0];
    },

    getAllAccounts: async (count = 5) => {
        // Devuelve lista de cuentas mock para pruebas
        return _mockAccountsPool.slice(0, Math.min(count, _mockAccountsPool.length));
    },

    getTransactions: async (accountId, token = null) => {
        console.log('[mock] getTransactions called for:', accountId);

        // Encontrar la cuenta y su IBAN
        const account = _mockAccountsPool.find(a => a.id === String(accountId) || a.iban === accountId);
        const accountIban = account?.iban || accountId;

        // Generar transacciones: mitad del mes anterior, mitad del mes actual
        const transactions = [];

        // 7-10 transacciones del mes anterior
        const previousMonthTxCount = 7 + Math.floor(Math.random() * 4);
        for (let i = 0; i < previousMonthTxCount; i++) {
            transactions.push(mockTransaction(accountId, accountIban, false));
        }

        // 8-12 transacciones del mes actual (para que el POST funcione)
        const currentMonthTxCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < currentMonthTxCount; i++) {
            transactions.push(mockTransaction(accountId, accountIban, true));
        }

        // Ordenar por fecha
        transactions.sort((a, b) => new Date(a.gmt_time) - new Date(b.gmt_time));

        console.log(`[mock] Generated ${transactions.length} transactions (${previousMonthTxCount} previous month, ${currentMonthTxCount} current month)`);

        return transactions;
    },

    sendNotification: async (payload) => {
        console.log('[mock] sendNotification called:', payload);
        return { ok: true, id: randomId(), payload };
    },
};
