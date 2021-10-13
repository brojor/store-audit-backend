const { getDb } = require('../db/index');
const ObjectID = require('mongodb').ObjectID;
const { insertEmptyIfMissing } = require('../utils/utils');
const seed = require('../seed.json');

exports.stores = async (req, res) => {
  const { user } = req;
  const storesCollection = getDb().collection('stores');
  let stores;
  if (user.role === 'topManagement') {
    stores = await storesCollection
      .find({})
      .map((store) => ({ name: store.storeName, id: store.storeId }))
      .sort({ storeName: 1 })
      .toArray();
  } else {
    stores = await storesCollection
      .find({ [user.role]: ObjectID(user._id) })
      .map((store) => ({ name: store.storeName, id: store.storeId }))
      .sort({ storeName: 1 })
      .toArray();
  }
  res.json({ stores });
};

exports.results = async (req, res, next) => {
  const auditsCollection = getDb().collection('audits');
  const { storeId, results } = req.body;
  const auditor = req.user._id;
  const alreadyExists = await auditExistForThisMonth(auditsCollection, storeId);

  if (alreadyExists) {
    res.json({
      success: false,
      message: 'V této prodejně byl již tento měsíc audit proveden.',
    });
  } else {
    const { categories, totalScore } = await buildDesktopView(
      results,
      auditsCollection,
      storeId
    );

    auditsCollection
      .insertOne({
        auditor,
        date: new Date(),
        storeId,
        categories,
        totalScore,
      })
      .then(() => {
        res.json({ success: true });
      })
      .catch((err) => {
        const error = new Error(`Error while inserting into database: ${err}`);
        res.status(500);
        next(error);
      });
  }
};

exports.audits = async (req, res) => {
  const { storeId } = req.params;
  const range = {
    start: new Date(req.query.start),
    stop: new Date(req.query.stop),
  };

  const auditsCollection = getDb().collection('audits');
  const query = {
    storeId,
    date: { $gte: range.start, $lte: range.stop },
  };
  const audits = await auditsCollection.find(query).toArray();
  const finalResult = insertEmptyIfMissing(audits, range);
  res.json(finalResult);
};

async function buildDesktopView(results, auditsCollection, storeId) {
  const categories = [];
  const totalScore = { available: 0, earned: 0, perc: 0 };
  const unacceptedPoints = await getUnacceptedPoints(auditsCollection, storeId);

  Object.entries(results).forEach(([id, result]) => {
    const categoryId = Number(id.slice(1, 3));
    const categoryPointId = Number(id.slice(4));
    const { accepted, comment } = result;
    const currentCategory = getCategoryRef(categories, categoryId);
    const numOfPoints = seed.weights[id];

    addScore(currentCategory.score, accepted, numOfPoints);
    addScore(totalScore, accepted, numOfPoints);

    const unacceptedInARow = !accepted ? unacceptedPoints[id] + 1 || 1 : null;

    currentCategory.categoryPoints[categoryPointId - 1] = {
      id,
      accepted,
      ...(comment ? { comment } : {}),
      ...(unacceptedInARow ? { unacceptedInARow } : {}),
    };
  });
  return { categories, totalScore };
}

function addScore(target, accepted, numOfPoints) {
  target.available += numOfPoints;
  target.earned += accepted ? numOfPoints : 0;
  target.perc = (100 * target.earned) / target.available;
}

function getCategoryRef(categories, categoryId) {
  if (!categories[categoryId - 1]) {
    categories[categoryId - 1] = {
      categoryId,
      categoryPoints: [],
      score: { available: 0, earned: 0 },
    };
  }
  return categories[categoryId - 1];
}

function auditExistForThisMonth(collection, storeId) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return collection.find({ date: { $gte: firstDayOfMonth }, storeId }).count();
}

async function getUnacceptedPoints(collection, storeId) {
  const [lastAudit] = await collection
    .find({ storeId })
    .sort({ date: -1 })
    .toArray();
  const { _id } = lastAudit;
  return collection
    .aggregate([
      { $match: { _id } },
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
    .toArray()
    .then(([{ unacceptedPoints }]) => {
      return unacceptedPoints.reduce((obj, point) => {
        obj[point.id] = point.numOfRepetitions;
        return obj;
      }, {});
    });
}
