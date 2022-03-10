const { getDb } = require('../db/index');
const { ObjectId } = require('mongodb');

exports.getUserById = (id) =>
  getDb()
    .collection('users')
    .findOne({ _id: ObjectId(id) }, { projection: { password: 0 } });

exports.getUserByUsername = (username) =>
  getDb()
    .collection('users')
    .findOne({ username }, { projection: { password: 0 } });

exports.getListOfRegionalManagers = () =>
  getDb()
    .collection('users')
    .find({ role: 'regionalManager' }, { projection: { password: 0 } })
    .toArray();

exports.getRandomRegionalManager = () =>
  getDb()
    .collection('users')
    .aggregate([
      { $match: { role: 'regionalManager' } },
      { $sample: { size: 1 } },
    ])
    .next();

exports.getStoreManagers = () =>
  getDb().collection('users').find({ role: 'storeManager' }).toArray();
