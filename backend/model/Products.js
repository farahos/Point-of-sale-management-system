import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    costPrice: { type: Number, required: true },
    quantity: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
