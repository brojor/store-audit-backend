const { getDb } = require('../db/index');
const { ObjectId } = require('mongodb');

exports.getStoresByUser = ({ _id: userId, role }) =>
  getDb()
    .collection('stores')
    .find({ [role]: ObjectId(userId) })
    .map(({ storeId }) => storeId)
    .toArray();

exports.getDeficiencies = (query) =>
  getDb().collection('audits').aggregate(query).toArray();
