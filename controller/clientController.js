import { sequelize } from "../config/connectDB.js";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
// import { Client } from "../model/clientModel.js";
import ErrorHandler from "../util/ErrorHandler.js";

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

// Get client details (all or specific)
const getClientDetails = catchAsyncError(async (req, res, next) => {
    try {
        const clientId = req.params.id; // Will be undefined for all clients route

        // Construct the query based on whether an ID is provided
        const query = 'SELECT * FROM view_client_details(:clientId)';
        
        const result = await sequelize.query(query, {
            replacements: { 
                clientId: clientId || null 
            },
            type: sequelize.QueryTypes.SELECT
        });

        // If client ID was provided but no results found
        if (clientId && result.length === 0) {
            return next(new ErrorHandler("Client not found", 404));
        }

        // Process the results to group contacts with their clients
        const processedResults = processClientResults(result);

        res.status(200).json({
            success: true,
            message: clientId ? "Client details retrieved successfully" : "All clients retrieved successfully",
            data: processedResults
        });

    } catch (error) {
        // Check if it's a database error with a specific message
        if (error.message.includes("does not exist")) {
            return next(new ErrorHandler(error.message, 404));
        }
        console.log("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});

// Helper function to process and group the results
const processClientResults = (results) => {
    const clientMap = new Map();

    results.forEach(row => {
        if (!clientMap.has(row.client_id)) {
            // Create new client entry
            clientMap.set(row.client_id, {
                client_id: row.client_id,
                name: row.client_name,
                email: row.client_email,
                phone: row.client_phone,
                city: row.client_city,
                state: row.client_state,
                country: row.client_country,
                street_no: row.client_street_no,
                pan_gst: row.client_pan_gst,
                other_contacts: []
            });
        }

        // Add contact if it exists
        if (row.contact_id) {
            clientMap.get(row.client_id).other_contacts.push({
                contact_id: row.contact_id,
                name: row.contact_name,
                phone: row.contact_phone,
                email: row.contact_email,
                designation: row.contact_designation,
                company: row.contact_company
            });
        }
    });

    return Array.from(clientMap.values());
};



 
// Update client with contacts
const updateClientData = catchAsyncError(async (req, res, next) => {
    try {
        const clientId = req.params.id;
        const {
            name,
            email,
            phone,
            city,
            state,
            country,
            street_no,
            PAN_gst,
            other_contacts
        } = req.body;

        // Validate client ID
        if (!clientId) {
            return next(new ErrorHandler("Client ID is required", 400));
        }

        // Call the PostgreSQL function
        const result = await sequelize.query(
            'SELECT update_client_data(:p_client_id, :p_name, :p_email, :p_phone, :p_city, :p_state, :p_country, :p_street_no, :p_PAN_gst, :p_other_contacts)',
            {
                replacements: {
                    p_client_id: clientId,
                    p_name: name || null,
                    p_email: email || null,
                    p_phone: phone || null,
                    p_city: city || null,
                    p_state: state || null,
                    p_country: country || null,
                    p_street_no: street_no || null,
                    p_PAN_gst: PAN_gst || null,
                    p_other_contacts: other_contacts ? JSON.stringify(other_contacts) : null
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        const functionResult = result[0]?.update_client_data;

        if (!functionResult) {
            return next(new ErrorHandler("Unexpected database response", 500));
        }

        // Check if the result contains an error message
        if (functionResult.startsWith('Error:')) {
            return next(new ErrorHandler(functionResult, 400));
        }

        res.status(200).json({
            success: true,
            message: functionResult
        });

    } catch (error) {
        console.log("Error details: ", error);
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

export { saveClientData, getClientDetails, updateClientData, disableClient, deleteClient };
