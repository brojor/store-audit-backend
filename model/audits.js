const { getDb } = require('../db/index');

exports.getAuditResults = (storeId, { start, stop }) => {
  const query = {
    storeId,
    date: { $gte: new Date(start), $lte: new Date(stop) },
  };

  return getDb().collection('audits').find(query).toArray();
};
