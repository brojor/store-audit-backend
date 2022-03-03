const { getDb } = require('../db/index');

exports.getNames = () =>
  getDb()
    .collection('categories')
    .aggregate([
      {
        $lookup: {
          from: 'points',
          localField: '_id',
          foreignField: 'category',
          as: 'categoryPoints',
        },
      },
      { $unwind: '$categoryPoints' },
      {
        $project: {
          name: 1,
          weight: 1,
          'categoryPoints.name': '$categoryPoints.label',
          'categoryPoints.id': '$categoryPoints._id',
          'categoryPoints.weight': 1,
        },
      },
      {
        $group: {
          _id: '$name',
          name: { $first: '$name' },
          id: { $first: '$_id' },
          categoryPoints: { $push: '$categoryPoints' },
        },
      },
      { $sort: { id: 1 } },
      { $project: { _id: 0 } },
    ])
    .toArray();
