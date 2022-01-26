const { response } = require('express');
const { getStoresByUser } = require('../model/stores');

exports.aggregatedProtect = (req, res, next) => {
  const { role } = req.user;
  const { regionScope } = req.params;
  // topManager can see everything
  if (role === 'topManagement') {
    return next();
  }
  // regionalManager can see custom branches
  if (role === 'regionalManager' && regionScope === req.user._id.toString()) {
    return next();
  }
  res.status(401);
  next(new Error('Not authorized to access this route'));
};
exports.individualProtect = async (req, res, next) => {
  const { role } = req.user;
  const { storeId } = req.params;
  // topManager can see everything
  if (role === 'topManagement') {
    return next();
  }
  // regionalManager can see custom branches
  if (role === 'regionalManager') {
    const stores = await getStoresByUser(req.user);
    if (stores.includes(storeId)) {
      return next();
    }
  }
  // storeManager can see the custom branch
  if (role === 'storeManager') {
    const [store] = await getStoresByUser(req.user);
    if (store === storeId) {
      return next();
    }
  }
  res.status(401);
  next(new Error('Not authorized to access this route'));
};
