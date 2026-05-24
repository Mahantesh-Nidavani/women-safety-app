const express = require('express');
const router = express.Router();
const {
  getContacts,
  addContact,
  updateContact,
  deleteContact
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getContacts);
router.post('/', protect, addContact);
router.put('/:id', protect, updateContact);
router.delete('/:id', protect, deleteContact);

module.exports = router;