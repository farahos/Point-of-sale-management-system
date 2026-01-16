import express from 'express';
import {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    searchExpenses,
    filterByDate,
    getSummary
} from '../controller/ExpenseController.js';

const router = express.Router();

// POST /api/expenses - Create new expense
router.post('/', createExpense);

// GET /api/expenses - Get all expenses
router.get('/', getAllExpenses);

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', getExpenseById);

// PUT /api/expenses/:id - Update expense
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', deleteExpense);

// GET /api/expenses/summary - Get summary statistics
router.get('/summary', getSummary);

// GET /api/expenses/search?query=... - Search expenses
router.get('/search', searchExpenses);

// GET /api/expenses/filter?date=... - Filter by date
router.get('/filter', filterByDate);

export default router;