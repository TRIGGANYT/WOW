const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  authMethod: 'LOGIN',
});

// Debug: log SMTP config on startup (mask password)
const passLen = (process.env.SMTP_PASS || '').length;
console.log(
  `SMTP config: host=${process.env.SMTP_HOST}, port=${process.env.SMTP_PORT}, user=${process.env.SMTP_USER}, pass=${'*'.repeat(passLen)} (${passLen} chars)`,
);

/**
 * Send a 6-digit verification code to a user's email
 */
async function sendVerificationEmail(toEmail, code) {
  const mailOptions = {
    from: `"WOW - sei WOW" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Dein Verifizierungscode – WOW',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #fff; border-radius: 16px;">
        <h2 style="text-align: center; background: linear-gradient(135deg, #9d4edd, #48bfe3); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Willkommen bei WOW!
        </h2>
        <p style="text-align: center; color: #ccc; font-size: 14px;">
          Verwende den folgenden Code, um deine Email-Adresse zu bestätigen:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; background: linear-gradient(135deg, #9d4edd, #48bfe3); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            ${code}
          </span>
        </div>
        <p style="text-align: center; color: #888; font-size: 12px;">
          Der Code ist 15 Minuten gültig.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Generate a random 6-digit verification code
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { sendVerificationEmail, generateCode };
