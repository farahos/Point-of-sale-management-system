import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true
    },
    phone: {
      type: Number,
      required: [true, "Phone number is required"],
      trim: true,
     
    },
    email: {
      type: String,
      required : [true, 'Email is Required'],
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required : [true, 'address is Required'],
      trim: true
    },
    notes: {
      type: String,
      required : [true, 'node is Required'],
      trim: true
    },
    totalPurchases: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    lastPurchaseDate: {
      type: Date
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for customer's full details
customerSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.phone})`;
});

// Indexes for better query performance
customerSchema.index({ name: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ createdAt: -1 });

export default mongoose.model("Customer", customerSchema);