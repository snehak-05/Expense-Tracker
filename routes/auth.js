const express = require('express');  // import express
const router = express.Router(); 
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req,res)=>{
  const { name, username, email, password, phone } = req.body;
  try {
    // Basic validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({ name, username, email, password, phone });
    await user.save();

    res.json({ message: 'User registered successfully' });
  } catch(err) { res.status(500).json(err); }
});

// Login
router.post('/login', async (req,res)=>{
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'No such user' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid login' });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }   // longer expiry
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch(err) { res.status(500).json(err); }
});

module.exports = router;
