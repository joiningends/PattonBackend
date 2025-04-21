import { sequelize } from "../config/connectDB.js";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { OtherCost } from "../model/otherCostModel.js";
import ErrorHandler from "../util/ErrorHandler.js";




const saveOtherCost = catchAsyncError(async (req, res, next) => {
    const { cost_name } = req.body;

    if (!cost_name) return next(new ErrorHandler("Cost name is required", 400));

    const otherCostData = await OtherCost.findOne({
        where: {
            cost_name: cost_name
        }
    });

    if (otherCostData) return next(new ErrorHandler("Other cost already exists", 400));

    const newOtherCost = await OtherCost.create({
        cost_name: cost_name,
        status: true
    });

    res.status(200).json({
        success: true,
        message: "Other cost saved successfully",
        data: newOtherCost
    });
});


const getOtherCost = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    let otherCostData;
    if (id) {
        otherCostData = await OtherCost.findByPk(id);
        if (!otherCostData) return next(new ErrorHandler("Other cost with the given id not found.", 404));
    } else {
        otherCostData = await OtherCost.findAll();
        if (!otherCostData) return next(new ErrorHandler("No record found.", 404));
    };

    res.status(200).json({
        success: true,
        message: "Other cost data fetched successfully",
        data: otherCostData
    });
});



const editOtherCost = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { cost_name, status } = req.body;

    if (!id) return next(new ErrorHandler("Other cost id is required.", 400));

    const otherCostData = await OtherCost.findByPk(id);
    if (!otherCostData) return next(new ErrorHandler("No record found by the given id.", 404));

    await OtherCost.update(
        {
            cost_name: cost_name || otherCostData.cost_name,
            status: status || otherCostData.status,
            updated_at: new Date()
        },
        {
            where: { id },
        }
    );

    const updatedOtherCostData = await OtherCost.findByPk(id);

    res.status(200).json({
        success: true,
        message: "Other cost updated successfully.",
        data: updatedOtherCostData
    });

});


const deleteOtherCost = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) return next(new ErrorHandler("Other cost id is required.", 400));

    const otherCostData = await OtherCost.findByPk(id);
    if (!otherCostData) return next(new ErrorHandler("No record found by the given other cost id.", 404));

    await otherCostData.destroy();

    res.status(200).json({
        success: true,
        message: "Other cost deleted successfully"
    });
});


const saveOtherCostWithSkuId = catchAsyncError(async (req, res, next) => {
    const { other_cost_id, sku_id, rfq_id, other_cost, other_cost_per_kg, status } = req.body;

    if (!other_cost_id || !sku_id || !rfq_id || !other_cost || !other_cost_per_kg || !status) {
        return next(new ErrorHandler("Please provide all the required fields.", 400));
    }

    try {
        const response = await sequelize.query(
            `SELECT * FROM insert_sku_other_cost(
                :p_other_cost_id,
	            :p_sku_id,
	            :p_rfq_id,
	            :p_other_cost_per_kg,
	            :p_other_cost,
	            :p_status
            )`,
            {
                replacements: {
                    p_other_cost_id: other_cost_id,
                    p_sku_id: sku_id,
                    p_rfq_id: rfq_id,
	                p_other_cost_per_kg: other_cost_per_kg,
	                p_other_cost: other_cost,
	                p_status: status
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        if(!response[0]?.success) {
            return next(new ErrorHandler(response[0]?.message || "Failed to save other cost with sku id", 400));
        };

        res.status(200).json({
            success: true,
            message: response[0].message || `Other cost with sku id: ${sku_id} saved successfully`
        });
    
    }catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }

});


const getOtherCostBySkuAndRfqid = catchAsyncError(async(req, res, next) => {
    const {rfq_id, sku_id} = req.params;

    if(!rfq_id || !sku_id) return next(new ErrorHandler("Please provide all the required fileds", 400));

    try{
        const otherCostData = await sequelize.query(
            `SELECT * FROM get_other_cost_by_skuid(:p_rfq_id, :p_sku_id);`,
            {
                replacements: {
                    p_rfq_id: rfq_id,
                    p_sku_id: sku_id
                },
                type: sequelize.QueryTypes.SELECT   
            }
        );

        res.status(200).json({
            success: true,
            message: "Other cost data by sku and rfq id fetched successfully",
            data: otherCostData
        });
    }catch(error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


const deleteOtherCostBySkuAndRfqidOtherCostId = catchAsyncError(async(req, res, next) => {
    const {id} = req.params;

    if(!id) return next(new ErrorHandler("Please provide the id", 400));

    try{
        const otherCostData = await sequelize.query(
            `DELETE FROM sku_other_cost_rtable WHERE id=${id};`
        );

        res.status(200).json({
            success: true,
            message: "Other cost deleted successfully",
        });
    }catch(error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


const editOtherCostById = catchAsyncError(async (req, res, next) => {
    const {p_id, other_cost_id, other_cost_per_kg, other_cost} = req.body;

    if(!p_id) return next(new ErrorHandler("Please provide Id", 400));

    const result = await sequelize.query(
        `SELECT * FROM update_sku_other_cost(:p_id, :p_other_cost_id, :p_other_cost_per_kg, :p_other_cost)`,
        {
            replacements: {
                p_id: p_id,
                p_other_cost_id: other_cost_id,
                p_other_cost_per_kg: other_cost_per_kg,
                p_other_cost: other_cost
            },
            type: sequelize.QueryTypes.SELECT  
        }
    );

    if(!result[0]?.success) {
        return next(new ErrorHandler(result[0]?.message || "Failed to edit other cost", 400));
    };

    res.status(200).json({
        success: true,
        message: result[0].message || `Other cost edited successfully`
    });

})



export { saveOtherCost, getOtherCost, editOtherCost, deleteOtherCost, saveOtherCostWithSkuId, getOtherCostBySkuAndRfqid, deleteOtherCostBySkuAndRfqidOtherCostId, editOtherCostById };