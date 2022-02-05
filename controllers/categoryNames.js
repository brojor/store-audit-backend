const { getNames } = require('../model/categories');

exports.getCategoryNames = async (req, res) => {
  const names = await getNames();
  res.json(names);
};
