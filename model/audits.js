const { getDb } = require('../db/index');
const { ObjectId } = require('mongodb');

exports.getAuditResults = (storeId, { start, stop }) => {
  const query = {
    storeId,
    date: { $gte: new Date(start), $lte: new Date(stop) },
  };

  return getDb().collection('audits').find(query).toArray();
};

exports.getAuditById = (id) =>
  getDb()
    .collection('audits')
    .findOne({
      _id: ObjectId(id),
    });

exports.getLastSavedAudit = (storeId) =>
  getDb().collection('audits').find({ storeId }).sort({ date: -1 }).next();

exports.getNumOfDeficienciesRepetitions = async (audit, categoryPointId) => {
  const previousAudit = await getPreviousAudit(audit);
  const { unacceptedInARow } = findCategoryPoint(
    previousAudit,
    categoryPointId
  );

  return unacceptedInARow;
};

exports.saveAudit = (audit) =>
  getDb()
    .collection('audits')
    .replaceOne({ _id: audit._id }, audit)
    .then(({ result: { n, nModified, ok } }) => {
      if (n === 1 && nModified === 1 && ok === 1) {
        return { success: true };
      }
      return { success: false };
    });

const getPreviousAudit = ({ date: currentAuditDate, storeId }) =>
  getDb()
    .collection('audits')
    .find({ date: { $lt: currentAuditDate }, storeId })
    .sort({ date: -1 })
    .next();

const findCategoryPoint = (audit, categoryPointId) => {
  const categoryId = Number(categoryPointId.slice(1, 3));
  const category = audit.categories.find(
    (category) => category.categoryId == categoryId
  );
  const categoryPoint = category.categoryPoints.find(
    (categoryPoint) => categoryPoint.id === categoryPointId
  );
  return categoryPoint;
};
