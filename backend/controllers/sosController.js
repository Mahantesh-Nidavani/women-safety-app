const User = require('../models/User');
const SOSAlert = require('../models/SOSAlert');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Setup Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// @route POST /api/sos/trigger
const triggerSOS = async (req, res) => {
  const { lat, lng } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user.trustedContacts || user.trustedContacts.length === 0) {
      return res.status(400).json({ message: 'No trusted contacts found!' });
    }

    const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const contactsNotified = [];

    for (const contact of user.trustedContacts) {
      // Send SMS via Twilio
      try {
        await twilioClient.messages.create({
          body: `🚨 EMERGENCY ALERT! ${user.name} needs help! Live Location: ${locationLink}`,
          from: process.env.TWILIO_PHONE,
          to: contact.phone
        });
      } catch (smsError) {
        console.log(`SMS failed for ${contact.name}: ${smsError.message}`);
      }

      // Send Email
      if (contact.email) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: contact.email,
            subject: `🚨 EMERGENCY ALERT - ${user.name} needs help!`,
            html: `
              <h2 style="color:red;">🚨 EMERGENCY ALERT!</h2>
              <p><strong>${user.name}</strong> needs immediate help!</p>
              <p><strong>📍 Live Location:</strong> 
                <a href="${locationLink}">Click here to view location</a>
              </p>
              <p><strong>📞 Contact:</strong> ${user.phone}</p>
              <p style="color:red;">
                <strong>Please respond immediately!</strong>
              </p>
            `
          });
        } catch (emailError) {
          console.log(`Email failed for ${contact.name}: ${emailError.message}`);
        }
      }

      contactsNotified.push(contact.name);
    }

    // Save SOS Alert to database
    const alert = await SOSAlert.create({
      userId: user._id,
      location: { lat, lng },
      contactsNotified,
      status: 'sent'
    });

    res.status(201).json({
      message: '🚨 SOS Alert sent successfully!',
      contactsNotified,
      location: { lat, lng },
      alertId: alert._id
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/sos/history
const getSOSHistory = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { triggerSOS, getSOSHistory };