// Debt Schema (updated)
import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  transactions: [{
    date: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['debt', 'payment'],
      default: 'debt'
    }
  }],
  totalDebt: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update total debt before saving
debtSchema.pre('save', function(next) {
  this.totalDebt = this.transactions.reduce((total, transaction) => {
    return transaction.type === 'debt' ? 
           total + transaction.amount : 
           total - transaction.amount;
  }, 0);
  next();
});

const Debt = mongoose.model('Debt', debtSchema);
export default Debt;