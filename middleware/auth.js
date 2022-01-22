const jwt = require('jsonwebtoken');
const { getUserById } = require('../model/users');

exports.protect = async (req, res, next) => {
  const { authorization } = req.headers;
  let token;

  if (authorization && authorization.startsWith('Bearer')) {
    [, token] = req.headers.authorization.split(' ');
  }
  if (!token) {
    res.status(401);
    return next(new Error('Not authorized to access this route'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await getUserById(decoded.id);
  } catch (err) {
    res.status(401);
    return next(new Error('Not authorized to access this route'));
  }
  next();
};
