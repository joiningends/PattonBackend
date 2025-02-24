import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { RawMaterial } from "../model/rawMaterialModel.js";
import ErrorHandler from "../util/ErrorHandler.js";


const saveRawmaterial = catchAsyncError(async (req, res, next) => {
    const { raw_material_name, raw_material_rate, quantity_per_assembly, scrap_rate } = req.body;

    if (!raw_material_name || !raw_material_rate || !quantity_per_assembly || !scrap_rate) return next(new ErrorHandler("Plaese provide all the required fields.", 400));

    const rawMaterialData = await RawMaterial.findOne({
        where: {
            raw_material_name: raw_material_name
        }
    });

    if (rawMaterialData) return next(new ErrorHandler("Raw material already exists", 400));

    const newRawMaterial = await RawMaterial.create({
        raw_material_name: raw_material_name,
        raw_material_rate: raw_material_rate,
        quantity_per_assembly: quantity_per_assembly,
        scrap_rate: scrap_rate,
        status: true
    });

    res.status(201).json({
        success: true,
        message: "Raw material added successfully",
        data: newRawMaterial
    });
});


const getRawMaterial = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    let rawMaterialData;
    if (id) {
        rawMaterialData = await RawMaterial.findByPk(id);

        if (!rawMaterialData) return next(new ErrorHandler("No raw material found by the given id", 404));
    } else {
        rawMaterialData = await RawMaterial.findAll();

        if (!rawMaterialData) return next(new ErrorHandler("No data found.", 404));
    }

    res.status(200).json({
        success: true,
        message: "Raw material data fetched successfully",
        data: rawMaterialData
    });
})

const editRawMaterial = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { raw_material_name, raw_material_rate, quantity_per_assembly, scrap_rate } = req.body;

    if (!id) return next(new ErrorHandler("Raw material Id is required", 404));

    const rawMaterialData = await RawMaterial.findByPk(id);
    if (!rawMaterialData) return next(new ErrorHandler("Raw Material not found", 404));

    await RawMaterial.update(
        {
            raw_material_name: raw_material_name || rawMaterialData.raw_material_name,
            raw_material_rate: raw_material_rate || rawMaterialData.raw_material_rate,
            quantity_per_assembly: quantity_per_assembly || rawMaterialData.quantity_per_assembly,
            scrap_rate: scrap_rate || rawMaterialData.scrap_rate,
            updatedAt: new Date(),
        },
        {
            where: { id },
        }
    );


    const updatedRawMaterial = await RawMaterial.findByPk(id);

    res.status(200).json({
        success: true,
        message: "Raw material updated successfully",
        data: updatedRawMaterial
    });
});



const enableDiableRawMaterial = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.query;
    if (!id || !status) return next(new ErrorHandler("Plaese provide all the required fields.", 400));

    const rawMaterialData = await RawMaterial.findByPk(id);

    if (!rawMaterialData) return next(new ErrorHandler("Raw material not found.", 404));

    if (status == 1) {
        await rawMaterialData.update({
            status: false,
        });
    } else if (status == 2) {
        await rawMaterialData.update({
            status: true,
        });
    };

    res.status(200).json({
        success: true,
        message: "Raw material status updated successfully",
        data: rawMaterialData,
    });
});


const deleteRawMaterial = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) return next(new ErrorHandler("Plaese provide all the required fields.", 400));

    const rawMaterialData = await RawMaterial.findByPk(id);
    if (!rawMaterialData) return next(new ErrorHandler("Raw material not found", 404));

    await rawMaterialData.destroy();

    res.status(200).json({
        success: true,
        message: "Raw material deleted successfully"
    })
})



export { saveRawmaterial, getRawMaterial, editRawMaterial, enableDiableRawMaterial, deleteRawMaterial };