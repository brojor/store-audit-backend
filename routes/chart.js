const router = require('express').Router();

const { deficiencies, storeSelect } = require('../controllers/summary');
const { chartProtect } = require('../middleware/chart');

// const { storeSelect } = require('../controllers/summary');

router.get('/store-filter-options', storeSelect);
router.get('/:type/:id', chartProtect, deficiencies);

module.exports = router;
