import nodemailer from "nodemailer";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import ErrorHandler from "../util/ErrorHandler.js";
import { Email } from "../model/emailModel.js";


// Email trigger function
async function sendEmail(user, pass, email, subject, emailContent) {

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

// Function to save email config data
const saveEmailConfig = catchAsyncError(async (req, res, next) => {
    const { user, pass, tags } = req.body;

    // Null check
    if (!user) return next(new ErrorHandler("User email is required"));
    if (!pass) return next(new ErrorHandler("Hexa dicimal 16 charecter Password authentication password required."));

    const emailConfigDetails = await Email.findOne({
        where: { user: user }
    });

    if (emailConfigDetails) return next(new ErrorHandler("Email config with same user already exists.", 400));

    const newEmailConfig = await Email.create({
        user: user,
        pass: pass,
        tags: tags ? tags : null,
        status: true
    });

    res.status(201).json({
        success: true,
        message: "Email config data saved successfully.",
        data: newEmailConfig
    })
});

// Function to edit email config data
const editEmailConfig = catchAsyncError(async (req, res, next) => {
    const { id, user, pass, tags, status } = req.body;

    // Null check
    if (!id) return next(new ErrorHandler("Email config Id is required", 400));

    const emailConfigData = await Email.findByPk(id);

    // Check if record exists
    if (!emailConfigData) return next(new ErrorHandler("Email config data with given Id is not found or inactive.", 404));

    if (user) {
        const emailConfigData = await Email.findOne({
            where: { user: user }
        });

        if (emailConfigData) return next(new ErrorHandler("Email config with same user already exists.", 400));

    };

    await emailConfigData.update({
        user: user || emailConfigData.user,
        pass: pass || emailConfigData.pass,
        tags: tags || emailConfigData.tags,
        status: status || emailConfigData.status
    });

    res.status(200).json({
        success: true,
        message: "Email config data updated successfully",
        data: emailConfigData
    });
})


// Function to get/fetch email config data
const fetchEmailConfig = catchAsyncError(async (req, res, next) => {
    const { id } = req.query;

    let emailConfigData;

    if (id) emailConfigData = await Email.findByPk(id);
    else emailConfigData = await Email.findAll();


    res.status(200).json({
        success: true,
        message: "Email config data fetched successfully",
        data: emailConfigData
    });
})


// Function to delete email config data
const deleteEmailConfig = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    // Null check
    if (!id) return next(new ErrorHandler("Email config Id is required", 400));

    const emailConfigData = await Email.findByPk(id);

    // Check if record exists
    if (!emailConfigData) return next(new ErrorHandler("Email config data with given Id is not found or inactive.", 404));

    await emailConfigData.destroy();

    res.status(200).json({
        success: true,
        message: "Email config data deleted successfully",
    });
})

// const sendEmailNotification = catchAsyncError(async (req, res, next) => {
//     const { emailConfigId, toMail, subject, emailContent } = req.body;

//     // Checking null values
//     if (!emailConfigId) return next(new ErrorHandler("Email config is required for sending email.", 400));
//     if (!toMail) return next(new ErrorHandler("Reciever mail is required", 400));
//     if (!subject) return next(new ErrorHandler("Mail subject is required.", 400));
//     if (!emailContent) return next(new ErrorHandler("Mail content is required.", 400));

//     // Fetching email config data
//     const emailConfigData = await Email.findByPk(emailConfigId);

//     // Sending mail
//     await sendEmail(emailConfigData?.user, emailConfigData?.pass, toMail, subject, emailContent);

//     res.status(200).json({
//         success: true,
//         message: "Email notification sent successfully."
//     });

// })

const sendEmailNotification = catchAsyncError(async (req, res, next) => {
    const { emailConfigId, toMail, subject, emailContent } = req.body;

    // Checking null values
    if (!emailConfigId) return next(new ErrorHandler("Email config is required for sending email.", 400));
    if (!toMail) return next(new ErrorHandler("Receiver mail is required", 400));
    if (!subject) return next(new ErrorHandler("Mail subject is required.", 400));
    if (!emailContent) return next(new ErrorHandler("Mail content is required.", 400));

    // Fetch email config with error handling
    const emailConfigData = await Email.findByPk(emailConfigId);
    if (!emailConfigData) {
        return next(new ErrorHandler("Email configuration not found", 404));
    }

    // Verify we have required credentials
    if (!emailConfigData.user || !emailConfigData.pass) {
        return next(new ErrorHandler("Email configuration is incomplete", 400));
    }

    // Send email with timeout
    await Promise.race([
        sendEmail(emailConfigData.user, emailConfigData.pass, toMail, subject, emailContent),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email sending timeout")), 10000))
    ]);

    res.status(200).json({
        success: true,
        message: "Email notification sent successfully"
    });
});

// Helper function to send individual email (extracted from middleware)
const sendSingleEmail = async (notification) => {
    const { emailConfigId, toMail, subject, emailContent } = notification;

    // Validation
    if (!emailConfigId) throw new Error("Email config is required for sending email.");
    if (!toMail) throw new Error("Receiver mail is required");
    if (!subject) throw new Error("Mail subject is required.");
    if (!emailContent) throw new Error("Mail content is required.");

    // Fetch email config
    const emailConfigData = await Email.findByPk(emailConfigId);
    if (!emailConfigData) {
        throw new Error("Email configuration not found");
    }

    // Verify credentials
    if (!emailConfigData.user || !emailConfigData.pass) {
        throw new Error("Email configuration is incomplete");
    }

    // Send email with timeout
    await Promise.race([
        sendEmail(emailConfigData.user, emailConfigData.pass, toMail, subject, emailContent),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email sending timeout")), 10000))
    ]);

    return { success: true, toMail };
};

// Batch notification endpoint
const sendBatchEmailNotifications = catchAsyncError(async (req, res, next) => {
    const { notifications } = req.body;

    if (!Array.isArray(notifications) || notifications.length === 0) {
        return next(new ErrorHandler("No notifications provided", 400));
    }

    // Process all notifications
    const results = await Promise.allSettled(
        notifications.map(notification => sendSingleEmail(notification))
    );

    // Separate successful and failed notifications
    const successfulNotifications = [];
    const failedNotifications = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            successfulNotifications.push(notifications[index].toMail);
        } else {
            failedNotifications.push({
                toMail: notifications[index].toMail,
                error: result.reason.message
            });
        }
    });

    res.status(200).json({
        success: true,
        message: `Processed ${notifications.length} notifications`,
        successfulCount: successfulNotifications.length,
        failedCount: failedNotifications.length,
        successfulNotifications,
        failedNotifications
    });
});



export { sendEmail, saveEmailConfig, editEmailConfig, fetchEmailConfig, deleteEmailConfig, sendEmailNotification, sendBatchEmailNotifications };