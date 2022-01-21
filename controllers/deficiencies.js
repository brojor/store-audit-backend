const baseQuery = require('../db/chartQueries');
const { getDeficiencies, getStoresByUser } = require('../model/stores');

exports.aggregated = async (req, res) => {
  const { regionScope } = req.params;
  const query = createQuery(req.query);

  if (regionScope !== 'all') {
    const stores = await getStoresByUser({
      _id: regionScope,
      role: 'regionalManager',
    });
    query[0].$match.storeId = { $in: stores };
  }
  
  const deficiencies = await getDeficiencies(query);
  // TODO odsrtanit přejmenování, takto má přijít už z Db
  const renamed = renameResults(deficiencies, req.query.detailLevel);
  res.json(renamed);
};

exports.individually = async (req, res) => {
  const { storeId } = req.params;
  const query = createQuery(req.query);
  query[0].$match.storeId = storeId;
  const deficiencies = await getDeficiencies(query);
  // TODO odsrtanit přejmenování, takto má přijít už z Db
  const renamed = renameResults(deficiencies, req.query.detailLevel);
  res.json(renamed);
};

function createQuery({
  before,
  after,
  detailLevel = 'categories',
  sortBy = 'id',
}) {
  const result = [
    {
      $match: {
        date: { $gte: new Date(after), $lte: new Date(before) },
      },
    },
    ...baseQuery[detailLevel],
    { $sort: { [`${sortBy}`]: 1 } },
  ];
  return result;
}

function renameResults(results, detailLevel) {
  return results.map((item) => {
    const id =
      detailLevel === 'points'
        ? item.id.replace('C', 'K').replace('P', 'B')
        : `Kategorie ${item.id}`;
    return { ...item, id };
  });
}
