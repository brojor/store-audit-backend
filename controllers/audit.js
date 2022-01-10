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
  // TODO - lze měnit jen audit náležící přihlášenému uživateli
  const auditsCollection = getDb().collection('audits');
  const editedAudit = await auditsCollection.findOne({
    _id: ObjectID(req.params.auditId),
  });
  const [lastAuditInStore] = await auditsCollection
    .find({ storeId: editedAudit.storeId })
    .sort({ date: -1 })
    .toArray();
  // only the last audit can be changed
  if (lastAuditInStore._id.toString() !== editedAudit._id.toString()) {
    return res.json({ success: false });
  }

  const { categoryPointId } = req.body;

  const { category, categoryPoint } = findCategoryAndPoint(
    editedAudit,
    categoryPointId
  );
  const previousNumOfRepetitions = await getNumOfRepetitions(
    editedAudit.date,
    categoryPointId
  );

  categoryPoint.accepted = !categoryPoint.accepted;

  if (categoryPoint.accepted) {
    delete categoryPoint.unacceptedInARow;
  } else {
    categoryPoint.unacceptedInARow = previousNumOfRepetitions + 1 || 1;
  }

  const weight = seed.weights[categoryPointId];
  changeScore(categoryPoint.accepted, category.score, weight);
  changeScore(categoryPoint.accepted, editedAudit.totalScore, weight);

  auditsCollection
    .save(editedAudit)
    .then(({ result }) => console.log(result))
    .catch((err) => console.log(err));

  res.json({ success: true });
};

async function buildDesktopView(results, auditsCollection, storeId) {
  const categories = [];
  const totalScore = { available: 0, earned: 0, perc: 0 };
  const unacceptedPoints = await getUnacceptedPoints(auditsCollection, storeId);
  console.log({ unacceptedPoints });

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

function changeScore(accepted, target, numOfPoints) {
  accepted ? (target.earned += numOfPoints) : (target.earned -= numOfPoints);
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

async function getNumOfRepetitions(actualAuditDate, categoryPointId) {
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

function findCategoryAndPoint(audit, categoryPointId) {
  const categoryId = Number(categoryPointId.slice(1, 3));
  const category = audit.categories.find(
    (category) => category.categoryId === categoryId
  );
  const categoryPoint = category.categoryPoints.find(
    (catPoint) => catPoint.id === categoryPointId
  );
  return { category, categoryPoint };
}

exports.buildDesktopView = buildDesktopView;
