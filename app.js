const express = require('express');
const app = express();
const http = require('http').createServer(app);
const authRoutes = require('./routes/auth');
const dotenv = require('dotenv');
const cors = require('cors');
// temp-start
const { getDb } = require('./db/index');
const jwt = require('jsonwebtoken');
const ObjectID = require('mongodb').ObjectID;
// temp-end
dotenv.config({ path: './config/.env' });

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  const response = 'hello my friend';
  console.log('fungujeme..');
  res.json(response);
});

app.use('/auth', authRoutes);
// temp-start

const middleware = async (req, res, next) => {
  // something
  const { authorization } = req.headers;
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
    req.user = user
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

const controller = async (req, res) => {
  console.log('stores funguje');

  const storesCollection = getDb().collection('stores');
    const stores = await storesCollection
      .find({ [req.user.role]: ObjectID(req.user._id) })
      .map((store) => store.storeId)
      .toArray();
    console.log({ stores });
  res.json({ stores });
};

app.get('/stores', middleware, controller);

const errorHandler = (err, req, res, next) => {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    //   stack: err.stack,
  });
};

app.use(errorHandler);
// temp-end
module.exports = http;
