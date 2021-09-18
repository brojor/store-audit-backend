db.createView('audits_view', 'audits', [
  {
    $unwind: '$results',
  },
  {
    $lookup: {
      from: 'categoryNames',
      let: {
        categoryNum: '$results.category',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$_id', '$$categoryNum'],
            },
          },
        },
        {
          $project: {
            _id: 0.0,
            categoryName: '$categoryName',
          },
        },
      ],
      as: 'catNames',
    },
  },
  {
    $unwind: '$catNames',
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
            title: '$title',
            comment: '$comment',
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
      'results.categoryName': '$catNames.categoryName',
      'results.accepted': 1.0,
      'results.categoryPoint': 1.0,
      'results.points.earned': '$points.earned',
      'results.points.available': '$points.available',
      'results.title': '$points.title',
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
        categoryName: '$results.categoryName',
      },
      totalEarned: {
        $sum: '$results.points.earned',
      },
      totalAvailable: {
        $sum: '$results.points.available',
      },
      items: {
        $push: {
          categoryPoint: '$results.categoryPoint',
          accepted: '$results.accepted',
          points: '$results.points',
          title: '$results.title',
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
      kategories: {
        $push: {
          categoryNum: '$_id.categoryNum',
          categoryName: '$_id.categoryName',
          items: '$items',
          totalEarned: '$totalEarned',
          totalAvailable: '$totalAvailable',
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
]);
