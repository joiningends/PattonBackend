import { where } from "sequelize";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { User } from "../model/userModel.js";
import ErrorHandler from "../util/ErrorHandler.js";
import bcrypt from "bcryptjs";


// Saving the user details
const saveUserdata = catchAsyncError(async (req, res, next) => {
    try {
        const { username, email, password, phone, designation, department } = req.body;

        // check required fields
        if (!username || !email || !password || !phone) return next(new ErrorHandler("Please provide all the required fields", 400));

        const emailExists = await User.findOne({
            where: {
                email: email,
            }
        })

        if (emailExists) return next(new ErrorHandler("Email already exists", 400));

        // hash the password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);


        const newUser = await User.create({
            username: username,
            email: email,
            password: hashPassword,
            phone: phone,
            designation: designation,
            department: department,
            status: true,
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: newUser
        })

    } catch (error) {
        console.error("Error details:", error); // Debugging log
        next(new ErrorHandler("Internal server error", 500));
    }
});


// Get the users
const getUserData = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        let userData;

        if (id) {
            userData = await User.findByPk(id);

            if (!userData) return next(new ErrorHandler("No user found for the given Id.", 404));
        } else {
            userData = await User.findAll();
        }

        res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            data: userData,
        });

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});


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
        next(new ErrorHandler("Internal server error", 500))
    }
})


// Disable the user (soft delete)
const disableUser = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        // check id
        if (!id) return next(new ErrorHandler("User Id is required.", 400));

        const user = await User.findByPk(id);

        if (!user) return next(new ErrorHandler("User not found", 404));

        await user.update({
            status: false,
        });

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


// Disable the user
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



export { saveUserdata, getUserData, editUserData, disableUser, deleteUser };