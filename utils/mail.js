const nodemailer = require('nodemailer');
require("dotenv").config();

const sendEmail = (emailAddress, subject, body) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASSWORD,
        }
    });

    const mailOptions = {
        from: `"Admin Chips Exchange" <${process.env.NODEMAILER_USER}>`,
        to: emailAddress,
        subject: subject,
        text: body,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error:', error);
        }
        console.log('Email sent:', info.response);
    });
};

module.exports = { sendEmail };