import nodemailer from "nodemailer";



async function sendEmailVerification(user, pass, email, subject, emailContent) {

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: user,
            pass: pass,
        },
    });

    const mailOptions = {
        from: user,
        to: email,
        subject: subject,
        html: emailContent,
    };

    await transporter.sendMail(mailOptions);

}

export { sendEmailVerification };