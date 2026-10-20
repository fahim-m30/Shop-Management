const express = require('express');
const router = express.Router();
const { addSales, getSales, deleteSales } = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

router.post('/', protect, addSales);
router.get('/', protect, getSales);
router.delete('/:id', protect, deleteSales);

module.exports = router;
