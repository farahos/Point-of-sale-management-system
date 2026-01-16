import express from 'express';
import {
  addTransaction,
  getAllDebts,
  getDebt
} from '../controller/DebtController.js';

const router = express.Router();

// Add transaction to customer's debt
router.post('/:customerId/transactions', addTransaction);

// Get all debts
router.get('/', getAllDebts);

// Get debt for specific customer
router.get('/:customerId', getDebt);

export default router;