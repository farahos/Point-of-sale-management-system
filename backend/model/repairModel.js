// model/repairModel.js
import mongoose from 'mongoose';

const repairSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  problem: {
    type: String,
    required: true
  },
  color: String,
  caseIncluded: String,
  battery: String,
  repairCost: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  repairStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-calculate remaining balance before save
repairSchema.pre('save', function(next) {
  if (this.repairCost && this.amountPaid) {
    this.remainingBalance = Math.max(0, this.repairCost - this.amountPaid);
  }
  this.updatedAt = Date.now();
  next();
});

// Auto-calculate remaining balance before update
repairSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.repairCost !== undefined || update.amountPaid !== undefined) {
    const repairCost = update.repairCost || this._update.repairCost || 0;
    const amountPaid = update.amountPaid || this._update.amountPaid || 0;
    update.remainingBalance = Math.max(0, repairCost - amountPaid);
  }
  update.updatedAt = Date.now();
  next();
});

const Repair = mongoose.model('Repair', repairSchema);
export default Repair;