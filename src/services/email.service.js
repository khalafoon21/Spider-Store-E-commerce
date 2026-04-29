const nodemailer = require('nodemailer');

function getEmailConfig() {
    return {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.MAIL_FROM || process.env.SMTP_USER
    };
}

function validateEmailConfig() {
    const config = getEmailConfig();

    const missing = [];

    if (!config.host) missing.push('SMTP_HOST');
    if (!config.port) missing.push('SMTP_PORT');
    if (!config.user) missing.push('SMTP_USER');
    if (!config.pass) missing.push('SMTP_PASS');
    if (!config.from) missing.push('MAIL_FROM');

    if (missing.length) {
        const error = new Error(`Missing email environment variables: ${missing.join(', ')}`);
        error.code = 'EMAIL_CONFIG_MISSING';
        throw error;
    }

    return config;
}

function createTransporter() {
    const config = validateEmailConfig();

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass
        }
    });
}

async function sendMail({ to, subject, text, html }) {
    if (!to || !subject || (!text && !html)) {
        const error = new Error('Invalid email payload');
        error.code = 'INVALID_EMAIL_PAYLOAD';
        throw error;
    }

    const config = validateEmailConfig();
    const transporter = createTransporter();

    const info = await transporter.sendMail({
        from: config.from,
        to,
        subject,
        text,
        html
    });

    return {
        success: true,
        messageId: info.messageId
    };
}

module.exports = {
    sendMail
};