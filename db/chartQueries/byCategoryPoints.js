module.exports = [
  { $unwind: '$categories' },
  { $unwind: '$categories.categoryPoints' },
  {
    $group: {
      _id: '$categories.categoryPoints.id',
      count: { $sum: { $cond: ['$categories.categoryPoints.accepted', 0, 1] } },
    },
  },
  {
    $lookup: {
      from: 'points',
      localField: '_id',
      foreignField: '_id',
      as: 'info',
    },
  },
  { $unwind: '$info' },
  {
    $project: {
      deficiencies: '$count',
      _id: 0,
      id: '$_id',
      label: '$info.label',
    },
  },
] ;
