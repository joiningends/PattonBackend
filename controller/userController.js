import { where } from "sequelize";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { User } from "../model/userModel.js";
import ErrorHandler from "../util/ErrorHandler.js";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/connectDB.js";
import crypto from "crypto";
import { Verification } from "../model/emailVerificationModel.js";
import nodemailer from "nodemailer";
import { sendEmailVerification } from "./emailController.js";


// Generate random numbers
function generateVerificationCode(length) {
    const max = 10 ** (length || 6);
    const randomBuffer = crypto.randomBytes(4);
    const randomNumber = randomBuffer.readUInt32BE(0) % max;
    return randomNumber.toString().padStart(length, '0');
}


// Saving the user details
const saveUserdata = catchAsyncError(async (req, res, next) => {
    try {
        const { username, first_name, last_name, email, phone, designation, department } = req.body;

        // check required fields
        if (!username || !email || !phone) return next(new ErrorHandler("Please provide all the required fields", 400));

        const emailExists = await User.findOne({
            where: {
                email: email,
            }
        })

        if (emailExists) return next(new ErrorHandler("Email already exists", 400));

        // hash the password
        // const salt = await bcrypt.genSalt(10);
        // const hashPassword = await bcrypt.hash(password, salt);


        const newUser = await User.create({
            username: username,
            first_name: first_name,
            last_name: last_name,
            email: email,
            // password: hashPassword,
            phone: phone,
            designation: designation,
            department: department,
            status: true,
            isEmailVerified: false
        });


        // Set default role for the user
        const p_user_id = newUser.id;
        const p_role_id = 14;           // default user role

        await sequelize.query(
            'CALL map_user_with_role(:p_user_id, :p_role_id)',
            {
                replacements: {
                    p_user_id,
                    p_role_id
                }
            }
        );

        res.status(201).json({
            success: true,
            message: "User created and saved successfully.",
            data: newUser
        })

    } catch (error) {
        console.error("Error details:", error); // Debugging log
        next(new ErrorHandler("Internal server error", 500));
    }
});



const sendEmailVerificationMail = catchAsyncError(async (req, res, next) => {
    const { userId } = req.query

    if (!userId) return next(new ErrorHandler("Please provide user id.", 400));

    const userDetails = await User.findByPk(userId);

    if (!userDetails) return next(new ErrorHandler("User not found.", 404));

    //  generate the email verification code
    const verificationCode = generateVerificationCode(7);
    console.log(verificationCode);

    // Save the verification with userId in DB
    await Verification.create({
        userId: userId,
        code: verificationCode,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });


    // Create verification url
    const verificationURL = `${process.env.CLIENT_URL}/verify-email?code=${verificationCode}`

    // email subject
    const subject = 'Verify your email';

    // emial contents
    const emailContent = `<p>Hello ${userDetails.username},</p>
                              <p>Please verify your email by clicking on the link below:</p>
                              <a href="${verificationURL}">Verify Email</a>
                              <p>Or</p>
                              <p>Use the code below to verify : </p>
                              <h4>${verificationCode}</h4>`

    // email credentials
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    await sendEmailVerification(user, pass, userDetails.email, subject, emailContent);

    res.status(201).json({
        success: true,
        message: "Verification email sent. Please verify your email to complete registration.",
        data: userDetails
    })
})


// Verify email
const verifyEmail = catchAsyncError(async (req, res, next) => {
    const { userId, code } = req.query;

    if (!code) return next(new ErrorHandler("Verification code is required.", 400));

    const verification = await Verification.findOne({
        where: {
            userId: userId,
            code: code
        }
    });

    if (!verification) return next(new ErrorHandler("Invalid or expired verification code", 404));

    if (verification.expiresAt < new Date()) return next(new ErrorHandler("Verification code has expired", 400));

    // Update the user to verified
    await User.update(
        { status: true },
        { where: { id: userId } }
    );

    // remove the verification record
    await Verification.destroy({ where: { code } });

    res.status(200).json({
        success: true,
        message: "Email verified successfully, You can now login.",
    });
});


// Get the users
const getUserData = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        // Call the function directly in a SELECT statement
        const [result] = await sequelize.query(
            'SELECT get_users(:userId) as data',
            {
                replacements: { userId: id || null },
                type: sequelize.QueryTypes.SELECT
            }
        );

        const data = result.data;

        if (!data.success) {
            return next(new ErrorHandler(data.message, 404));
        }

        res.status(200).json(data);

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});



const getUserRoleDataByUserId = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) return next(new ErrorHandler("User id is required.", 400));

    const userData = await User.findByPk(id);
    if (!userData) return next(new ErrorHandler("User not found.", 404));

    const userRoleData = await sequelize.query(
        'SELECT * FROM public.get_user_role(:id)',
        {
            replacements: { id },
            type: sequelize.QueryTypes.SELECT
        }
    );

    if (!userRoleData.length) {
        return next(new ErrorHandler("No user with role data found.", 404));
    }

    res.status(200).json({
        success: true,
        message: "User role data fetched successfully",
        data: userRoleData
    });
})



// Edit the users
const editUserData = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username, phone, designation, department, status } = req.body;

        if (!id) return next(new ErrorHandler("User Id is required.", 400));

        const user = await User.findByPk(id);
        if (!user) return next(new ErrorHandler("User not found", 404));

        await user.update({
            username: username || user.username,
            phone: phone || user.phone,
            designation: designation || user.designation,
            department: department || user.department,
            status: status !== undefined ? status : user.status,
        });

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user,
        });


    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
})


