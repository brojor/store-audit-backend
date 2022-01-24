const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getUserByUsername } = require('../model/users');

const login = async (req, res, next) => {
  const { username, password } = req.body;
  if (!username) {
    res.status(400);
    next(new Error('Zadejte prosím uživetelské jméno'));
  }
  if (!password) {
    res.status(400);
    next(new Error('Zadejte prosím heslo'));
  }
  const user = await getUserByUsername(username);
  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(400);
      return next(new Error('Neplatné přihlašovací údaje'));
    }
    const token = getSignedJwtToken({ id: user._id, role: user.role });
    const fullName = getFullName(user);
    res.json({ success: true, token, fullName });
  } else {
    res.status(401);
    next(new Error('Neplatné přihlašovací údaje'));
  }
};

const getSignedJwtToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

const getFullName = (user) =>
  user.role === 'topManagement'
    ? `👑 ${user.firstName} ${user.lastName}`
    : `${user.firstName} ${user.lastName}`;

exports.login = login;
