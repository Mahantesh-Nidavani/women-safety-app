const User = require('../models/User');

// @route GET /api/contacts
// Get all trusted contacts
const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('trustedContacts');
    res.json(user.trustedContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/contacts
// Add a trusted contact
const addContact = async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    const user = await User.findById(req.user.id);

    // Max 5 contacts check
    if (user.trustedContacts.length >= 5) {
      return res.status(400).json({ message: 'Maximum 5 trusted contacts allowed' });
    }

    user.trustedContacts.push({ name, phone, email });
    await user.save();

    res.status(201).json(user.trustedContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/contacts/:id
// Update a trusted contact
const updateContact = async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    const user = await User.findById(req.user.id);

    const contact = user.trustedContacts.id(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    contact.name = name || contact.name;
    contact.phone = phone || contact.phone;
    contact.email = email || contact.email;

    await user.save();
    res.json(user.trustedContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/contacts/:id
// Delete a trusted contact
const deleteContact = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.trustedContacts = user.trustedContacts.filter(
      (contact) => contact._id.toString() !== req.params.id
    );

    await user.save();
    res.json({ message: 'Contact removed', contacts: user.trustedContacts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getContacts, addContact, updateContact, deleteContact };