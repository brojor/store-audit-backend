const { getDb } = require('../db/index');

exports.storeSelect = async (req, res) => {
  const { role } = req.user;
  switch (role) {
    case 'topManagement':
      const allStoresCount = await getCountOfAllStores();
      const regionals = await getCountOfStoresByManagers();
      const individualBranches = await getAllIndividualBranches();

      return res.json([
        {
          title: `Všechny pobočky (${allStoresCount})`,
          type: 'group',
          id: 'all',
        },
        ...regionals,
        ...individualBranches,
      ]);
    case 'regionalManager':
      const branchesUnderManager = await getDb()
        .collection('stores')
        .find({ regionalManager: req.user._id })
        .sort({ storeName: 1 })
        .map(({ storeName, storeId: id }) => ({
          title: storeName,
          type: 'individual',
          id,
        }))
        .toArray();
      const countOfBranches = branchesUnderManager.length;
      return res.json([
        {
          title: `Všechny pobočky (${countOfBranches})`,
          type: 'group',
          id: req.user._id,
        },
        ...branchesUnderManager,
      ]);
      break;
    case 'storeManager':
      console.log('store man');
      const store = await getDb()
        .collection('stores')
        .find({ storeManager: req.user._id })
        .map(({ storeName, storeId: id }) => ({
          title: storeName,
          type: 'individual',
          id,
        }))
        .toArray();
      return res.json([...store]);

    default:
      throw new Error('Invalid role');
  }
};

function getCountOfAllStores() {
  return getDb().collection('stores').countDocuments();
}

function getCountOfStoresByManagers() {
  return getDb()
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
}

function getAllIndividualBranches() {
  return getDb()
    .collection('stores')
    .find({})
    .sort({ storeName: 1 })
    .map(({ storeName, storeId: id }) => ({
      title: storeName,
      type: 'individual',
      id,
    }))
    .toArray();
}
