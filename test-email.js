require('dotenv').config();

const { sendMail } = require('./src/services/email.service');

async function main() {
    const result = await sendMail({
        to: process.env.SMTP_USER,
        subject: 'Spider Store SMTP Test',
        text: 'SMTP is working correctly.',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.8">
                <h2>SMTP is working correctly ✅</h2>
                <p>Spider Store email service is ready.</p>
            </div>
        `
    });

    console.log('Email sent:', result);
}

main().catch(error => {
    console.error('Email test failed:', error);
    process.exit(1);
});