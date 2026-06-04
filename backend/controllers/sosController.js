const User = require('../models/User');
const SOSAlert = require('../models/SOSAlert');
const nodemailer = require('nodemailer');

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send Email
const sendEmail = async (contact, user, locationLink) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: contact.email,
      subject: `🚨 EMERGENCY ALERT - ${user.name} needs help!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ef4444; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🚨 EMERGENCY ALERT!</h1>
          </div>
          <div style="padding: 20px; background-color: #fff3f3;">
            <h2 style="color: #ef4444;">${user.name} needs immediate help!</h2>
            <p style="font-size: 16px;">Your trusted contact has triggered an SOS alert.</p>
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>📍 Live Location:</strong></p>
              <a href="${locationLink}"
                 style="background-color: #ef4444; color: white; padding: 10px 20px;
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                View Live Location on Maps
              </a>
            </div>
            <p><strong>📞 Contact Number:</strong> ${user.phone}</p>
            <p style="color: #ef4444; font-weight: bold; font-size: 18px;">
              Please respond immediately!
            </p>
          </div>
        </div>
      `
    });
    console.log(`✅ Email sent to ${contact.name}: ${contact.email}`);
    return true;
  } catch (error) {
    console.log(`❌ Email failed for ${contact.name}: ${error.message}`);
    return false;
  }
};

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

    // Send Email to ALL contacts
    for (const contact of user.trustedContacts) {
      if (contact.email) {
        await sendEmail(contact, user, locationLink);
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
      message: '🚨 SOS Alert sent successfully to all contacts!',
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