import Debt from "../model/Debt.js";

// CREATE OR UPDATE DEBT
export const createDebt = async (req, res) => {
  try {
    const { customer, amount, note } = req.body;

    // 1. Check if customer already has a debt
    let debt = await Debt.findOne({ customer });

    if (debt) {
      // Update existing debt
      debt.amount += amount; // add new amount to old
      debt.note = note || debt.note;
      if (debt.paidAmount > debt.amount) debt.paidAmount = debt.amount; // safety
      if (debt.paidAmount === debt.amount) debt.status = "paid";
      else debt.status = "unpaid";
      await debt.save();

      return res.status(200).json({ message: "Debt updated successfully", debt });
    }

    // No existing debt → create new
    debt = await Debt.create({
      customer,
      amount,
      note,
    });

    res.status(201).json({ message: "Debt created successfully", debt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL DEBTS
export const getDebts = async (req, res) => {
  try {
    const debts = await Debt.find().populate("customer");
    res.json(debts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET CUSTOMER DEBTS
export const getCustomerDebts = async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await Debt.findOne({ customer: id }).populate("customer");
    if (!debt) return res.json({ message: "No debt for this customer", debt: null });
    res.json(debt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PAY DEBT
export const payDebt = async (req, res) => {
  try {
    const { id } = req.params; // debt id
    const { payAmount } = req.body;

    const debt = await Debt.findById(id);

    if (!debt) return res.status(404).json({ message: "Debt not found" });

    // Check if payAmount is greater than remaining debt
    const remaining = debt.amount - debt.paidAmount;
    if (payAmount > remaining) {
      return res.status(400).json({ message: `Customer only owes $${remaining}` });
    }

    debt.paidAmount += payAmount;

    if (debt.paidAmount === debt.amount) debt.status = "paid";
    else debt.status = "partial";

    await debt.save();
    res.json({ message: "Payment successful", debt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// QUICK CREATE CUSTOMER (if not exists)
export const quickCreateCustomer = async (req, res) => {
  try {
    const { cusPhone } = req.body;

    if (!cusPhone)
      return res.status(400).json({ message: "Phone required" });

    // Check if exists
    let existing = await Customer.findOne({ cusPhone });
    if (existing) {
      return res.json({ message: "Customer already exists", customer: existing });
    }

    // Create new customer
    const newCus = await Customer.create({
      cusname: "Unknown",
      cusPhone
    });

    res.status(201).json({ message: "Customer created", customer: newCus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
