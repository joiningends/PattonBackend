import bcrypt from "bcryptjs";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { User } from "../model/userModel.js";
import ErrorHandler from "../util/ErrorHandler.js";
import { sequelize } from "../config/connectDB.js";
import jwt from 'jsonwebtoken';



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
    const isPasswordCorrect = bcrypt.compare(password, userDetails.password);

    if (!isPasswordCorrect) return next(new ErrorHandler("Wrong email address or password.", 404));

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


export { LoginUser };

