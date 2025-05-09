const transporter = require("../config/nodemailer");

const sendEmail = async (options) => {
  const mailOptions = {
    from: `"TruckServices" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
