db.createView('desktop_view', 'audits', [
  {
    $unwind: '$results',
  },
  {
    $lookup: {
      from: 'category_points_info',
      let: {
        res: '$results',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: ['$category', '$$res.category'],
                },
                {
                  $eq: ['$categoryPoint', '$$res.categoryPoint'],
                },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0.0,
            available: '$weight',
            earned: {
              $cond: [
                {
                  $eq: ['$$res.accepted', true],
                },
                '$weight',
                0.0,
              ],
            },
            comment: 1.0,
          },
        },
      ],
      as: 'points',
    },
  },
  {
    $unwind: '$points',
  },
  {
    $project: {
      auditor: 1.0,
      date: 1.0,
      storeId: 1.0,
      'results.category': 1.0,
      'results.accepted': 1.0,
      'results.categoryPoint': 1.0,
      'results.points.earned': '$points.earned',
      'results.points.available': '$points.available',
      'results.comment': 1.0,
    },
  },
  {
    $group: {
      _id: {
        _id: '$_id',
        date: '$date',
        storeId: '$storeId',
        categoryNum: '$results.category',
      },
      totalEarned: {
        $sum: '$results.points.earned',
      },
      totalAvailable: {
        $sum: '$results.points.available',
      },
      categoryPoints: {
        $push: {
          categoryPoint: '$results.categoryPoint',
          accepted: '$results.accepted',
          comment: '$results.comment',
        },
      },
    },
  },
  {
    $addFields: {
      totalPerc: {
        $divide: [
          {
            $multiply: [100.0, '$totalEarned'],
          },
          '$totalAvailable',
        ],
      },
    },
  },
  {
    $sort: {
      '_id.categoryNum': 1.0,
    },
  },
  {
    $group: {
      _id: '$_id._id',
      date: {
        $first: '$_id.date',
      },
      storeId: {
        $first: '$_id.storeId',
      },
      totalAvailable: {
        $sum: '$totalAvailable',
      },
      totalEarned: {
        $sum: '$totalEarned',
      },
      categories: {
        $push: {
          categoryNum: '$_id.categoryNum',
          categoryPoints: '$categoryPoints',
          totalPerc: '$totalPerc',
        },
      },
    },
  },
  {
    $addFields: {
      totalPerc: {
        $divide: [
          {
            $multiply: [100.0, '$totalEarned'],
          },
          '$totalAvailable',
        ],
      },
    },
  },
  {
    $project: {
      totalAvailable: 0.0,
      totalEarned: 0.0,
    },
  },
]);