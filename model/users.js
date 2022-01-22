const { getDb } = require('../db/index');
const { ObjectId } = require('mongodb');

exports.getUserById = (id) =>
  getDb()
    .collection('users')
    .findOne({ _id: ObjectId(id) });
