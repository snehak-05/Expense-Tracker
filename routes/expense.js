const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');

// helper: hard-coded default expenses
const DEFAULT_EXPENSES = [
  { description: 'Sample Food', amount: 100, date: new Date() },
  { description: 'Sample Travel', amount: 200, date: new Date() }
];

// Get all expenses of logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    let expenses = await Expense.find({ user: req.user.id })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    //  If user has no personal expenses, show default ones
    if (expenses.length === 0) expenses = DEFAULT_EXPENSES;

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

//  Get single expense by id (only user-owned)
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: 'Invalid expense id' });

    const expense = await Expense.findOne({ _id: req.params.id, user: req.user.id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

//  Add expense
router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, date } = req.body;
    if (!description || amount == null)
      return res.status(400).json({ error: 'Description and amount are required' });

    const expense = new Expense({
      user: req.user.id,
      description,
      amount,
      date: date || Date.now(),
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

//  Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: 'Invalid expense id' });

    const { description, amount, date } = req.body;
    const updateFields = {};
    if (description !== undefined) updateFields.description = description;
    if (amount !== undefined) updateFields.amount = amount;
    if (date !== undefined) updateFields.date = date;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updateFields },
      { new: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

//  Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: 'Invalid expense id' });

    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
