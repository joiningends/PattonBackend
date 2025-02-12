import { sequelize } from "../config/connectDB.js";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import ErrorHandler from "../util/ErrorHandler.js";


// Save role with permission
const saveRolewithPermission = catchAsyncError(async (req, res, next) => {
    try {
        const { p_rolename, p_permission_data } = req.body;
        
        if(!p_rolename || !p_permission_data) return next(new ErrorHandler("Please fill are the required fields", 400));

        // calling the sql function
        const result = await sequelize.query(
            'SELECT create_role_with_permission(:p_rolename, :p_permission_data)',
            {
                replacements: {
                    p_rolename: p_rolename,
                    p_permission_data: JSON.stringify(p_permission_data)
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // console.log("Result: ",result);

        // Parse the function result
        const functionResult = result[0]?.create_role_with_permission;

        // console.log("functionResult: ", functionResult);

        if (!functionResult) {
            return next(new ErrorHandler("Unexpected database response", 500));
        }

        // if (!functionResult.success) {
        //     return next(new ErrorHandler(functionResult.error, 400));
        // }

        res.status(200).json({
            success:true,
            message: "Role with permission created successfully",
            data: functionResult
        });

    } catch (error) {
        console.log("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
})


export {saveRolewithPermission}