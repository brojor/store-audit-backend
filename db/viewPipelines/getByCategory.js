db.getCollection('desktop_view_new').aggregate([
  { $unwind: '$categories' },
  { $unwind: '$categories.categoryPoints' },
  {
    $group: {
      _id: { category: '$categories.categoryId' },
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
  { $sort: { '_id.category': 1 } },
  {
    $lookup: {
      from: 'categories',
      localField: '_id.category',
      foreignField: '_id',
      as: 'info',
    },
  },
  { $unwind: '$info' },
  {
    $project: {
      deficiencies: 1,
      _id: 0,
      id: '$_id.category',
      label: '$info.name',
    },
  },
]);
