const { insertEmptyIfMissing } = require('../utils/utils');
const seed = require('../seed.json');
const { getStoresByUser } = require('../model/stores');
const {
  getAuditResults,
  getAuditById,
  getLastSavedAudit,
  getNumOfDeficienciesRepetitions,
  saveAudit,
  thisMonthAlreadyDone,
  insertAudit,
} = require('../model/audits');
const { createAudit } = require('../audit');
const { getWeights } = require('../model/points');

exports.stores = async (req, res) => {
  const stores = await getStoresByUser(req.user, 'nameAndId');
  res.json({ stores });
};

// (POST) save results of audit from mobile app
exports.results = async (req, res, next) => {
  const { storeId, results } = req.body;
  const date = new Date(req.body.date);
  const auditor = req.user._id;
  const alreadyExists = await thisMonthAlreadyDone(storeId, date);

  if (alreadyExists) {
    return res.json({
      success: false,
      message: 'V této prodejně byl již tento měsíc audit proveden.',
    });
  }
  const weights = await getWeights();
  const audit = await createAudit({ weights, storeId, results, auditor, date });

  insertAudit(audit)
    .then(() => {
      res.json({ success: true });
    })
    .catch((err) => {
      const error = new Error(`Error while inserting into database: ${err}`);
      res.status(500);
      next(error);
    });
};

// [GET] serve results from db
exports.audits = async (req, res) => {
  const { storeId } = req.params;

  const resultsFromDb = await getAuditResults(storeId, req.query);
  const wholeSemester = insertEmptyIfMissing(resultsFromDb, req.query);

  res.json(wholeSemester);
};

// [POST] - resultCorrection from desktop view
exports.changeResult = async (req, res) => {
  const { auditId } = req.params;
  const { categoryPointId } = req.body;

  const editedAudit = await getAuditById(auditId);
  const lastAuditInDb = await getLastSavedAudit(editedAudit.storeId);
  // only the last audit can be changed
  if (lastAuditInDb._id.toString() !== editedAudit._id.toString()) {
    return res.json({ success: false });
  }

  const { category, categoryPoint } = findCategoryAndPoint(
    editedAudit,
    categoryPointId
  );
  const previousNumOfRepetitions = await getNumOfDeficienciesRepetitions(
    editedAudit,
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

  saveAudit(editedAudit)
    .then((result) => res.json(result))
    .catch((err) => console.log(err));
};

function changeScore(accepted, target, numOfPoints) {
  accepted ? (target.earned += numOfPoints) : (target.earned -= numOfPoints);
  target.perc = (100 * target.earned) / target.available;
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
