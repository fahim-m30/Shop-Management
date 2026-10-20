const express = require('express');
const router = express.Router();
const { addStock, getStock, deleteStock } = require('../controllers/stockController');
const { protect } = require('../middleware/auth');

router.post('/', protect, addStock);
router.get('/', protect, getStock);
router.delete('/:id', protect, deleteStock);

module.exports = router;
