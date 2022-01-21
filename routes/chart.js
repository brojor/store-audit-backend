const router = require('express').Router();
const { aggregated, individually } = require('../controllers/deficiencies');
const { storeSelect } = require('../controllers/summary');
const { aggregatedProtect, individualProtect } = require('../middleware/chart');

router.get('/store-filter-options', storeSelect);
router.get('/aggregated/:regionScope', aggregatedProtect, aggregated);
router.get('/individual/:storeId', individualProtect, individually);

module.exports = router;
