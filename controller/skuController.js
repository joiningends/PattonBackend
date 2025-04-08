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

    if (!productData || productData.length === 0) {
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

        console.log("Backend product : ", p_products);

        // Check for SKU ID
        if (!p_sku_id) return next(new ErrorHandler("Please provide the SKU ID", 400));

        // Check for products array
        if (!Array.isArray(p_products) || p_products.length === 0) {
            return next(new ErrorHandler("Products must be a non-empty array", 400));
        }

        // Convert the array to a properly formatted JSON string
        const productsJson = JSON.stringify(p_products.map(product => ({
            product_name: product.product_name,
            quantity_per_assembly: product.quantity_per_assembly,
            raw_material_type: product.raw_material_type,
            yield_percentage: product.yield_percentage,
            net_weight_of_product: product.net_weight_of_product
        })));

        // calling the postgreSQL stored procedure
        const result = await sequelize.query(
            `CALL insert_product_with_sku_details(:p_sku_id, :p_products)`,
            {
                replacements: {
                    p_sku_id,
                    p_products: productsJson
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


const saveBOMProductswithSKUdetails = catchAsyncError(async (req, res, next) => {
    try {
        const { p_sku_id, p_bom_products } = req.body;

        console.log("Backend products: ", p_bom_products);

        // Check for SKU ID
        if (!p_sku_id) return next(new ErrorHandler("Please provide the SKU id.", 400));

        // Check for products array
        if (!Array.isArray(p_bom_products) || p_bom_products.length === 0) {
            return next(new ErrorHandler("Products must be a non-empty array", 400));
        }

        // calling the postgreSQL stored procedure
        const result = await sequelize.query(
            `CALL insert_bom_products_with_sku_details(:p_sku_id, :p_bom_products)`,
            {
                replacements: {
                    p_sku_id,
                    p_bom_products: p_bom_products ? JSON.stringify(p_bom_products) : null
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
})


const deleteProductById = catchAsyncError(async (req, res, next) => {
    try {
        const { product_id } = req.params;

        if (!product_id) return next(new ErrorHandler("Product id is required", 400));

        // calling the postgreSQL stored procedure
        const result = await sequelize.query(
            `CALL delete_product_by_id(:p_product_id)`,
            {
                replacements: {
                    p_product_id: product_id
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        res.status(200).json({
            success: true,
            message: "Product delete successfuly."
        });
    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
})


const editYieldPercentageByProductId = catchAsyncError(async (req, res, next) => {
    const { product_id, yield_percentage } = req.body;


    if (!product_id) return next(new ErrorHandler("Product id is required.", 400));

    const result = await sequelize.query(
        `UPDATE product_table SET yield_percentage = ${yield_percentage} WHERE id = ${product_id}`
    );

    res.status(200).json({
        success: true,
        message: "Yield percentage changed successfully."
    });
})


const editBomCostPerkgByProductId = catchAsyncError(async (req, res, next) => {
    const { product_id, bom_cost_per_kg } = req.body;


    if (!product_id) return next(new ErrorHandler("Product id is required.", 400));

    const result = await sequelize.query(
        `UPDATE product_table SET bom_cost_per_kg = ${bom_cost_per_kg} WHERE id = ${product_id}`
    );

    res.status(200).json({
        success: true,
        message: "Bom cost per kg changed successfully."
    });
})


const editNetWeightOfProductByProductId = catchAsyncError(async (req, res, next) => {
    const { product_id, net_weight_of_product } = req.body;


    if (!product_id) return next(new ErrorHandler("Product id is required.", 400));

    const result = await sequelize.query(
        `UPDATE product_table SET net_weight_of_product = ${net_weight_of_product} WHERE id = ${product_id}`
    );

    res.status(200).json({
        success: true,
        message: "Yield percentage changed successfully."
    });
})


const updateAssemblyCostBySkuid = catchAsyncError(async (req, res, next) => {
    const { sku_id } = req.params;

    if (!sku_id) return next(new ErrorHandler("SKU id is required.", 400));

    const result = await sequelize.query(
        `SELECT update_sku_assembly_cost(:p_sku_id);`,
        {
            replacements: {
                p_sku_id: sku_id
            },
            type: sequelize.QueryTypes.SELECT
        }
    );


    console.log("Result of assembly cost: ", result);

    res.status(200).json({
        success: true,
        message: "Assembly cost calculated successfully.",
        data: result
    })
})


export {
    getSKUbyRFQid,
    saveProductswithSKUdetails,
    getProductsBySKUId,
    deleteProductById,
    saveBOMProductswithSKUdetails,
    editYieldPercentageByProductId,
    editBomCostPerkgByProductId,
    editNetWeightOfProductByProductId,
    updateAssemblyCostBySkuid
};