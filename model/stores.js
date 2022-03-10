const { getDb } = require('../db/index');
const { ObjectId } = require('mongodb');

const callbacks = {
  idOnly: ({ storeId }) => storeId,
  titleAndId: ({ storeName, storeId: id }) => ({
    title: storeName,
    type: 'individual',
    id,
  }),
  nameAndId: (store) => ({ name: store.storeName, id: store.storeId }),
};

exports.getStoresByUser = ({ _id: userId, role }, cbName = 'idOnly') =>
  getDb()
    .collection('stores')
    .find(role === 'topManagement' ? {} : { [role]: ObjectId(userId) })
    .sort({ storeName: 1 })
    .map(callbacks[cbName])
    .toArray();

exports.getStoresBelongsManager = ({ role, _id }) =>
  getDb()
    .collection('stores')
    .find({ [role]: _id })
    // .map((store) => store.storeId)
    .toArray();

exports.getStoresInRegion = () =>
  getDb()
    .collection('users')
    .aggregate([
      { $match: { role: 'regionalManager' } },
      { $sort: { lastName: 1 } },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: 'regionalManager',
          as: 'stores',
        },
      },
      {
        $project: {
          id: '$_id',
          fullName: { $concat: ['$firstName', ' ', '$lastName'] },
          count: { $size: '$stores' },
        },
      },
    ])
    .map(({ fullName, count, id }) => ({
      title: `Region - ${fullName} (${count})`,
      type: 'group',
      id,
    }))
    .toArray();

exports.getDeficiencies = (query) =>
  getDb().collection('audits').aggregate(query).toArray();
