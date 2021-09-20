const { getDb } = require('../db/index');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const login = async (req, res, next) => {
  const { username, password } = req.body;
  if (!username) {
    res.status(400);
    next(new Error('Please provide an username'));
  }
  if (!password) {
    res.status(400);
    next(new Error('Please provide an password'));
  }
  const usersCollection = getDb().collection('users');
  const user = await usersCollection.findOne({ username });
  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log('špatné heslo');
      res.status(400);
      return next(new Error('Invalid credentials'));
    }
    const token = getSignedJwtToken({ id: user._id, role: user.role });
    const fullName =
      user.role === 'topManagement'
        ? `👑 ${user.firstName} ${user.lastName}`
        : `${user.firstName} ${user.lastName}`;

    res.json({ success: true, token, fullName });
  } else {
    res.status(400);
    next(new Error('Invalid credentials'));
  }
};

const getSignedJwtToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

exports.login = login;
