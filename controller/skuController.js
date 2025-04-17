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


const updateAssemblyWeightBySkuid = catchAsyncError(async (req, res, next) => {
    const { sku_id } = req.params;

    if (!sku_id) return next(new ErrorHandler("SKU id is required.", 400));

    const result = await sequelize.query(
        `SELECT update_sku_assembly_weight(:p_sku_id);`,
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

const editYieldPercbyProductId = catchAsyncError(async (req, res, next) => {
    const { product_id, yield_percentage } = req.body;

    if (!product_id) next(new ErrorHandler("Product id is required.", 400));
    if (!yield_percentage) next(new ErrorHandler("Yield percentage is required.", 400));

    const [result] = await sequelize.query(
        `SELECT * FROM update_product_yield_percentage(:p_product_id, :p_yield_percentage);`,
        {
            replacements: {
                p_product_id: product_id,
                p_yield_percentage: yield_percentage
            },
            type: sequelize.QueryTypes.SELECT
        }
    );

    console.log(result);

    if (!result) {
        return next(new ErrorHandler("No response from database operation", 500));
    }

    if (!result.success) {
        return next(new ErrorHandler(result.message, 400));
    }

    res.status(200).json({
        success: true,
        message: result.message,
    });
})



const editBomCostPerKgbyProductId = catchAsyncError(async (req, res, next) => {
    const { product_id, bom_cost_per_kg } = req.body;

    if (!product_id) next(new ErrorHandler("Product id is required.", 400));
    if (!bom_cost_per_kg) next(new ErrorHandler("Bom cost per kg is required.", 400));

    const [result] = await sequelize.query(
        `SELECT * FROM update_product_bom_cost_per_kg(:p_product_id, :p_bom_cost_per_kg);`,
        {
            replacements: {
                p_product_id: product_id,
                p_bom_cost_per_kg: bom_cost_per_kg
            },
            type: sequelize.QueryTypes.SELECT
        }
    );

    console.log(result);

    if (!result) {
        return next(new ErrorHandler("No response from database operation", 500));
    }

    if (!result.success) {
        return next(new ErrorHandler(result.message, 400));
    }

    res.status(200).json({
        success: true,
        message: result.message,
    });
})




const editProductNetWeightProductId = catchAsyncError(async (req, res, next) => {
    const { product_id, net_weight_of_product } = req.body;

    if (!product_id) next(new ErrorHandler("Product id is required.", 400));
    if (!net_weight_of_product) next(new ErrorHandler("net weight of product is required.", 400));

    const [result] = await sequelize.query(
        `SELECT * FROM update_product_net_weight(:p_product_id, :p_net_weight_of_product);`,
        {
            replacements: {
                p_product_id: product_id,
                p_net_weight_of_product: net_weight_of_product
            },
            type: sequelize.QueryTypes.SELECT
        }
    );

    console.log(result);

    if (!result) {
        return next(new ErrorHandler("No response from database operation", 500));
    }

    if (!result.success) {
        return next(new ErrorHandler(result.message, 400));
    }

    res.status(200).json({
        success: true,
        message: result.message,
    });
});


const saveOrUpdateJobCost = catchAsyncError(async (req, res, next) => {
    const { job_id, isskulevel, sku_id, rfq_id, job_costs, status, isEdit = false } = req.body;

    // Validate required fields
    if (!job_id || isskulevel === undefined || !rfq_id || !job_costs || status === undefined) {
        return next(new ErrorHandler("Please provide all required fields: job_id, isskulevel, rfq_id, job_costs, status", 400));
    }

    // For SKU level, validate sku_id exists
    if (isskulevel === true && !sku_id) {
        return next(new ErrorHandler("SKU ID is required for SKU level job costs", 400));
    }

    // For product level, validate job_costs array structure
    if (isskulevel === false) {
        if (!Array.isArray(job_costs) || job_costs.length === 0) {
            return next(new ErrorHandler("Job costs must be a non-empty array for product level", 400));
        }

        for (const cost of job_costs) {
            if (!cost.product_id || cost.job_cost === undefined) {
                return next(new ErrorHandler("Each product cost must contain product_id, job_cost", 400));
            }
        }
    } else {
        // For SKU level, ensure job_costs has at least one entry (but only first is used)
        if (!Array.isArray(job_costs) || job_costs.length === 0) {
            return next(new ErrorHandler("Job cost data is required for SKU level", 400));
        }
    }

    try {
        const functionName = isEdit ? 'update_job_cost_sku_or_product' : 'insert_job_cost';

        const response = await sequelize.query(
            `SELECT * FROM ${functionName}(
                :job_id, 
                :isskulevel, 
                :sku_id, 
                :rfq_id, 
                :job_costs, 
                :status
            )`,
            {
                replacements: {
                    job_id,
                    isskulevel,
                    sku_id,
                    rfq_id,
                    job_costs: JSON.stringify(job_costs),
                    status
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!response[0]?.success) {
            return next(new ErrorHandler(response[0]?.message ||
                `Failed to ${isEdit ? 'update' : 'save'} job costs`, 400));
        }

        res.status(200).json({
            success: true,
            message: response[0].message ||
                `Job costs ${isEdit ? 'updated' : 'saved'} successfully`
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// const saveOrUpdateJobCost = catchAsyncError(async (req, res, next) => {
//     const { job_id, isskulevel, sku_id, rfq_id, job_costs, status, isEdit = false } = req.body;

//     // Validate required fields
//     if (!job_id || isskulevel === undefined || !rfq_id || !job_costs || status === undefined) {
//         return next(new ErrorHandler("Please provide all required fields: job_id, isskulevel, rfq_id, job_costs, status", 400));
//     }

//     try {
//         // Format job_costs correctly based on level
//         let formattedJobCosts;
//         if (isskulevel) {
//             // For SKU level, we expect a single cost object
//             formattedJobCosts = Array.isArray(job_costs) ? job_costs : [job_costs];
//         } else {
//             // For product level, we expect an array of costs
//             formattedJobCosts = Array.isArray(job_costs) ? job_costs : [];
//         }

//         const response = await sequelize.query(
//             `SELECT * FROM ${isEdit ? 'update_job_cost_sku_or_product' : 'insert_job_cost'}(
//                 :job_id, 
//                 :isskulevel, 
//                 :sku_id, 
//                 :rfq_id, 
//                 :job_costs, 
//                 :status
//             )`,
//             {
//                 replacements: {
//                     job_id,
//                     isskulevel,
//                     sku_id,
//                     rfq_id,
//                     job_costs: JSON.stringify(formattedJobCosts),
//                     status
//                 },
//                 type: sequelize.QueryTypes.SELECT
//             }
//         );

//         if (!response[0]?.success) {
//             return next(new ErrorHandler(response[0]?.message ||
//                 `Failed to ${isEdit ? 'update' : 'save'} job costs`, 400));
//         }

//         res.status(200).json({
//             success: true,
//             message: response[0].message ||
//                 `Job costs ${isEdit ? 'updated' : 'saved'} successfully`
//         });

//     } catch (error) {
//         return next(new ErrorHandler(error.message, 500));
//     }
// });

const getJobCostsByRfqAndSku = catchAsyncError(async (req, res, next) => {
    const { rfqId, skuId } = req.params;

    if (!rfqId || !skuId) {
        return next(new ErrorHandler("RFQ ID and SKU ID are required", 400));
    }

    try {
        const jobCosts = await sequelize.query(
            `SELECT * FROM get_job_costs_by_rfq_and_sku(:rfqId, :skuId)`,
            {
                replacements: { rfqId, skuId },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Organize by job type if needed
        const organizedData = {};
        jobCosts.forEach(cost => {
            if (!organizedData[cost.job_id]) {
                organizedData[cost.job_id] = {
                    job_id: cost.job_id,
                    job_name: cost.job_name,
                    costs: []
                };
            }
            organizedData[cost.job_id].costs.push(cost);
        });

        res.status(200).json({
            success: true,
            data: Object.values(organizedData)
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


const deleteJobCostBySkuJobId = catchAsyncError(async (req, res, next) => {
    const { jobId, skuId } = req.params;

    if (!jobId || !skuId) {
        return next(new ErrorHandler("Job ID and SKU ID are required", 400));
    }

    try {
        const jobCosts = await sequelize.query(
            `DELETE FROM job_sku_or_product_rtable WHERE sku_id = ${skuId} AND job_id = ${jobId};`
        );


        res.status(200).json({
            success: true,
            message: "Job cost deleted successfully",
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


const calculateSubTotalCost = catchAsyncError(async (req, res, next) => {
    const { sku_id, rfq_id } = req.params;

    if (!sku_id) return next(new ErrorHandler("Sku id is required.", 400));

    if (!rfq_id) return next(new ErrorHandler("RFQ id is required.", 400));


    const result = await sequelize.query(
        `SELECT calculate_subtotal_cost_by_sku(:p_sku_id, :p_rfq_id) AS subtotal_cost;`,
        {
            replacements: {
                p_sku_id: sku_id,
                p_rfq_id: rfq_id
            },
            type: sequelize.QueryTypes.SELECT
        }
    );

    console.log(result);

    if (!result) return next(new ErrorHandler("Error calculating sub total cost.", 500));

    res.status(200).json({
        success: true,
        message: "Sub total cost calculated successfully",
        subtotal_cost: result[0].subtotal_cost
    });
});


export {
    getSKUbyRFQid,
    saveProductswithSKUdetails,
    getProductsBySKUId,
    deleteProductById,
    saveBOMProductswithSKUdetails,
    editYieldPercentageByProductId,
    editBomCostPerkgByProductId,
    editNetWeightOfProductByProductId,
    updateAssemblyWeightBySkuid,
    editYieldPercbyProductId,
    editBomCostPerKgbyProductId,
    editProductNetWeightProductId,
    saveOrUpdateJobCost,
    getJobCostsByRfqAndSku,
    calculateSubTotalCost,
    deleteJobCostBySkuJobId
};