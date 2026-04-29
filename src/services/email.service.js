const nodemailer = require('nodemailer');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

function parseMailFrom(value) {
    const fallbackEmail = process.env.SMTP_USER || process.env.BREVO_FROM_EMAIL || '';

    const raw = String(value || fallbackEmail || '').trim();
    const match = raw.match(/^(.*?)<([^>]+)>$/);

    if (match) {
        return {
            name: match[1].trim().replace(/^"|"$/g, '') || 'Spider Store',
            email: match[2].trim()
        };
    }

    return {
        name: process.env.MAIL_FROM_NAME || 'Spider Store',
        email: raw
    };
}

function getEmailProvider() {
    return String(process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
}

function getSmtpConfig() {
    return {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.MAIL_FROM || process.env.SMTP_USER
    };
}

function validateSmtpConfig() {
    const config = getSmtpConfig();
    const missing = [];

    if (!config.host) missing.push('SMTP_HOST');
    if (!config.port) missing.push('SMTP_PORT');
    if (!config.user) missing.push('SMTP_USER');
    if (!config.pass) missing.push('SMTP_PASS');
    if (!config.from) missing.push('MAIL_FROM');

    if (missing.length) {
        const error = new Error(`Missing SMTP environment variables: ${missing.join(', ')}`);
        error.code = 'EMAIL_CONFIG_MISSING';
        throw error;
    }

    return config;
}

function createSmtpTransporter() {
    const config = validateSmtpConfig();

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        family: 4,
        requireTLS: !config.secure,
        auth: {
            user: config.user,
            pass: config.pass
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        tls: {
            rejectUnauthorized: true
        }
    });
}

async function sendMailWithSmtp({ to, subject, text, html }) {
    const config = validateSmtpConfig();
    const transporter = createSmtpTransporter();

    const info = await transporter.sendMail({
        from: config.from,
        to,
        subject,
        text,
        html
    });

    return {
        success: true,
        provider: 'smtp',
        messageId: info.messageId
    };
}

async function sendMailWithBrevoApi({ to, subject, text, html }) {
    const apiKey = process.env.BREVO_API_KEY;
    const sender = parseMailFrom(process.env.MAIL_FROM);

    if (!apiKey) {
        const error = new Error('Missing BREVO_API_KEY');
        error.code = 'EMAIL_CONFIG_MISSING';
        throw error;
    }

    if (!sender.email) {
        const error = new Error('Missing MAIL_FROM');
        error.code = 'EMAIL_CONFIG_MISSING';
        throw error;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: sender.name,
                email: sender.email
            },
            to: [
                {
                    email: to
                }
            ],
            subject,
            htmlContent: html || `<p>${String(text || '').replace(/\n/g, '<br>')}</p>`,
            textContent: text || ''
        })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.message || 'Brevo API email send failed');
        error.code = 'BREVO_API_ERROR';
        error.statusCode = response.status;
        error.details = data;
        throw error;
    }

    return {
        success: true,
        provider: 'brevo_api',
        messageId: data.messageId || null
    };
}

async function sendMail({ to, subject, text, html }) {
    if (!to || !subject || (!text && !html)) {
        const error = new Error('Invalid email payload');
        error.code = 'INVALID_EMAIL_PAYLOAD';
        throw error;
    }

    const provider = getEmailProvider();

    if (provider === 'brevo_api') {
        return sendMailWithBrevoApi({ to, subject, text, html });
    }

    return sendMailWithSmtp({ to, subject, text, html });
}

module.exports = {
    sendMail
};