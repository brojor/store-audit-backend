db.getCollection('audits_fake').aggregate([
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
  {
    $lookup: {
      from: 'points',
      localField: '_id.categoryPoint',
      foreignField: '_id',
      as: 'info',
    },
  },
  { $unwind: '$info' },
  {
    $project: {
      deficiencies: 1,
      _id: 0,
      id: '$_id.categoryPoint',
      label: '$info.label',
    },
  },
]);

db.getCollection('desktop_view_new').aggregate([
  { $unwind: '$categories' },
  { $unwind: '$categories.categoryPoints' },
  {
    $group: {
      _id: { categoryPoint: '$categories.categoryPoints.id' },
      deficiencies: {
        $sum: {
          $cond: [
            { $eq: ['$categories.categoryPoints.accepted', false] },
            1,
            0,
          ],
        },
      },
    },
  },
  { $sort: { '_id.categoryPoint': 1 } },
  {
    $lookup: {
      from: 'points',
      localField: '_id.categoryPoint',
      foreignField: '_id',
      as: 'info',
    },
  },
  { $unwind: '$info' },
  {
    $project: {
      deficiencies: 1,
      _id: 0,
      id: '$_id.categoryPoint',
      label: '$info.label',
    },
  },
]);
