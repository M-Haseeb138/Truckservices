const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"TruckServices" <${process.env.EMAIL_USER}>`, // Nice From name
    to: options.to,
    subject: options.subject,
    html: options.html, // 🔥 Using HTML now instead of text
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