// Disable the user (soft delete)
const enableDisableUser = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // check id
        if (!id) return next(new ErrorHandler("User Id is required", 400));
        if (!status) return next(new ErrorHandler("Status code is required", 400));

        const user = await User.findByPk(id);
        if (!user) return next(new ErrorHandler("User not found", 404));

        if (status === 1) {
            await user.update({
                status: false,
            });
        } else if (status === 2) {
            await user.update({
                status: true,
            });
        };

        res.status(200).json({
            success: true,
            message: "User disabled successfully",
            data: user
        });

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("internal server error", 500));
    }
});


// delete user (Hard delete)
const deleteUser = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        // check id
        if (!id) return next(new ErrorHandler("User Id is required.", 400));

        const user = await User.findByPk(id);

        if (!user) return next(new ErrorHandler("User not found", 404));

        await user.destroy();

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: user
        });

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("internal server error", 500));
    }
});



// Map user with role
const mapUserWithRole = catchAsyncError(async (req, res, next) => {
    try {
        const { p_user_id, p_role_id } = req.body;

        if (!p_user_id || !p_role_id) return next(new ErrorHandler("Please provide the required fields", 400));

        // Calling the stored procedure
        const result = await sequelize.query(
            'CALL map_user_with_role(:p_user_id, :p_role_id)',
            {
                replacements: {
                    p_user_id,
                    p_role_id
                }
            }
        );

        res.status(200).json({
            success: true,
            message: "User mapped with provided role",
        });

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});


const getNpdEngineer = catchAsyncError(async (req, res, next) => {
    const { p_user_id } = req.params;

    // Validate if rfq_id is provided
    if (!p_user_id) {
        return next(new ErrorHandler('User ID is required', 400));
    }

    // Query to call the PostgreSQL function
    const query = `SELECT * FROM get_npd_engineers(:p_user_id);`;

    // Execute the query using Sequelize
    const npdEngineerData = await sequelize.query(query, {
        replacements: { p_user_id: p_user_id },
        type: sequelize.QueryTypes.SELECT,
    });

    // Check if data is found
    if (!npdEngineerData || npdEngineerData.length === 0) {
        return next(new ErrorHandler('No NPD engineer data found for the given user ID', 404));
    }

    // Send the response
    res.status(200).json({
        success: true,
        message: 'NPD engineer data fetched successfully',
        data: npdEngineerData,
    });
});



const getVendorEngineer = catchAsyncError(async (req, res, next) => {
    try {
        const { p_user_id } = req.params;

        if (!p_user_id) return next(new ErrorHandler("User Id is required.", 400));

        const vendorEngineerData = await sequelize.query(
            `SELECT * FROM get_vendor_eng(:p_user_id);`,
            {
                replacements: {
                    p_user_id: p_user_id
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (!vendorEngineerData || vendorEngineerData.length === 0) {
            return next(new ErrorHandler("No vendor development engineer data found for the given user id.", 404));
        }

        res.status(200).json({
            success: true,
            message: "Vendor development engineer data fetched successfully",
            data: vendorEngineerData
        });

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("internal server error", 500));
    }
})


const getProcessEngineer = catchAsyncError(async (req, res, next) => {
    
    const { p_user_id } = req.params;

    if (!p_user_id) return next(new ErrorHandler("User id is required.", 400));

    const processEngineerData = await sequelize.query(
        `SELECT * FROM get_process_eng(:p_user_id);`,
        {
            replacements: {
                p_user_id: p_user_id
            },
            type: sequelize.QueryTypes.SELECT,
        }
    );

    if(!processEngineerData || processEngineerData.length === 0) {
        return next(new ErrorHandler("No process engineer data found for the given User id", 404));
    }

    res.status(200).json({
        success: true,
        message: "Process engineer fetched successfully",
        data: processEngineerData
    });

})


const getCommercialTeam = catchAsyncError(async (req, res, next) => {
    
    const [commercialTeamData] = await sequelize.query(`SELECT * FROM get_commercial_team()`);

    if(!commercialTeamData || commercialTeamData.length === 0) {
        return next(new ErrorHandler("Commercial team data not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Commercial team data fetched successfully",
        data: commercialTeamData
    });

});

const getAllengineerByplantHeadId = catchAsyncError(async (req, res, next) => {
    const {p_user_id} = req.params;

    if(!p_user_id) return next(new ErrorHandler("User id is required", 400));

    const allEngineerData = await sequelize.query(
        `SELECT * FROM get_engineers_by_planthead(:p_user_id);`, {
            replacements: {
                p_user_id: p_user_id
            },
            type: sequelize.QueryTypes.SELECT,
        }
    );

    if(!allEngineerData || allEngineerData.length === 0) {
        return next(new ErrorHandler("No engineers found."));
    };

    res.status(200).json({
        success: true,
        message: "All engineers fetched successfully",
        data: allEngineerData
    })

})


export {
    saveUserdata,
    getUserData,
    editUserData,
    enableDisableUser,
    deleteUser,
    mapUserWithRole,
    verifyEmail,
    sendEmailVerificationMail,
    getUserRoleDataByUserId,
    getNpdEngineer,
    getVendorEngineer,
    getProcessEngineer,
    getAllengineerByplantHeadId,
    getCommercialTeam
};