// models/Repair.js
import mongoose from "mongoose";
const RepairSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  name: String,
  phone: String,
  model: String,
  color: String,
  problem: String,
  caseIncluded: String,
  battery: String,
  agreedPrice: Number,
  paid: Number,
  remaining: Number,
});

const Repair = mongoose.model("Repair", RepairSchema);
export default Repair;