const { Schema, model } = require('mongoose');

const TransactionSchema = new Schema({
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    description: { type: String },
}, { _id: false });

const BankStatementSchema = new Schema({
    account_id: { type: String, required: true, index: true },
    date_start: { type: Date, required: true },
    date_end: { type: Date, required: true },
    transactions: { type: [TransactionSchema], default: [] },
}, { timestamps: true });

module.exports = model('BankStatement', BankStatementSchema);
