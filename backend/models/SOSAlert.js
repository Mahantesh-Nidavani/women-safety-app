const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  contactsNotified: [String],
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent'
  }
}, { timestamps: true });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);