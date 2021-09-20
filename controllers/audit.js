const { getDb } = require('../db/index');
const ObjectID = require('mongodb').ObjectID;
const { insertEmptyIfMissing } = require('../utils/utils');

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
  const { storeId, results } = req.body;
  const auditor = req.user._id;
  const date = new Date();

  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  console.log({ firstDayOfMonth });

  const auditsCollection = getDb().collection('audits');

  auditsCollection
    .find({ date: { $gte: firstDayOfMonth }, storeId })
    .count()
    .then((count) => {
      if (count) {
        res.json({
          success: false,
          message: 'V této prodejně byl již tento měsíc audit proveden.',
        });
      } else {
        auditsCollection
          .insertOne({ storeId, results, auditor, date })
          .then(({ result }) => {
            if (result.ok && result.n === 1) {
              res.json({ success: true });
            } else {
              const error = new Error(
                'An error occurred while inserting audit results into the database'
              );
              res.status(500);
              next(error);
            }
          })
          .catch((err) => {
            const error = new Error(
              `Error while inserting into database: ${err}`
            );
            res.status(500);
            next(error);
          });
      }
    })
    .catch((err) => {
      const error = new Error(
        `Error while finding existing audits reports in current month: ${err}`
      );
      res.status(500);
      next(error);
    });
};

exports.audits = async (req, res) => {
  const { storeId } = req.params;
  const range = {
    start: new Date(req.query.start),
    stop: new Date(req.query.stop),
  };
  console.log({ storeId });
  console.log({ range });

  const auditsCollection = getDb().collection('desktop_view');
  const query = {
    storeId,
    date: { $gte: range.start, $lte: range.stop },
  };
  const audits = await auditsCollection.find(query).toArray();
  const finalResult = insertEmptyIfMissing(audits, range);
  console.log({ finalResult });
  res.json(finalResult);
};
