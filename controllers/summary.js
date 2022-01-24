const { getStoresByUser, getStoresInRegion } = require('../model/stores');

exports.storeSelect = async (req, res) => {
  const { role } = req.user;
  const stores = await getStoresByUser(req.user, 'titleAndId');
  switch (role) {
    case 'topManagement':
      const regionals = await getStoresInRegion();
      return res.json([
        {
          title: `Všechny pobočky (${stores.length})`,
          type: 'group',
          id: 'all',
        },
        ...regionals,
        ...stores,
      ]);
    case 'regionalManager':
      return res.json([
        {
          title: `Všechny pobočky (${stores.length})`,
          type: 'group',
          id: req.user._id,
        },
        ...stores,
      ]);
    case 'storeManager':
      return res.json([...stores]);
    default:
      throw new Error('Invalid role');
  }
};
