import bcrypt from "bcryptjs";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { User } from "../model/userModel.js";
import ErrorHandler from "../util/ErrorHandler.js";
import { sequelize } from "../config/connectDB.js";
import jwt from 'jsonwebtoken';
import { sendEmailVerification } from "./emailController.js";



const LoginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    // validate inputs
    if (!email || !password) return next(new ErrorHandler("Please provide all the required fields", 400));

    // fetch user details
    const userDetails = await User.findOne(
        {
            where: { email }
        }
    );

    if (!userDetails) return next(new ErrorHandler("Wrong email address or password.", 404));

    // verify password
    const isPasswordCorrect = await bcrypt.compare(password, userDetails.password);

    if (!isPasswordCorrect) return next(new ErrorHandler("Wrong email address or password.", 404));

    if(userDetails.status === false) return next(new ErrorHandler("User has been made Inactive. Please contact the Admin", 400));

    // fetch roles
    const userRole = await sequelize.query(
        'CALL public.getUserRole(:p_user_id, null, null)',
        {
            replacements: { p_user_id: userDetails.id }, // Use named replacements
            type: sequelize.QueryTypes.RAW, // Specify the query type
        }
    )


    console.log("userRole: ", userRole);


    const { roleid, role_name } = userRole[0][0];

    // Generate jwt token
    const token = jwt.sign(
        {   // payload
            userId: userDetails.id,
            userName: userDetails.username,
            userEmail: userDetails.email,
            roleId: roleid,
            roleName: role_name
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );

    // Send token to client
    res.status(200).json({
        success: true,
        token,
        user: {
            id: userDetails.id,
            email: userDetails.email,
            roleid,
            role_name
        },
    });
});




const LogoutUser = catchAsyncError(async (req, res, next) => {
    try {
        // Get the token from the authorization header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(200).json({
                success: true,
                message: "Already logged out"
            });
        }

        // Get token expiry time
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const expiryTime = decoded.exp;

        // Calculate remaining time until expiry (in seconds)
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiryTime - currentTime;

        // Add token to blacklist
        await TokenBlacklist.create({
            token: token,
            expiresAt: new Date(expiryTime * 1000) // Convert to milliseconds
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        return next(new ErrorHandler("Logout failed", 500));
    }
});


const isFirstTimeLogin = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    if (!email) return next(new ErrorHandler("Please provide a valid email address.", 400));

    const userData = await User.findOne({
        where: {
            email: email
        }
    });

    if (!userData) return next(new ErrorHandler("Email is not registered.", 400));

    if (userData.password !== null) return next(new ErrorHandler("User already logged in previously.", 400));

    res.status(200).json({
        success: true,
        message: "User first time login.",
        data: userData
    });
});



// Send reset password mail
const resetPasswordMail = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    const userDetails = await User.findOne({
        where: {
            email: email
        }
    });

    if (!userDetails) return next(new ErrorHandler("User email not registered.", 400));

    const resetPasswordURL = `${process.env.CLIENT_URL}/reset/password?userId=${userDetails.id}`

    //email subject
    const subject = 'Reset password'

    // emial contents
    const emailContent = `<p>Hello ${userDetails.username},</p>
            <p>Please reset the password by clicking on the link below:</p>
            <a href="${resetPasswordURL}">Reset password</a>`

    // email credentials
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    await sendEmailVerification(user, pass, email, subject, emailContent);

    res.status(201).json({
        success: true,
        message: "Reset password email sent. Please reset your password by the given link in your mail.",
    });

});



const resetPassword = catchAsyncError(async (req, res, next) => {
    const { userId, newPassword } = req.body;

    if (!userId) return next(new ErrorHandler("Please provide user id.", 400));
    if (!newPassword) return next(new ErrorHandler("Please provide a new password to change the previous password"));

    const userDetails = await User.findByPk(userId);

    if (!userDetails) return next(new ErrorHandler("User not found.", 404));

    if (userDetails.password !== null) {
        // verify password
        const isPasswordSame = await bcrypt.compare(newPassword, userDetails.password);

        if (isPasswordSame) return next(new ErrorHandler("Please use different password than the previous.", 400));
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    await userDetails.update({
        password: hashPassword
    });

    res.status(200).json({
        success: true,
        message: "Password updated successfully",
        data: userDetails
    })
})


export { LoginUser, resetPasswordMail, resetPassword, isFirstTimeLogin };

