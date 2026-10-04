async function sendEmail({ to, subject, text, html } = {}) {
  if (!to || !subject) throw new Error('Email recipient and subject are required');
  // Adapter point: connect Nodemailer/SES/SendGrid/etc. in production.
  return { accepted: [to], subject, text: text || '', html: html || '', queued: false };
}

function templates() {
  return {
    verification: (name, link) => ({ subject:'Verify your GHAR account', text:`Hello ${name || 'there'}, verify your account: ${link}` }),
    passwordReset: (name, link) => ({ subject:'Reset your GHAR password', text:`Hello ${name || 'there'}, reset your password: ${link}` })
  };
}

module.exports = { sendEmail, templates };
