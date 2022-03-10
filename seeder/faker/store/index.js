const {
  getRandomInt,
  getCity,
  createStoreName,
  createStoreAddress,
} = require('./utils');

const company = 'supercompany';

exports.createStore = function createStore(storeManager, regionalManager) {
  const storeId = `R${getRandomInt(1000, 9999)}`;
  const city = getCity();
  const storeName = createStoreName(city);
  const address = createStoreAddress(city);
  return {
    storeId,
    storeName,
    address,
    storeManager: storeManager._id,
    regionalManager: regionalManager._id,
  };
};
