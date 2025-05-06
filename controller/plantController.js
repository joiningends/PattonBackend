import { assign } from "nodemailer/lib/shared/index.js";
import { sequelize } from "../config/connectDB.js";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { Plant } from "../model/plantModule.js";
import ErrorHandler from "../util/ErrorHandler.js";




// Create plant
const savePlantData = catchAsyncError(async (req, res, next) => {

    const { plantname, plant_head, address1, address2, city, state, pincode, p_npd_engineers, p_vendor_engineers, p_process_engineers } = req.body;

    if (!plantname) return next(new ErrorHandler("Please provide the required fileds.", 400));

    const transaction = await sequelize.transaction();

    const plantData = await Plant.findOne({
        where: {
            plantname: plantname
        }
    });

    if (plantData) return next(new ErrorHandler("Plant name already exists.", 400));

    const newPlantData = await Plant.create({
        plantname: plantname,
        plant_head: plant_head,
        address1: address1,
        address2: address2,
        city: city,
        state: state,
        pincode: pincode,
        status: true
    }, {transaction});

    // Assign new engineers
    await assignEngineersToPlant(
        newPlantData.id,
        p_npd_engineers,
        p_vendor_engineers,
        p_process_engineers,
        transaction
    );


    await transaction.commit();


    res.status(201).json({
        success: true,
        message: "Plant created successfully",
        data: newPlantData
    });
})


// Get the plant data with multiple engineers
const getPlantData = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const query = id ? `SELECT * FROM get_plants(:p_plant_id);` : `SELECT * FROM get_plants();`

    const plantData = await sequelize.query(query, {
        replacements: { p_plant_id: id },
        type: sequelize.QueryTypes.SELECT
    });

    if (!plantData || plantData.length === 0) {
        return next(new ErrorHandler("No plant data found", 404));
    }

    // Process the data to make it more frontend-friendly
    const processedData = plantData.map(plant => ({
        ...plant,
        process_engineers: plant.process_engineers || [],
        npd_engineers: plant.npd_engineers || [],
        vendor_development_engineers: plant.vendor_development_engineers || []
    }));

    res.status(200).json({
        success: true,
        message: "Plant data fetched successfully",
        data: id ? processedData[0] : processedData
    });
});


// Update the plant data and assign engineers
const editPlant = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const {
        plantname,
        plant_head,
        address1,
        address2,
        city,
        state,
        pincode,
        status,
        npd_engineers,
        vendor_development_engineers,
        process_engineers
    } = req.body;

    if (!id) return next(new ErrorHandler("Plant id is required", 400));

    // Validate required fields
    if (!plantname) return next(new ErrorHandler("Plant name is required", 400));
    if (!plant_head) return next(new ErrorHandler("Plant head is required", 400));
    if (!npd_engineers || npd_engineers.length === 0) return next(new ErrorHandler("At least one NPD engineer is required", 400));
    if (!vendor_development_engineers || vendor_development_engineers.length === 0) return next(new ErrorHandler("At least one Vendor Development engineer is required", 400));
    if (!process_engineers || process_engineers.length === 0) return next(new ErrorHandler("At least one Process engineer is required", 400));

    const transaction = await sequelize.transaction();

    try {
        // Update plant basic info
        const plantData = await Plant.findByPk(id, { transaction });
        if (!plantData) {
            await transaction.rollback();
            return next(new ErrorHandler("Plant data not found", 404));
        }

        const updatedPlant = await plantData.update({
            plantname,
            plant_head,
            address1,
            address2,
            city,
            state,
            pincode,
            status: status !== undefined ? status : plantData.status,
            updatedAt: new Date()
        }, { transaction });

        // First deactivate all existing engineer mappings for this plant
        await sequelize.query(
            'CALL deactivate_plant_engineers(:p_plant_id)',
            {
                replacements: { p_plant_id: id },
                type: sequelize.QueryTypes.RAW,
                transaction
            }
        );

        // Assign new engineers
        await assignEngineersToPlant(
            id,
            npd_engineers,
            vendor_development_engineers,
            process_engineers,
            transaction
        );

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: "Plant data and engineers updated successfully",
            data: updatedPlant
        });

    } catch (error) {
        await transaction.rollback();
        return next(new ErrorHandler(`Error updating plant: ${error.message}`, 500));
    }
});

// Helper function to assign engineers
const assignEngineersToPlant = async (plantId, npdEngineers, vendorEngineers, processEngineers, transaction) => {
    // Assign NPD engineers (type 1)
    for (const engineerId of npdEngineers) {
        await sequelize.query(
            'CALL save_engineer_for_plant(:p_plant_id, :p_user_id, :p_engineer_type)',
            {
                replacements: {
                    p_plant_id: plantId,
                    p_user_id: engineerId,
                    p_engineer_type: 1
                },
                type: sequelize.QueryTypes.RAW,
                transaction
            }
        );
    }

    // Assign Vendor engineers (type 2)
    for (const engineerId of vendorEngineers) {
        await sequelize.query(
            'CALL save_engineer_for_plant(:p_plant_id, :p_user_id, :p_engineer_type)',
            {
                replacements: {
                    p_plant_id: plantId,
                    p_user_id: engineerId,
                    p_engineer_type: 2
                },
                type: sequelize.QueryTypes.RAW,
                transaction
            }
        );
    }

    // Assign Process engineers (type 3)
    for (const engineerId of processEngineers) {
        await sequelize.query(
            'CALL save_engineer_for_plant(:p_plant_id, :p_user_id, :p_engineer_type)',
            {
                replacements: {
                    p_plant_id: plantId,
                    p_user_id: engineerId,
                    p_engineer_type: 3
                },
                type: sequelize.QueryTypes.RAW,
                transaction
            }
        );
    }
};


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