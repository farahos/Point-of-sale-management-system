import Expense from '../model/Expense.js';

// Create new expense
export const createExpense = async (req, res) => {
    try {
        const expense = new Expense(req.body);
        await expense.save();
        
        res.status(201).json({
            success: true,
            data: expense
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get all expenses
export const getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
        
        // Calculate totals
        const totalIn = expenses
            .filter(e => e.type === 'IN')
            .reduce((sum, e) => sum + e.amount, 0);
            
        const totalOut = expenses
            .filter(e => e.type === 'OUT')
            .reduce((sum, e) => sum + e.amount, 0);
            
        const balance = totalIn - totalOut;

        res.status(200).json({
            success: true,
            data: expenses,
            summary: {
                totalIn,
                totalOut,
                balance
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get expense by ID
export const getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }
        res.status(200).json({
            success: true,
            data: expense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update expense
export const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: expense
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Delete expense
export const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Search expenses
export const searchExpenses = async (req, res) => {
    try {
        const { query } = req.query;
        const expenses = await Expense.find({
            $or: [
                { itemName: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { type: { $regex: query, $options: 'i' } },
                { type_amount: { $regex: query, $options: 'i' } }
            ]
        }).sort({ date: -1, createdAt: -1 });
        
        // Calculate totals
        const totalIn = expenses
            .filter(e => e.type === 'IN')
            .reduce((sum, e) => sum + e.amount, 0);
            
        const totalOut = expenses
            .filter(e => e.type === 'OUT')
            .reduce((sum, e) => sum + e.amount, 0);
            
        const balance = totalIn - totalOut;

        res.status(200).json({
            success: true,
            data: expenses,
            summary: {
                totalIn,
                totalOut,
                balance
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Filter by date
export const filterByDate = async (req, res) => {
    try {
        const { date } = req.query;
        
        let query = {};
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            query.date = {
                $gte: startDate,
                $lt: endDate
            };
        }
        
        const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
        
        // Calculate totals
        const totalIn = expenses
            .filter(e => e.type === 'IN')
            .reduce((sum, e) => sum + e.amount, 0);
            
        const totalOut = expenses
            .filter(e => e.type === 'OUT')
            .reduce((sum, e) => sum + e.amount, 0);
            
        const balance = totalIn - totalOut;

        res.status(200).json({
            success: true,
            data: expenses,
            summary: {
                totalIn,
                totalOut,
                balance
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get summary statistics
export const getSummary = async (req, res) => {
    try {
        const expenses = await Expense.find();
        
        const summary = expenses.reduce((acc, expense) => {
            if (expense.type === 'IN') {
                acc.totalIn += expense.amount;
                acc.inItems.push(expense);
            } else {
                acc.totalOut += expense.amount;
                acc.outItems.push(expense);
            }
            return acc;
        }, { totalIn: 0, totalOut: 0, inItems: [], outItems: [] });
        
        summary.balance = summary.totalIn - summary.totalOut;
        
        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};