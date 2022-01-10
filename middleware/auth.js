const { getDb } = require('../db/index');
const jwt = require('jsonwebtoken');
const ObjectID = require('mongodb').ObjectID;


exports.protect = async (req, res, next) => {
    const { authorization } = req.headers;
    console.log('middleware: ', { authorization });
    let token;
  
    if (authorization && authorization.startsWith('Bearer')) {
      [, token] = req.headers.authorization.split(' ');
    }
    if (!token) {
      const error = new Error('Not authorized to access this route');
      res.status(401);
      return next(error);
    }
    try {
      var decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log({ decoded });
      const usersCollection = getDb().collection('users');
      const user = await usersCollection.findOne({ _id: ObjectID(decoded.id) });
      req.user = user;
      console.log({ user });
  
      const { id: userId, role } = decoded;
      console.log({ userId }, { role });
    } catch (err) {
      console.log(err);
      const error = new Error('Not authorized to access this route');
  
      res.status(401);
      return next(error);
    }
    next();
  };