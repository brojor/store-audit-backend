const { insertEmptyIfMissing } = require('../utils/utils');
// const seed = require('../seed.json');
const { getStoresByUser } = require('../model/stores');
const {
  getAuditResults,
  getAuditById,
  getLastSavedAudit,
  saveAudit,
  thisMonthAlreadyDone,
  insertAudit,
  getUnacceptedPoints,
} = require('../model/audits');
const { getWeights } = require('../model/points');
const { Audit, CategoryPoint } = require('../audit');

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

  const auditData = await getAuditById(auditId);
  const audit = new Audit(auditData);

  // only the last audit can be changed
  const isLast = await isLastSavedAudit(audit);
  if (!isLast) {
    return res.json({ success: false });
  }

  await audit.toggleResult(categoryPointId);

  saveAudit(audit)
    .then((result) => res.json(result))
    .catch((err) => console.log(err));
};

async function createAudit({ weights, storeId, results, auditor, date }) {
  const lastNotAcceptedPoints = await getUnacceptedPoints(storeId);
  const audit = new Audit({ auditor, date, storeId });

  Object.entries(results).forEach(([id, { accepted, comment }]) => {
    audit.addCategoryPoint(
      new CategoryPoint({
        id,
        accepted,
        comment,
        lastNotAcceptedPoints,
        weight: weights[id],
      })
    );
  });
  return audit;
}

async function isLastSavedAudit(audit) {
  const lastAuditInDb = await getLastSavedAudit(audit.storeId);
  return lastAuditInDb._id.toString() === audit._id.toString();
}
