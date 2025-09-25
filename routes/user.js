const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get logged-in user profile
router.get('/me', auth, async (req,res)=>{
  try{
    const user = await User.findById(req.user.id).select('-password'); // hide password
    res.json(user);
  } catch(err){
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(500).json(err); }
});

module.exports = router;
