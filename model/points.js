const { getDb } = require('../db/index');

exports.getWeights = () =>
  getDb()
    .collection('points')
    .find({})
    .toArray()
    .then((points) =>
      points.reduce((result, { _id, weight }) => {
        result[_id] = weight;
        return result;
      }, {})
    );
exports.getListOfPointsIds = () =>
  getDb()
    .collection('points')
    .find({})
    .map((categoryPoint) => categoryPoint._id)
    .toArray();
