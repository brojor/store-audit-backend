const { response } = require('express');
const { getStoresByUser } = require('../model/stores');

exports.chartProtect = async (req, res, next) => {
  const { id, type } = req.params;
  const { role } = req.user;

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
    const stores = await getStoresByUser(req.user._id, role);
    if (stores.includes(id)) {
      return next();
    }
  }
  /**
   * storeManager can see the custom branch
   */
  if (role === 'storeManager') {
    const [store] = await getStoresByUser(req.user._id, role);
    if (store === id) {
      return next();
    }
  }

  const error = new Error('Not authorized to access this route');
  res.status(401);
  next(error);
};
