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

// (POST) save results of audit from mobile app
exports.results = async (req, res, next) => {
  const auditsCollection = getDb().collection('audits');
  const { storeId, results, date } = req.body;
  const auditor = req.user._id;
  const alreadyExists = await auditExistForThisMonth(
    auditsCollection,
    storeId,
    date
  );

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
        date: new Date(date),
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
// [GET] serve results from db
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
// [POST] - resultCorrection from desktop view
exports.changeResult = async (req, res) => {
  // TODO
  // - lze měnit pouze poslední audit
  // - lze měnit jen audit náležící přihlášenému uživateli
  const { auditId } = req.params;
  const { categoryPointId } = req.body;
  const weight = seed.weights[categoryPointId];
  const categoryId = Number(categoryPointId.slice(1, 3));
  const auditsCollection = getDb().collection('audits');
  const audit = await auditsCollection.findOne({ _id: ObjectID(auditId) });
  const { categories } = audit;
  const category = categories.find(
    (category) => category.categoryId === categoryId
  );

  const categoryPoint = category.categoryPoints.find(
    (catPoint) => catPoint.id === categoryPointId
  );

  const previousNumOfRepetitions = await getNumOfRecurring(audit.date, categoryPointId);

  categoryPoint.accepted = !categoryPoint.accepted;
  const unacceptedInARow = !categoryPoint.accepted
    ? previousNumOfRepetitions + 1 || 1
    : null;

  if (categoryPoint.accepted) {
    delete categoryPoint.unacceptedInARow;
  } else {
    categoryPoint.unacceptedInARow = unacceptedInARow;
  }

  const operation = categoryPoint.accepted ? 'add' : 'substract';

  changeScore(operation, category.score, weight);
  changeScore(operation, audit.totalScore, weight);

  auditsCollection
    .save(audit)
    .then(({ result }) => console.log(result))
    .catch((err) => console.log(err));

  res.json({ success: true });
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

function changeScore(operation, target, numOfPoints) {
  const operations = {
    add: () => (target.earned += numOfPoints),
    substract: () => (target.earned -= numOfPoints),
  };
  operations[operation]();
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

function auditExistForThisMonth(collection, storeId, date) {
  date = new Date(date);
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  return collection.find({ date: { $gte: firstDayOfMonth }, storeId }).count();
}

async function getUnacceptedPoints(collection, storeId) {
  const [lastAudit] = await collection
    .find({ storeId })
    .sort({ date: -1 })
    .toArray();
  if (!lastAudit) {
    return {};
  }
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

async function getNumOfRecurring(actualAuditDate, categoryPointId) {
  const auditsCollection = getDb().collection('audits');
  const categoryId = Number(categoryPointId.slice(1, 3));
  const [previousAudit] = await auditsCollection
    .find({ date: { $lt: actualAuditDate } })
    .sort({ date: -1 })
    .toArray();
  const category = previousAudit.categories.find(
    (category) => category.categoryId == categoryId
  );
  const categoryPoint = category.categoryPoints.find(
    (categoryPoint) => categoryPoint.id === categoryPointId
  );
  return categoryPoint.unacceptedInARow;
}
