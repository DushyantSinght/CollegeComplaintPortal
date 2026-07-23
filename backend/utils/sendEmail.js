const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  // If email credentials aren't set, skip silently (useful for local dev/demo)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email skipped - no credentials set] Would send to ${to}: ${subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });
};

module.exports = sendEmail;
