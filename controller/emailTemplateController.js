import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { EmailTemplate } from "../model/emailTemplateModel.js";
import ErrorHandler from "../util/ErrorHandler.js";




const saveEmailTemplate = catchAsyncError(async (req, res, next) => {
    const { template_name, subject, email_content, email_signature } = req.body;

    if (!template_name) return next(new ErrorHandler("Template name is required.", 400));
    if (!subject) return next(new ErrorHandler("Email subject is required.", 400));
    if (!email_content) return next(new ErrorHandler("Email content is required.", 400));
    if (!email_signature) return next(new ErrorHandler("Email signature is required.", 400));

    const template_name_exists = await EmailTemplate.findOne(
        {
            where: { template_name: template_name }
        }
    );

    if (template_name_exists) return next(new ErrorHandler("Template name already exits.", 400));

    const newEmailTemplate = await EmailTemplate.create({
        template_name: template_name,
        subject: subject,
        email_content: formatEmailContent(email_content),
        email_signature: formatSignature(email_signature),
        status: true
    });

    res.status(200).json({
        success: true,
        message: "Email template saved successfully",
        data: newEmailTemplate
    });
});


// Helper functions for formatting
function formatEmailContent(content) {
    // Convert line breaks to <br> tags for HTML emails
    return content.replace(/\n/g, '<br>');
}

function formatSignature(signature) {
    // Basic formatting for signature
    return signature.replace(/\n/g, '<br>');
}

const editEmailTemplate = catchAsyncError(async (req, res, next) => {
    const { id, template_name, subject, email_content, email_signature } = req.body;

    if (!id) return next(new ErrorHandler("Template id is required.", 400));

    const emailTemplateData = await EmailTemplate.findByPk(id);

    if (!emailTemplateData) return next(new ErrorHandler("Email template data not found.", 404));

    if (template_name) {
        const template_name_exists = await EmailTemplate.findOne(
            {
                where: { template_name: template_name }
            }
        );

        if (template_name_exists) return next(new ErrorHandler("Template name already exits.", 400));
    }

    await emailTemplateData.update({
        template_name: template_name || emailTemplateData.template_name,
        subject: subject || emailTemplateData.subject,
        email_content: email_content || emailTemplateData.email_content,
        email_signature: email_signature || emailTemplateData.email_signature
    });

    res.status(200).json({
        success: true,
        message: "Email template updated successfully.",
        data: emailTemplateData
    })
});

const fetchEmailTemplate = catchAsyncError(async (req, res, next) => {
    const { id } = req.query;

    let emailTemplateData;

    if (id) emailTemplateData = await EmailTemplate.findByPk(id);
    else emailTemplateData = await EmailTemplate.findAll();

    res.status(200).json({
        success: true,
        message: "Email template fetched successfully",
        data: emailTemplateData
    })
});

const deleteEmailTemplate = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) return next(new ErrorHandler("Template id is required.", 400));

    const emailTemplateData = await EmailTemplate.findByPk(id);

    if (!emailTemplateData) return next(new ErrorHandler("Email template data not found.", 404));

    await emailTemplateData.destroy();

    res.status(200).json({
        success: true,
        message: "Email template deleted successfully",
    })
})

export { saveEmailTemplate, editEmailTemplate, fetchEmailTemplate, deleteEmailTemplate };