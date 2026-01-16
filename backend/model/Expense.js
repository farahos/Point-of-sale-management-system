import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    type: {
        type: String,
        required: [true, 'Type is required'],
        enum: ['IN', 'OUT'],
        uppercase: true
    },
    // itemName: {
    //     type: String,
    //     required: [true, 'Item name is required'],
    //     trim: true
    // },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0
    },
    type_amount: {
        type: String,
        required: [true, 'Payment type is required'],
        enum: ['Ecv', 'E-dahab', 'Cash']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;