const { getDb } = require('../db/index');
const { ObjectId } = require('mongodb');
const { byCategory, byCategoryPoints } = require('../db/chartQueries');

exports.deficiencies = async (req, res) => {
  const { id, type } = req.params;
  const { before, after, detailLevel, sortBy } = req.query;
  // console.log({ id, type, before, after, detailLevel, sortBy });

  const baseQuery = detailLevel === 'points' ? byCategoryPoints : byCategory;
  const finalQuery = [
    {
      $match: {
        date: { $gte: new Date(after), $lte: new Date(before) },
      },
    },
    ...baseQuery,
    { $sort: { [`${sortBy}`]: 1 } },
  ];

  if (type === 'aggregated') {
    if (id !== 'all') {
      const regionalManagerId = id;
      const stores = await getDb()
        .collection('stores')
        .find({ regionalManager: ObjectId(regionalManagerId) })
        .map(({ storeId }) => storeId)
        .toArray();
      finalQuery[0].$match.storeId = { $in: stores };
    }
  } else {
    // id === "individual"
    finalQuery[0].$match.storeId = id;
  }

  const result = await getDb()
    .collection('audits_fake')
    .aggregate(finalQuery)
    .toArray();

  const newResult = result.map((item) => {
    const id =
      detailLevel === 'points'
        ? item.id.replace('C', 'K').replace('P', 'B')
        : `Kategorie ${item.id}`;
    return { ...item, id };
  });
  res.json(newResult);
};

// exports.storeSelect = async (req, res) => {
//   const allStoresCount = await getDb().collection('stores').countDocuments();

//   const regionals = await getDb()
//     .collection('users')
//     .find({ role: 'regionalManager' })
//     .map((regionalManager) => {
//       const { firstName, lastName, _id: id } = regionalManager;
//       const fullName = `${firstName} ${lastName}`;
//       return { fullName, id };
//     })
//     .toArray();
//   const regionalsStoreCount = regionals.map(async (regional) => {
//     const countOfStores = await getDb()
//       .collection('stores')
//       .find({ regionalManager: regional.id })
//       .count();
//     console.log(countOfStores);
//     return `${regional.fullName} - ${countOfStores}`;
//   });
//   Promise.all(regionalsStoreCount).then((result) => console.log(result));

//   res.json({ regionals });
// };

exports.storeSelect = async (req, res) => {
  const allStoresCount = await getCountOfAllStores();

  const regionals = await getCountOfStoresByManagers();
  const individualBranches = await getDb()
    .collection('stores')
    .find({})
    .sort({ storeName: 1 })
    .map(({ storeName, storeId: id }) => ({
      title: storeName,
      type: 'individual',
      id,
    }))
    .toArray();

  res.json([
    { title: `Všechny pobočky (${allStoresCount})`, type: 'group', id: 'all' },
    ...regionals,
    ...individualBranches,
  ]);
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
