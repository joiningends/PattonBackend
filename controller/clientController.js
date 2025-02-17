import { where } from "sequelize";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { Client } from "../model/clientModel.js";
import ErrorHandler from "../util/ErrorHandler.js";

// Create a new client
const createClient = catchAsyncError(async (req, res, next) => {
    try {
        const { name, email, phone, city, state, country, street_no, PAN_gst } = req.body;

        if (!name || !email || !phone) return next(new ErrorHandler("Please provide all the required fields", 400));

        const emailExists = await Client.findOne({ where: { email } });
        if (emailExists) return next(new ErrorHandler("Email already exists", 400));

        const newClient = await Client.create({
            name, email, phone, city, state, country, street_no, PAN_gst,
            status: true,
        });

        res.status(201).json({ success: true, message: "Client created successfully", data: newClient });
    } catch (error) {
        console.error("Error details:", error);
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

export { createClient, getClient, updateClient, disableClient, deleteClient };
