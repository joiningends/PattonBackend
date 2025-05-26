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
    if(!id) return next(new ErrorHandler("Email config Id is required", 400));

    const emailConfigData = await Email.findByPk(id);
    
    // Check if record exists
    if(!emailConfigData) return next(new ErrorHandler("Email config data with given Id is not found or inactive.", 404));

    if(user){
        const emailConfigData = await Email.findOne({
            where: {user: user}
        });

        if(emailConfigData) return next(new ErrorHandler("Email config with same user already exists.", 400));

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

    if(id) emailConfigData = await Email.findByPk(id);
    else emailConfigData = await Email.findAll();
    

    res.status(200).json({
        success: true,
        message: "Email config data fetched successfully",
        data: emailConfigData
    });
})


// Function to delete email config data
const deleteEmailConfig = catchAsyncError(async (req, res, next) => {
    const { id } = req.body;

    // Null check
    if(!id) return next(new ErrorHandler("Email config Id is required", 400));

    const emailConfigData = await Email.findByPk(id);
    
    // Check if record exists
    if(!emailConfigData) return next(new ErrorHandler("Email config data with given Id is not found or inactive.", 404));

    await emailConfigData.destroy();

    res.status(200).json({
        success: true,
        message: "Email config data deleted successfully",
    });
})


export { sendEmail, saveEmailConfig, editEmailConfig, fetchEmailConfig, deleteEmailConfig };