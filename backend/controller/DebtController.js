import Debt from '../model/Debt.js';
import Customer from '../model/Customers.js';

// Create or update debt for customer
export const addTransaction = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { description, amount, type } = req.body;
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Macmiil lama helin' });
    }
    
    // Find existing debt or create new
    let debt = await Debt.findOne({ customer: customerId });
    
    if (!debt) {
      debt = new Debt({
        customer: customerId,
        transactions: [{
          description,
          amount,
          type: type || 'debt'
        }]
      });
    } else {
      debt.transactions.push({
        description,
        amount,
        type: type || 'debt'
      });
    }
    
    await debt.save();
    
    // Populate customer info
    const result = await Debt.findById(debt._id)
      .populate('customer', 'name phone');
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all debts with customer info
export const getAllDebts = async (req, res) => {
  try {
    const debts = await Debt.find()
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    
    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single debt record
export const getDebt = async (req, res) => {
  try {
    const debt = await Debt.findOne({ customer: req.params.customerId })
      .populate('customer', 'name phone');
    
    if (!debt) {
      return res.status(404).json({ 
        message: 'Deynta lama helin',
        transactions: [],
        totalDebt: 0
      });
    }
    
    res.json(debt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};