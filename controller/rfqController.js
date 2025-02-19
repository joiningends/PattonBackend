import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import ErrorHandler from "../util/ErrorHandler.js";
import { sequelize } from "../config/connectDB.js";


const saveRFQandSKUdata = catchAsyncError(async (req, res, next) => {
    try {
        const { p_rfq_name, p_user_id, p_client_id, p_skus } = req.body;

        // Validate required fields
        if (!p_rfq_name || !p_user_id || !p_client_id || !Array.isArray(p_skus) || p_skus.length === 0) {
            return next(new ErrorHandler("Please provide all required fields", 400));
        }

        // Calling the stored procedure
        const result = await sequelize.query(
            'CALL insert_rfq_sku(:p_rfq_name, :p_user_id, :p_client_id, :p_skus)',
            {
                replacements: {
                    p_rfq_name,
                    p_user_id,
                    p_client_id,
                    p_skus: JSON.stringify(p_skus)
                }
            }
        );

        res.status(200).json({
            success: true,
            message: "RFQ and SKUs inserted successfully",
        });
    } catch (error) {
        console.error("Error details:", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});


export {saveRFQandSKUdata};