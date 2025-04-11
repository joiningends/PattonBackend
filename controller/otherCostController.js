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
    const { id } = res.params;
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



export { saveOtherCost, getOtherCost, editOtherCost, deleteOtherCost };