const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  trustedContacts: [
    {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);