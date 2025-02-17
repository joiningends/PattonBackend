import { sequelize } from "../config/connectDB.js";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
// import { Client } from "../model/clientModel.js";
import ErrorHandler from "../util/ErrorHandler.js";

// Create a new client
// Save client data with other contacts
const saveClientData = catchAsyncError(async (req, res, next) => {
    try {
        const {
            p_name,
            p_email,
            p_phone,
            p_city,
            p_state,
            p_country,
            p_street_no,
            p_PAN_gst,
            p_other_contacts
        } = req.body;

        // Validate required fields
        if (!p_name || !p_email || !p_phone) {
            return next(new ErrorHandler("Please fill all required fields", 400));
        }

        // Call the PostgreSQL function
        const result = await sequelize.query(
            'SELECT save_client_data(:p_name, :p_email, :p_phone, :p_city, :p_state, :p_country, :p_street_no, :p_PAN_gst, :p_other_contacts)',
            {
                replacements: {
                    p_name,
                    p_email,
                    p_phone,
                    p_city: p_city || null,
                    p_state: p_state || null,
                    p_country: p_country || null,
                    p_street_no: p_street_no || null,
                    p_PAN_gst: p_PAN_gst || null,
                    p_other_contacts: p_other_contacts ? JSON.stringify(p_other_contacts) : null
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Get the function result
        const functionResult = result[0]?.save_client_data;

        if (!functionResult) {
            return next(new ErrorHandler("Unexpected database response", 500));
        }

        // Check if the result contains an error message
        if (functionResult.startsWith('Error:')) {
            return next(new ErrorHandler(functionResult, 400));
        }

        res.status(200).json({
            success: true,
            message: functionResult,
            data: result[0]
        });

    } catch (error) {
        console.log("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});

// Fetch client(s)
const getClient = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        let clientData = id ? await Client.findByPk(id) : await Client.findAll();

        if (!clientData) return next(new ErrorHandler("No client found", 404));

        res.status(200).json({ success: true, message: "Client data fetched successfully", data: clientData });
    } catch (error) {
        console.error("Error details:", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});

// Update client
const updateClient = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, city, state, country, street_no, PAN_gst, status } = req.body;

        const client = await Client.findByPk(id);
        if (!client) return next(new ErrorHandler("Client not found", 404));

        await client.update({ name, email, phone, city, state, country, street_no, PAN_gst, status });

        res.status(200).json({ success: true, message: "Client updated successfully", data: client });
    } catch (error) {
        console.error("Error details:", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});

// Disable client
const disableClient = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id) return next(new ErrorHandler("Client ID is required", 400));

        const client = await Client.findByPk(id);
        if (!client) return next(new ErrorHandler("Client not found", 404));

        await client.update({ status: status === 1 ? false : true });

        res.status(200).json({ success: true, message: "Client status updated successfully", data: client });
    } catch (error) {
        console.error("Error details:", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});

// Delete client (hard delete)
const deleteClient = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        const client = await Client.findByPk(id);
        if (!client) return next(new ErrorHandler("Client not found", 404));

        await client.destroy();

        res.status(200).json({ success: true, message: "Client deleted successfully", data: client });
    } catch (error) {
        console.error("Error details:", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});

export { saveClientData, getClient, updateClient, disableClient, deleteClient };
