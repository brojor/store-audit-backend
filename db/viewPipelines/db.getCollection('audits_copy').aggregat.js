db.getCollection('audits_copy').aggregate([
  { $match: { storeId: 'R4105' } },
  { $unwind: '$results' },
  {
    $group: {
      _id: { category: '$results.category' },
      deficiencies: {
        $sum: {
          $cond: [{ $eq: ['$results.accepted', false] }, 1, 0],
        },
      },
    },
  },
  { $sort: { '_id.category': 1 } },
]);
