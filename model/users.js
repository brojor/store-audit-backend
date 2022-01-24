const { getDb } = require('../db/index');
const { ObjectId } = require('mongodb');

exports.getUserById = (id) =>
  getDb()
    .collection('users')
    .findOne({ _id: ObjectId(id) })
    .then(({ password, ...rest }) => ({ ...rest }));

exports.getUserByUsername = (username) =>
  getDb().collection('users').findOne({ username });
