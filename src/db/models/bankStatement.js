const { Schema, model } = require('mongoose');
//Define the schema for bank statements

const AccountSchema = new Schema({
    iban: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
});

const TransactionSchema = new Schema({
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    description: { type: String },
}, { _id: false });

const BankStatementSchema = new Schema({
    account: { type: AccountSchema, required: true },
    date_start: { type: Date, required: true },
    date_end: { type: Date, required: true },
    transactions: { type: [TransactionSchema], default: [] },
    total_incoming: { type: Number, required: true },
    total_outgoing: { type: Number, required: true },
    year: { type: Number, required: true, index: true },
    month: { type: Number, required: true, index: true },
}, { timestamps: true });



module.exports = model('BankStatement', BankStatementSchema);
