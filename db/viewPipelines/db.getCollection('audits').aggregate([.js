db.getCollection('audits').aggregate([
  { $unwind: '$results' },
  {
    $group: {
      _id: { categoryPoint: '$results.categoryPoint' },
      deficiencies: {
        $sum: {
          $cond: [{ $eq: ['$results.accepted', false] }, 1, 0],
        },
      },
    },
  },
  { $sort: { '_id.categoryPoint': 1 } },
])