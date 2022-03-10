const { getDb } = require('../db/index');
const { ObjectId } = require('mongodb');

exports.getAuditResults = (storeId, { start, end }) => {
  const query = {
    storeId,
    date: { $gte: new Date(start), $lt: new Date(end) },
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

exports.thisMonthAlreadyDone = (storeId, date) => {
  date = new Date(date);
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  return getDb()
    .collection('audits')
    .find({ date: { $gte: firstDayOfMonth }, storeId })
    .count();
};

exports.getUnacceptedPoints = async (storeId) => {
  const lastAudit = await this.getLastSavedAudit(storeId);
  if (!lastAudit) {
    return {};
  }
  return getDb()
    .collection('audits')
    .aggregate([
      { $match: { _id: lastAudit._id } },
      { $unwind: '$categories' },
      { $unwind: '$categories.categoryPoints' },
      {
        $group: {
          _id: '$storeId',
          unacceptedPoints: {
            $push: {
              $cond: [
                { $eq: ['$categories.categoryPoints.accepted', false] },
                {
                  id: '$categories.categoryPoints.id',
                  numOfRepetitions:
                    '$categories.categoryPoints.unacceptedInARow',
                },
                '$$REMOVE',
              ],
            },
          },
        },
      },
      { $project: { _id: 0, unacceptedPoints: 1 } },
    ])
    .map(({ unacceptedPoints }) =>
      unacceptedPoints.reduce((obj, point) => {
        obj[point.id] = point.numOfRepetitions;
        return obj;
      }, {})
    )
    .next();
};

exports.insertAudit = (audit) =>
  getDb().collection('audits').insertOne(audit);

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
