const { getDb } = require('../db/index');
const { byCategory, byCategoryPoints } = require('../db/chartQueries');

exports.chart = async (req, res) => {
  const { before, after, detail, sort } = req.query;
  const baseQuery = detail === 'points' ? byCategoryPoints : byCategory;
  const finalQuery = [
    {
      $match: {
        date: { $gte: new Date(after), $lte: new Date(before) },
      },
    },
    ...baseQuery,
    { $sort: { [`${sort}`]: 1 } },
  ];
  const result = await getDb()
    .collection('audits')
    .aggregate(finalQuery)
    .toArray();

  const newResult = result.map((item) => {
    const id =
      detail === 'points'
        ? item.id.replace('C', 'K').replace('P', 'B')
        : `Kat. ${item.id}`;
    return { ...item, id };
  });
  res.json(newResult);
};
