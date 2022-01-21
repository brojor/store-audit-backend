const { response } = require('express');
const { getStoresByUser } = require('../model/stores');

exports.aggregatedProtect = (req, res, next) => {
  const { role } = req.user;
  const { regionScope } = req.params;
  /**
   * topManager can see everything
   */
  if (role === 'topManagement') {
    return next();
  }
  /**
   * regionalManager can see custom branches
   */
  if (role === 'regionalManager' && regionScope === req.user._id.toString()) {
    return next();
  }
  res.status(401);
  next(new Error('Not authorized to access this route'));
};
exports.individualProtect = async (req, res, next) => {
  const { role } = req.user;
  const { storeId } = req.params;
  /**
   * topManager can see everything
   */
  if (role === 'topManagement') {
    return next();
  }
  /**
   * regionalManager can see custom branches
   */
  if (role === 'regionalManager') {
    const stores = await getStoresByUser(req.user);
    if (stores.includes(storeId)) {
      return next();
    }
  }
  /**
   * storeManager can see the custom branch
   */
  if (role === 'storeManager') {
    const [store] = await getStoresByUser(req.user);
    if (store === storeId) {
      return next();
    }
  }
  res.status(401);
  next(new Error('Not authorized to access this route'));
};

exports.chartProtect = async (req, res, next) => {
  console.log('midlewaree!!!!!!!!');

  const { id, type } = req.params;
  const { role } = req.user;

  console.log({ id, id2: req.user.id });
  /**
   * topManager can see everything
   */
  if (role === 'topManagement') {
    return next();
  }
  /**
   * regionalManager can see custom branches aggregated
   */
  if (
    role === 'regionalManager' &&
    type === 'aggregated' &&
    id === req.user._id.toString()
  ) {
    return next();
  }
  /**
   * regionalManager can see custom branches invidually
   */
  if (role === 'regionalManager' && type === 'individual') {
    const stores = await getStoresByUser(req.user);
    if (stores.includes(id)) {
      return next();
    }
  }
  /**
   * storeManager can see the custom branch
   */
  if (role === 'storeManager') {
    const [store] = await getStoresByUser(req.user);
    if (store === id) {
      return next();
    }
  }

  const error = new Error('Not authorized to access this route');
  res.status(401);
  next(error);
};
