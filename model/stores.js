const { getDb } = require('../db/index');

const getStoresByUser = (userId, role) => {
  return getDb()
    .collection('stores')
    .find({ [role]: userId })
    .map(({ storeId }) => storeId)
    .toArray();
};

exports.getStoresByUser = getStoresByUser;
