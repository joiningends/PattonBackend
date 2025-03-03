import { sequelize } from "../config/connectDB.js";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import ErrorHandler from "../util/ErrorHandler.js";


// Save role with permission
const saveRolewithPermission = catchAsyncError(async (req, res, next) => {
    try {
        const { p_rolename, p_permission_data } = req.body;

        if (!p_rolename || !p_permission_data) return next(new ErrorHandler("Please fill are the required fields", 400));

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
            success: true,
            message: "Role with permission created successfully",
            data: functionResult
        });

    } catch (error) {
        console.log("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
})


// Update role with permission
const updateRolewithPermission = catchAsyncError(async (req, res, next) => {
    try {
        const { p_role_id, p_permission_data } = req.body;

        // validations if present
        if(!p_role_id || !p_permission_data) return next(new ErrorHandler("Please provide both role ID and permission data", 400));

        // validation role ID is number
        if(!Number.isInteger(p_role_id)) return next(new ErrorHandler("Role ID must be an integer", 400));

        // validation permission data is a valid object
        if(typeof p_permission_data !== 'object' || p_permission_data === null) {
            return next(new ErrorHandler("Permission data must be a valid object", 400));
        }

        // call the stored procedure
        const result = await sequelize.query(
            'SELECT update_role_with_permission(:p_role_id, :p_permission_data)',
            {
                replacements: {
                    p_role_id: p_role_id,
                    p_permission_data: JSON.stringify(p_permission_data)
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Get the function result
        const functionResult = result[0]?.update_role_with_permission;

        if (!functionResult) {
            return next(new ErrorHandler("Unexpected database response", 500));
        }

        // Check if the result contains an error message
        if (functionResult.startsWith('Error:')) {
            return next(new ErrorHandler(functionResult.substring(7), 400));
        }

        res.status(200).json({
            success: true,
            message: "Role permissions updated successfully",
            data: functionResult
        });


    } catch (error) {
        console.log("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
})


// get role permission
const viewRolePermissions = catchAsyncError(async (req, res, next) => {
    try {
        let { role_id } = req.params;

        // Convert role_id to integer or set it to null for fetching all roles
        role_id = role_id ? parseInt(role_id) : null;

        // Call the function to get role permissions
        const result = await sequelize.query(
            'SELECT * FROM view_role_permissions(:role_id)',
            {
                replacements: { role_id },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // If no records are found, handle accordingly
        if (!result.length) {
            return next(new ErrorHandler(role_id ? 
                `No permissions found for role ID ${role_id}` : 
                "No role permissions found", 404));
        }

        // Transform the result into a structured format
        const formattedResult = result.reduce((acc, curr) => {
            const roleKey = curr.role_id;
            if (!acc[roleKey]) {
                acc[roleKey] = {
                    role_id: curr.role_id,
                    role_name: curr.role_name,
                    pages: {}
                };
            }

            const pageKey = curr.page_id;
            if (!acc[roleKey].pages[pageKey]) {
                acc[roleKey].pages[pageKey] = {
                    page_id: curr.page_id,
                    page_name: curr.page_name,
                    page_context: curr.page_context,
                    permissions: []
                };
            }

            acc[roleKey].pages[pageKey].permissions.push({
                permission_id: curr.permission_id,
                permission_name: curr.permission_name
            });

            return acc;
        }, {});

        // Convert pages to an array for each role
        const responseData = Object.values(formattedResult).map(role => ({
            ...role,
            pages: Object.values(role.pages)
        }));

        res.status(200).json({
            success: true,
            message: "Role permissions retrieved successfully",
            roles: responseData
        });

    } catch (error) {
        console.error("Error details: ", error);
        
        // Check if it's a known error from the function
        if (error.message.startsWith('Error:')) {
            return next(new ErrorHandler(error.message.substring(7), 400));
        }

        next(new ErrorHandler("Internal server error", 500));
    }
});




export { saveRolewithPermission, updateRolewithPermission, viewRolePermissions };