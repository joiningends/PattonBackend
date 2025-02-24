import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import ErrorHandler from "../util/ErrorHandler.js";
import { sequelize } from "../config/connectDB.js";

const getSKUbyRFQid = catchAsyncError(async (req, res, next) => {
    try {
        const { rfqId } = req.params;
        const { skuId } = req.query; // Get skuId from query params if provided

        if (!rfqId) return next(new ErrorHandler("RFQ id is required.", 400));

        // Query the function using raw SQL
        const query = skuId
            ? `SELECT * FROM get_sku_by_rfqid(:rfqId, :skuId);`
            : `SELECT * FROM get_sku_by_rfqid(:rfqId, NULL);`;

        const skuData = await sequelize.query(query, {
            replacements: { rfqId, skuId },
            type: sequelize.QueryTypes.SELECT,
        });

        if (!skuData || skuData.length === 0) {
            return next(new ErrorHandler("No SKU found for the given RFQ ID", 404));
        }

        // Process the products JSON data
        const processedData = skuData.map(sku => {
            // Parse products if they're returned as a string
            if (sku.products && typeof sku.products === 'string') {
                try {
                    sku.products = JSON.parse(sku.products);
                } catch (e) {
                    console.warn("Failed to parse products JSON", e);
                    // Keep the original format if parsing fails
                }
            }
            return sku;
        });

        res.status(200).json({
            success: true,
            data: processedData, // Send processed array of SKUs with products
        });
    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});


const getProductsBySKUId = catchAsyncError(async (req, res, next) => {
    const { p_sku_id } = req.params;
    const { p_product_id } = req.query;

    if (!p_sku_id) return next(new ErrorHandler("SKU id is required", 400));

    const query = p_product_id
        ? `SELECT * FROM get_product_by_skuID(:p_sku_id, :p_product_id);`
        : `SELECT * FROM get_product_by_skuID(:p_sku_id, NULL);`;

    const productData = await sequelize.query(query, {
        replacements: { p_sku_id, p_product_id },
        type: sequelize.QueryTypes.SELECT,
    });

    if(!productData || productData.length === 0) {
        return next(new ErrorHandler("No products found for the given SKU ID", 404));
    }

    res.status(200).json({
        success: true,
        message: "Product fetched by given SKU id",
        data: productData,
    });
})



const saveProductswithSKUdetails = catchAsyncError(async (req, res, next) => {
    try {
        const { p_sku_id, p_products } = req.body;

        // Check for SKU ID
        if (!p_sku_id) return next(new ErrorHandler("Please provide the SKU ID", 400));

        // Check for products array
        if (!Array.isArray(p_products) || p_products.length === 0) {
            return next(new ErrorHandler("Products must be a non-empty array", 400));
        }

        // calling the postgreSQL stored procedure
        const result = await sequelize.query(
            `CALL insert_product_with_sku_details(:p_sku_id, :p_products)`,
            {
                replacements: {
                    p_sku_id,
                    p_products: p_products ? JSON.stringify(p_products) : null
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        res.status(200).json({
            success: true,
            message: "Products inserted successfully with SKU details.",
        });

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});






export { getSKUbyRFQid, saveProductswithSKUdetails, getProductsBySKUId };