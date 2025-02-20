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




const getRFQDetail = catchAsyncError(async (req, res, next) => {
    try {
        const { p_user_id, p_rfq_id, p_client_id } = req.body; // Get parameters from query string

        // Query the function using raw SQL
        const query = `SELECT * FROM get_rfq(:p_user_id, :p_rfq_id, :p_client_id);`;

        const rfqData = await sequelize.query(query, {
            replacements: {
                p_user_id: p_user_id || null,
                p_rfq_id: p_rfq_id || null,
                p_client_id: p_client_id || null
            },
            type: sequelize.QueryTypes.SELECT,
        });

        if (!rfqData || rfqData.length === 0) {
            return next(new ErrorHandler("No RFQ data found", 404));
        }

        res.status(200).json({
            success: true,
            data: rfqData, // Send the array of RFQ details
        });
    } catch (error) {
        console.error("Error fetching RFQ details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});




export {saveRFQandSKUdata, getRFQDetail};