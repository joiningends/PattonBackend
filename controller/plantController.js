import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { Plant } from "../model/plantModule.js";
import ErrorHandler from "../util/ErrorHandler.js";




// Create plant
const savePlantData = catchAsyncError(async (req, res, next) => {

    const { plantname, plant_head, plant_engineer, address1, address2, city, state, pincode } = req.body;

    if (!plantname) return next(new ErrorHandler("Please provide the required fileds.", 400));

    const plantData = await Plant.findOne({
        where: {
            plantname: plantname
        }
    });

    if (plantData) return next(new ErrorHandler("Plant name already exists.", 400));

    const newPlantData = await Plant.create({
        plantname: plantname,
        plant_head: plant_head,
        plant_engineer: plant_engineer,
        address1: address1,
        address2: address2,
        city: city,
        state: state,
        pincode: pincode,
        status: true
    });

    res.status(201).json({
        success: true,
        message: "Plant created successfully",
        data: newPlantData
    });
})


// Get the plant data
const getPlantData = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    let plantData;

    if (id) {
        plantData = await Plant.findByPk(id);

        if (!plantData) return next(new ErrorHandler("No plant data found for the given id", 404));
    } else {
        plantData = await Plant.findAll();

        if (!plantData) return next(new ErrorHandler("No plant found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Plant data fetched successfully",
        data: plantData
    });
})


// Update the plant data
const editPlant = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { plantname, plant_head, plant_engineer, address1, address2, city, state, pincode, status } = req.body;

    if (!id) return next(new ErrorHandler("Plant id is required", 400));

    const plantData = await Plant.findByPk(id);
    if (!plantData) return next(new ErrorHandler("Plant data not found", 404));

    const plant = await plantData.update({
        plantname: plantname || plantData.plantname,
        plant_head: plant_head || plantData.plant_head,
        plant_engineer: plant_engineer || plantData.plant_engineer,
        status: status || plantData.status,
        address1: address1 || plantData.address1,
        address2: address2 || plantData.address2,
        city: city || plantData.city,
        state: state || plantData.state,
        pincode: pincode || plantData.pincode,
        updatedAt: Date.now(),
    });

    res.status(200).json({
        success: true,
        message: "Plant data updated successfully",
        data: plant
    });
})


// Delete plant
const deletePlant = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!id) return next(new ErrorHandler("Plant id is required", 400));

    const plantData = await Plant.findByPk(id);
    if (!plantData) return next(new ErrorHandler("No data found", 404));

    await plantData.destroy();

    res.status(200).json({
        success: true,
        message: "Plant deleted successfully"
    })
})


export { savePlantData, getPlantData, editPlant, deletePlant };