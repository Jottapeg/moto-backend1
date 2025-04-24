const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Criar transportador reutilizável usando SMTP por padrão
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Definir opções de email
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || 'MotoMarket'} <${process.env.EMAIL_FROM || 'noreply@motomarket.com.br'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // Adicionar HTML se fornecido
  if (options.html) {
    mailOptions.html = options.html;
  }

  // Enviar email
  const info = await transporter.sendMail(mailOptions);

  console.log(`Email enviado: ${info.messageId}`);
};

module.exports = sendEmail;
