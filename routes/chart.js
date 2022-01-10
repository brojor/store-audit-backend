const router = require('express').Router();

const { deficiencies, storeSelect } = require('../controllers/summary');

// const { storeSelect } = require('../controllers/summary');

router.get('/store-filter-options', storeSelect);
router.get('/:type/:id', deficiencies);

module.exports = router;
