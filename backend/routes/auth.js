const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if(existingUser){
      return res.status(400).json({message: `User already exists with ${email}.` });
    }

    const newUser = new User({ name, email,password});
    await newUser.save();

    res.status(201).json({created : true,message: 'Signup successful' });
  }catch(error){
    res.status(500).json({message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: `No user found with ${email}.` });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({logged_in : true,token,user: { id: user._id, name: user.name, email: user.email}});

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;