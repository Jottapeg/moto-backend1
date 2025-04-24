const twilio = require('twilio');

const sendSMS = async (options) => {
  // Criar cliente Twilio
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // Enviar SMS
  const message = await client.messages.create({
    body: options.message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: options.phone
  });

  console.log(`SMS enviado: ${message.sid}`);
};

module.exports = sendSMS;
