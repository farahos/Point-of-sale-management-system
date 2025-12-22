import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    quantity: Number,
    sellingPrice: Number,
    total: Number,
    profit: Number
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);
