const express = require('express');
const router = express.Router();
const { triggerSOS, getSOSHistory } = require('../controllers/sosController');
const { protect } = require('../middleware/authMiddleware');

router.post('/trigger', protect, triggerSOS);
router.get('/history', protect, getSOSHistory);

module.exports = router;