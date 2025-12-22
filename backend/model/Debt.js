import mongoose from "mongoose";

const DebtSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Debt", DebtSchema);
