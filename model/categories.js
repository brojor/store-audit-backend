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
          'categoryPoints.name': '$categoryPoints.label',
          'categoryPoints.key': '$categoryPoints._id',
        },
      },
      {
        $group: {
          _id: '$name',
          name: { $first: '$name' },
          key: { $first: '$_id' },
          categoryPoints: { $push: '$categoryPoints' },
        },
      },
      { $sort: { key: 1 } },
      { $project: { _id: 0 } },
    ])
    .toArray();
