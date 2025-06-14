import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import ErrorHandler from "../util/ErrorHandler.js";
import { sequelize } from "../config/connectDB.js";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from 'util';
import { State } from "../model/stateModel.js";
import { Sequelize } from "sequelize";
import { version } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const unlinkAsync = promisify(fs.unlink);

const saveRFQandSKUdata = catchAsyncError(async (req, res, next) => {
    try {
        const { p_rfq_name, p_user_id, p_client_id, p_skus } = req.body;

        // Validate required fields
        if (!p_rfq_name || !p_user_id || !p_client_id || !Array.isArray(p_skus) || p_skus.length === 0) {
            return next(new ErrorHandler("Please provide all required fields", 400));
        }

        // Calling the stored procedure
        const result = await sequelize.query(
            'CALL insert_rfq_sku(:p_rfq_name, :p_user_id, :p_client_id, :p_skus, :p_rfq_id)',
            {
                replacements: {
                    p_rfq_name,
                    p_user_id,
                    p_client_id,
                    p_skus: JSON.stringify(p_skus),
                    p_rfq_id: null
                },
                type: sequelize.QueryTypes.RAW
            }
        );

        console.log("result: ", result);

        const rfqId = result[0][0]?.p_rfq_id;
        console.log(rfqId);

        res.status(200).json({
            success: true,
            message: "RFQ and SKUs inserted successfully",
            RFQ_id: rfqId
        });
    } catch (error) {
        console.error("Error details:", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});




const getRFQDetail = catchAsyncError(async (req, res, next) => {
    try {
        const { p_user_id, p_role_id, p_rfq_id, p_client_id } = req.body; // Get parameters from query string

        console.log("user_id: ", p_user_id);
        console.log("role_id: ", p_role_id);

        // if(!p_user_id) return next(new ErrorHandler("User id is required.", 400));

        // Query the function using raw SQL
        // const query = `SELECT * FROM get_rfq(:p_user_id, :p_rfq_id, :p_client_id);`;

        const query = `SELECT * FROM get_rfq_latest(:p_user_id, :p_rfq_id, :p_client_id);`;

        console.log("RFQ_ID: ", p_rfq_id);

        const rfqData = await sequelize.query(query, {
            replacements: {
                p_user_id: p_user_id,
                p_rfq_id: p_rfq_id || null,
                p_client_id: p_client_id || null
            },
            type: sequelize.QueryTypes.SELECT,
        });

        if (!rfqData || rfqData.length === 0) {
            return next(new ErrorHandler("No RFQ data found", 404));
        }

        // Process the results to group skus
        const processedResults = processRFQResults(rfqData);

        res.status(200).json({
            success: true,
            data: processedResults, // Send the array of RFQ details
        });
    } catch (error) {
        console.error("Error fetching RFQ details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});


const getRFQforPlantHead = catchAsyncError(async (req, res, next) => {
    const { p_user_id, p_rfq_id, p_client_id } = req.body;

    if (!p_user_id) return next(new ErrorHandler("User id is required", 400));

    const rfqData = await sequelize.query(`SELECT * FROM get_rfq_for_planthead(:p_user_id, :p_rfq_id, :p_client_id);`, {
        replacements: {
            p_user_id: p_user_id,
            p_rfq_id: p_rfq_id,
            p_client_id: p_client_id,
        },
        type: sequelize.QueryTypes.SELECT,
    });

    if (!rfqData || rfqData.length === 0) {
        return next(new ErrorHandler("No RFQ data found", 404));
    }

    // Process the results to group skus
    const processedResults = processRFQResults(rfqData);

    res.status(200).json({
        success: true,
        data: processedResults, // Send the array of RFQ details
    });
})


const getRFQDetailByUserRole = catchAsyncError(async (req, res, next) => {
    try {
        const { user_id } = req.params;
        const { p_assigned_to_roleId, p_assigned_by_roleId } = req.query;

        if (!user_id) return next(new ErrorHandler("User id is required.", 400));

        // const roleResponse = await sequelize.query(
        //     `SELECT role_id FROM user_role_rtable WHERE user_id = :p_user_id;`,
        //     {
        //         replacements: {
        //             p_user_id: user_id
        //         },
        //         type: sequelize.QueryTypes.SELECT
        //     }
        // );

        // if (!roleResponse) return next(new ErrorHandler("Unrecognised role by the given user id."));

        // console.log("roleResponse: ", roleResponse[0].role_id);

        // if (roleResponse[0].role_id !== 19) return next(new ErrorHandler("Not a NPD engineer."));

        console.log("role data: ", user_id, p_assigned_by_roleId, p_assigned_to_roleId);

        const rfqData = await sequelize.query(
            `SELECT * FROM get_rfq_by_user_role_latest(:p_user_id, :p_assigned_to_role, :p_assigned_by_role);`,
            {
                replacements: {
                    p_user_id: user_id,
                    p_assigned_to_role: p_assigned_to_roleId,
                    p_assigned_by_role: p_assigned_by_roleId,
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!rfqData || rfqData.length === 0) {
            return next(new ErrorHandler("No RFQ data found", 404));
        }

        // Process the results to group skus
        const processedResults = processRFQResults(rfqData);

        res.status(200).json({
            success: true,
            data: processedResults, // Send the array of RFQ details
        });

    } catch (error) {
        console.error("Error fetching RFQ details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
})


// Helper function to process and group the sku's
const processRFQResults = (results) => {
    const RFQMap = new Map();

    results.forEach(row => {
        if (!RFQMap.has(row.rfq_id)) {
            // Create new client entry
            RFQMap.set(row.rfq_id, {
                rfq_id: row.rfq_id,
                rfq_name: row.rfq_name,
                rfq_status: row.rfq_status,
                user_id: row.user_id,
                role_id: row.role_id,
                client_id: row.client_id,
                client_name: row.client_name,
                plant_id: row.plant_id,
                state_id: row.state_id,
                state_description: row.state_description,
                comments: row.comments,
                freight_cost: row.freight_cost,
                ex_factory_cost: row.ex_factory_cost,
                total_factory_cost: row.total_factory_cost,
                factory_overhead_cost: row.factory_overhead_cost,
                insurance_cost: row.insurance_cost,
                margin: row.margin,
                cif_cost: row.cif_cost,
                fob_cost: row.fob_cost,
                total_cost_to_customer: row.total_cost_to_customer,
                version_no: row.version_no,
                is_latest_version: row.is_latest_version,
                skus: []
            });
        }

        // Add contact if it exists
        if (row.sku_name) {
            RFQMap.get(row.rfq_id).skus.push({
                sku_name: row.sku_name,
                sku_repeat: row.sku_repeat,
                sku_tooling_cost: row.sku_tooling_cost,
                sku_annual_usage: row.sku_annual_usage,
                sku_assembly_cost: row.sku_assembly_cost,
                sku_packing_cost: row.sku_packing_cost,
                sku_description: row.sku_description,
                sku_drawing_no: row.sku_drawing_no,
                sku_size: row.sku_size,
                sku_status: row.sku_status,
                sku_part_no: row.sku_part_no
            });
        }
    });

    return Array.from(RFQMap.values());
};


const updateRFQStatus = catchAsyncError(async (req, res, next) => {
    const { rfqid, status } = req.params;

    if (!rfqid) return next(new ErrorHandler("RFQ id is required.", 400));

    if (!status) return next(new ErrorHandler("RFQ status is required.", 400));

    const result = await sequelize.query(
        `UPDATE rfq_table SET status=${status} WHERE id=${rfqid}`
    );

    res.status(200).json({
        success: true,
        message: "RFQ status updated successfully."
    });
});


// create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, "../upload/rfq_documents");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
};



//Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const rfqId = req.params.rfqId;
        const rfqDir = path.join(uploadDir, `rfq_${rfqId}`);

        // Create directory for this RFQ if it doesn't exist
        if (!fs.existsSync(rfqDir)) {
            fs.mkdirSync(rfqDir, { recursive: true });
        }

        cb(null, rfqDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with original extension
        const fileExt = path.extname(file.originalname);
        const uniqueFilename = `${Date.now()}_${uuidv4().substring(0, 8)}${fileExt}`;
        cb(null, uniqueFilename);
    }
});


// Create upload middleware with file filter
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
    },
    fileFilter: function (req, file, cb) {
        // Check allowed file types
        const allowedFileTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedFileTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, and PNG files are allowed.'));
        }
    }
});


// Helper function to get file MIME type
const getMimeType = (filename) => {
    const extension = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png'
    };
    return mimeTypes[extension] || 'application/octet-stream';
};




// Controller for uploading documents
const uploadRFQDocuments = catchAsyncError(async (req, res, next) => {
    try {
        const { rfqId } = req.params;

        // Validate RFQ ID
        if (!rfqId) {
            return next(new ErrorHandler('RFQ ID is required', 400));
        }

        // Check if RFQ exists in database
        const rfqExists = await sequelize.query(
            'SELECT EXISTS(SELECT 1 FROM rfq_table WHERE id = :rfqId AND status = true)',
            {
                replacements: { rfqId },
                type: sequelize.QueryTypes.SELECT,
                plain: true
            }
        );

        if (!rfqExists || !rfqExists.exists) {
            return next(new ErrorHandler(`RFQ with ID ${rfqId} does not exist or is inactive`, 404));
        }

        // Process file upload using multer middleware
        upload.array('documents', 10)(req, res, async function (err) {
            if (err) {
                return next(new ErrorHandler(err.message, 400));
            }

            if (!req.files || req.files.length === 0) {
                return next(new ErrorHandler('No files were uploaded', 400));
            }

            // Save file metadata to database
            const documentRecords = [];
            for (const file of req.files) {
                // Get relative path from upload directory
                const relativePath = path.relative(path.join(__dirname, '..'), file.path);

                // Save document metadata to database
                const [documentRecord] = await sequelize.query(
                    `INSERT INTO rfq_document_table (
              rfq_id, 
              file_name, 
              original_name,
              file_path, 
              file_size, 
              mime_type
            ) VALUES (
              :rfqId, 
              :fileName, 
              :originalName,
              :filePath, 
              :fileSize, 
              :mimeType
            ) RETURNING id, file_name, original_name, file_size`,
                    {
                        replacements: {
                            rfqId: rfqId,
                            fileName: file.filename,
                            originalName: file.originalname,
                            filePath: relativePath,
                            fileSize: file.size,
                            mimeType: getMimeType(file.filename)
                        },
                        type: sequelize.QueryTypes.INSERT
                    }
                );

                documentRecords.push(documentRecord[0]);
            }

            res.status(200).json({
                success: true,
                message: `${req.files.length} document(s) uploaded successfully`,
                data: {
                    rfqId: rfqId,
                    documents: documentRecords
                }
            });
        });
    } catch (error) {
        console.error('Error details:', error);
        next(new ErrorHandler('Internal server error', 500));
    }
});

// Controller for getting documents by RFQ ID
const getRFQDocuments = catchAsyncError(async (req, res, next) => {
    try {
        const { rfqId } = req.params;

        if (!rfqId) {
            return next(new ErrorHandler('RFQ ID is required', 400));
        }

        const documents = await sequelize.query(
            `SELECT 
          id, 
          rfq_id, 
          file_name, 
          original_name, 
          file_path, 
          file_size, 
          mime_type, 
          status,
          createdAt,
          updatedAt
        FROM rfq_document_table 
        WHERE rfq_id = :rfqId AND status = true
        ORDER BY createdAt DESC`,
            {
                replacements: { rfqId },
                type: sequelize.QueryTypes.SELECT
            }
        );

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        console.error('Error details:', error);
        next(new ErrorHandler('Internal server error', 500));
    }
});

// Controller for downloading a document
const downloadRFQDocument = catchAsyncError(async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return next(new ErrorHandler('Document ID is required', 400));
        }

        const document = await sequelize.query(
            `SELECT 
          file_name, 
          original_name, 
          file_path, 
          mime_type
        FROM rfq_document_table 
        WHERE id = :documentId AND status = true`,
            {
                replacements: { documentId },
                type: sequelize.QueryTypes.SELECT,
                plain: true
            }
        );

        if (!document) {
            return next(new ErrorHandler('Document not found', 404));
        }

        const filePath = path.join(__dirname, '..', document.file_path);

        if (!fs.existsSync(filePath)) {
            return next(new ErrorHandler('File not found on server', 404));
        }

        console.log(document);

        res.setHeader('Content-Type', document.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error details:', error);
        next(new ErrorHandler('Internal server error', 500));
    }
});

// Controller for deleting a document (soft delete)
const deleteRFQDocument = catchAsyncError(async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return next(new ErrorHandler('Document ID is required', 400));
        }

        const document = await sequelize.query(
            `UPDATE rfq_document_table 
        SET status = false, updatedAt = CURRENT_TIMESTAMP
        WHERE id = :documentId
        RETURNING id, file_name`,
            {
                replacements: { documentId },
                type: sequelize.QueryTypes.UPDATE,
                plain: true
            }
        );

        if (!document || !document.id) {
            return next(new ErrorHandler('Document not found or already deleted', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
            data: {
                id: document.id,
                fileName: document.file_name
            }
        });
    } catch (error) {
        console.error('Error details:', error);
        next(new ErrorHandler('Internal server error', 500));
    }
});


const deleteRFQDocumentPermanently = catchAsyncError(async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return next(new ErrorHandler('Document ID is required', 400));
        }

        // Fetch document to get file path
        const document = await sequelize.query(
            `SELECT id, file_path FROM rfq_document_table WHERE id = :documentId`,
            {
                replacements: { documentId },
                type: sequelize.QueryTypes.SELECT,
                plain: true
            }
        );

        if (!document) {
            return next(new ErrorHandler('Document not found', 404));
        }

        // Delete the file from the folder
        const filePath = path.resolve(document.file_path);
        fs.access(filePath, fs.constants.F_OK, async (err) => {
            if (!err) {
                await unlinkAsync(filePath);
            }
        });

        // Remove entry from database
        await sequelize.query(
            `DELETE FROM rfq_document_table WHERE id = :documentId`,
            {
                replacements: { documentId },
                type: sequelize.QueryTypes.DELETE
            }
        );

        res.status(200).json({
            success: true,
            message: 'Document deleted permanently'
        });
    } catch (error) {
        console.error('Error details:', error);
        next(new ErrorHandler('Internal server error', 500));
    }
});



// Approve rfq and send to plant
const approveOrRejectRFQ = catchAsyncError(async (req, res, next) => {
    try {
        const { rfq_id, user_id, state_id, plant_ids, comments } = req.body;

        // Validate required fields
        if (!rfq_id || !user_id || state_id === undefined) {
            return next(new ErrorHandler("Please provide all required fields", 400));
        }

        // Validate state_id and corresponding parameters
        if (state_id === 2 && (!plant_ids || plant_ids.length === 0)) {
            return next(new ErrorHandler("At least one Plant ID is required when approving an RFQ", 400));
        }

        if (state_id === 0 && !comments) {
            return next(new ErrorHandler("Comments are required when rejecting an RFQ", 400));
        }

        // For approval with multiple plants
        if (state_id === 2 && plant_ids && plant_ids.length > 0) {
            // Process each plant assignment
            for (const plant_id of plant_ids) {
                await sequelize.query(
                    'CALL approve_rfq_send_plant(:p_rfq_id, :p_user_id, :p_state_id, :p_plant_id, :p_comments)',
                    {
                        replacements: {
                            p_rfq_id: rfq_id,
                            p_user_id: user_id,
                            p_state_id: state_id,
                            p_plant_id: plant_id,
                            p_comments: comments
                        },
                        type: sequelize.QueryTypes.RAW
                    }
                );
            }
        } else {
            // For rejection or single plant approval (backward compatibility)
            await sequelize.query(
                'CALL approve_rfq_send_plant(:p_rfq_id, :p_user_id, :p_state_id, :p_plant_id, :p_comments)',
                {
                    replacements: {
                        p_rfq_id: rfq_id,
                        p_user_id: user_id,
                        p_state_id: state_id,
                        p_plant_id: plant_ids ? plant_ids[0] : null, // First plant if array, null otherwise
                        p_comments: comments
                    },
                    type: sequelize.QueryTypes.RAW
                }
            );
        }

        // Prepare response message based on action
        const actionMessage = state_id === 2
            ? comments
                ? `approved with comments and assigned to ${plant_ids.length} plant(s)`
                : `approved and assigned to ${plant_ids.length} plant(s)`
            : "rejected";

        res.status(200).json({
            success: true,
            message: `RFQ ${actionMessage} successfully`,
            rfq_id: rfq_id
        });
    } catch (error) {
        console.error("Error details:", error);

        // Check for specific PostgreSQL error messages and provide better error handling
        if (error.message && error.message.includes("does not exist or is inactive")) {
            return next(new ErrorHandler(error.message, 404));
        }

        if (error.message && error.message.includes("Invalid parameters")) {
            return next(new ErrorHandler(error.message, 400));
        }

        next(new ErrorHandler("Internal server error", 500));
    }
});



// fetch all state
const getStatesOfRFQ = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        let stateData;
        if (id) {
            stateData = await State.findByPk(id);

            if (!stateData) return next(new ErrorHandler("No state found for the given id.", 404));
        } else {
            stateData = await State.findAll();

            if (!stateData) return next(new ErrorHandler("No data found", 404));;
        }

        res.status(200).json({
            success: true,
            message: "State data fetched successfully.",
            data: stateData
        });
    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
})


// Assign RFQ to a user
const assignRFQtoUser = catchAsyncError(async (req, res, next) => {
    try {
        const {
            p_rfq_id,
            p_assigned_to_id,
            p_assigned_to_roleid,
            p_assigned_by_id,
            p_assigned_by_roleid,
            p_status,
            p_comments
        } = req.body;

        // Validate required fields
        if (!p_rfq_id || !p_assigned_to_id || !p_assigned_to_roleid || !p_assigned_by_id || !p_assigned_by_roleid || !p_comments || p_status === undefined) {
            return next(new ErrorHandler("Please fill all required fields", 400));
        }

        // Call the PostgreSQL procedure
        const result = await sequelize.query(
            'CALL public.rfq_assign(:p_rfq_id, :p_assigned_to_id, :p_assigned_to_roleid, :p_assigned_by_id, :p_assigned_by_roleid, :p_status, :p_comments)',
            {
                replacements: {
                    p_rfq_id,
                    p_assigned_to_id,
                    p_assigned_to_roleid,
                    p_assigned_by_id,
                    p_assigned_by_roleid,
                    p_status,
                    p_comments
                },
                type: sequelize.QueryTypes.RAW
            }
        );

        // Success response
        res.status(200).json({
            success: true,
            message: 'RFQ assigned successfully',
            // data: result
        });

    } catch (error) {
        console.log("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});

// Assign RFQ to multiple users/roles
// const assignRFQtoUser = catchAsyncError(async (req, res, next) => {
//     try {
//         const {
//             p_rfq_id,
//             p_assigned_to_ids, // Now an array of user IDs
//             p_assigned_to_roles, // Now an array of role IDs
//             p_assigned_by_id,
//             p_assigned_by_roleid,
//             p_status,
//             p_comments
//         } = req.body;

//         // Validate required fields
//         if (!p_rfq_id || !p_assigned_to_ids || !p_assigned_to_roles || 
//             !p_assigned_by_id || !p_assigned_by_roleid || !p_comments || 
//             p_status === undefined) {
//             return next(new ErrorHandler("Please fill all required fields", 400));
//         }

//         // Ensure arrays are of same length
//         if (p_assigned_to_ids.length !== p_assigned_to_roles.length) {
//             return next(new ErrorHandler("Assigned user IDs and roles arrays must be of same length", 400));
//         }

//         // Call the PostgreSQL procedure for each assignment
//         const assignments = [];
//         for (let i = 0; i < p_assigned_to_ids.length; i++) {
//             const result = await sequelize.query(
//                 'CALL public.rfq_assign(:p_rfq_id, :p_assigned_to_id, :p_assigned_to_roleid, :p_assigned_by_id, :p_assigned_by_roleid, :p_status, :p_comments)',
//                 {
//                     replacements: {
//                         p_rfq_id,
//                         p_assigned_to_id: p_assigned_to_ids[i],
//                         p_assigned_to_roleid: p_assigned_to_roles[i],
//                         p_assigned_by_id,
//                         p_assigned_by_roleid,
//                         p_status,
//                         p_comments
//                     },
//                     type: sequelize.QueryTypes.RAW
//                 }
//             );
//             assignments.push({
//                 userId: p_assigned_to_ids[i],
//                 roleId: p_assigned_to_roles[i],
//                 result: result
//             });
//         }

//         // Success response
//         res.status(200).json({
//             success: true,
//             message: 'RFQ assigned successfully to all recipients',
//             assignments: assignments
//         });

//     } catch (error) {
//         console.log("Error details: ", error);
//         next(new ErrorHandler("Internal server error", 500));
//     }
// });


const rejectRFQwithState = catchAsyncError(async (req, res, next) => {
    const { p_rfq_id, p_user_id, p_comments, p_state_id } = req.body;

    if (!p_rfq_id || !p_user_id || !p_comments || !p_state_id) return next(new ErrorHandler("Please fill all the required fields", 400));

    const response = await sequelize.query(
        'CALL public.reject_rfq_with_state(:p_rfq_id, :p_user_id, :p_comments, :p_state_id)',
        {
            replacements: {
                p_rfq_id,
                p_user_id,
                p_comments,
                p_state_id
            },
            type: sequelize.QueryTypes.RAW
        }
    );

    res.status(200).json({
        success: true,
        message: "RFQ rejected by plant head"
    })
});



const autoCalculateCostsByRfqId = catchAsyncError(async (req, res, next) => {
    const { p_rfq_id } = req.body;

    if (!p_rfq_id) return next(new ErrorHandler("RFQ id is required.", 400));

    const response = await sequelize.query(
        'SELECT * FROM calculate_all_product_costs_for_rfq(:p_rfq_id);',
        {
            replacements: {
                p_rfq_id: p_rfq_id
            },
            type: sequelize.QueryTypes.RAW
        }
    );

    res.status(200).json({
        success: true,
        message: "Auto calculation executed successfully."
    })
});


const autoLatestCalculateCostsByRfqId = catchAsyncError(async (req, res, next) => {
    const { p_rfq_id } = req.body;

    if (!p_rfq_id) return next(new ErrorHandler("RFQ id is required.", 400));

    const response = await sequelize.query(
        'SELECT * FROM calculate_all_product_costs_for_rfq_latest(:p_rfq_id);',
        {
            replacements: {
                p_rfq_id: p_rfq_id
            },
            type: sequelize.QueryTypes.RAW
        }
    );

    res.status(200).json({
        success: true,
        message: "Auto calculation for revised RFQ executed successfully."
    })
});


const updateRfqState = catchAsyncError(async (req, res, next) => {
    const { rfq_id, rfq_state } = req.body;
    if (!rfq_id) return next(new ErrorHandler("Please provide RFQ id", 400));
    if (!rfq_state) return next(new ErrorHandler("Please provide RFQ state", 400));

    const response = await sequelize.query(
        `SELECT * FROM update_rfq_state(:p_rfq_id, :p_rfq_state_id)`,
        {
            replacements: {
                p_rfq_id: rfq_id,
                p_rfq_state_id: rfq_state
            },
            type: sequelize.QueryTypes.SELECT
        }
    );


    if (!response[0]) return next(new ErrorHandler("No response from database operation", 500));
    if (!response[0].success) return next(new ErrorHandler(response.message, 400));

    res.status(200).json({
        success: true,
        message: response[0].message,
    });
});

const insertFactoryOverheadCost = catchAsyncError(async (req, res, next) => {
    const { rfq_id, factory_overhead_perc } = req.body;

    if (!rfq_id) return next(new ErrorHandler("Rfq id is required.", 400));

    if (!factory_overhead_perc) return next(new ErrorHandler("Factory overhead percent is required.", 400));

    const response = await sequelize.query(
        `SELECT * FROM update_sku_factory_overhead_cost(:p_rfq_id, :p_factory_overhead_perc);`,
        {
            replacements: {
                p_rfq_id: rfq_id,
                p_factory_overhead_perc: factory_overhead_perc
            },
            type: sequelize.QueryTypes.SELECT
        }
    );

    if (!response[0]) return next(new ErrorHandler("No response from database operation", 500));
    if (!response[0].success) return next(new ErrorHandler(response.message, 400));

    res.status(200).json({
        success: true,
        message: response[0].message,
    });
});



const insertLatestFactoryOverheadCost = catchAsyncError(async (req, res, next) => {
    const { rfq_id, factory_overhead_perc } = req.body;

    if (!rfq_id) return next(new ErrorHandler("Rfq id is required.", 400));

    if (!factory_overhead_perc) return next(new ErrorHandler("Factory overhead percent is required.", 400));

    const response = await sequelize.query(
        `SELECT * FROM update_sku_factory_overhead_cost_latest(:p_rfq_id, :p_factory_overhead_perc);`,
        {
            replacements: {
                p_rfq_id: rfq_id,
                p_factory_overhead_perc: factory_overhead_perc
            },
            type: sequelize.QueryTypes.SELECT
        }
    );

    if (!response[0]) return next(new ErrorHandler("No response from database operation", 500));
    if (!response[0].success) return next(new ErrorHandler(response.message, 400));

    res.status(200).json({
        success: true,
        message: response[0].message,
    });
});

const insertTotalFactoryCost = catchAsyncError(async (req, res, next) => {
    const { rfqid } = req.params;

    if (!rfqid) return next(new ErrorHandler("Rfq id is required.", 400));

    const response = await sequelize.query(
        `SELECT * FROM calculate_total_factory_cost_by_rfqid(:p_rfq_id);`,
        {
            replacements: {
                p_rfq_id: rfqid,
            },
            type: sequelize.QueryTypes.SELECT
        }
    );

    if (!response[0]) return next(new ErrorHandler("No response from database operation", 500));
    if (!response[0].success) return next(new ErrorHandler(response.message, 400));

    res.status(200).json({
        success: true,
        message: response[0].message,
    });
});



const insertLatestTotalFactoryCost = catchAsyncError(async (req, res, next) => {
    const { rfqid } = req.params;

    if (!rfqid) return next(new ErrorHandler("Rfq id is required.", 400));

    const response = await sequelize.query(
        `SELECT * FROM calculate_total_factory_cost_by_rfqid_latest(:p_rfq_id);`,
        {
            replacements: {
                p_rfq_id: rfqid,
            },
            type: sequelize.QueryTypes.SELECT
        }
    );

    if (!response[0]) return next(new ErrorHandler("No response from database operation", 500));
    if (!response[0].success) return next(new ErrorHandler(response.message, 400));

    res.status(200).json({
        success: true,
        message: response[0].message,
    });
});


// Assign RFQ to a user
const insertCommentsForRFQ = catchAsyncError(async (req, res, next) => {
    try {
        const {
            user_id,
            rfq_id,
            state_id,
            comments
        } = req.body;

        // Validate required fields
        if (!rfq_id || !user_id || !state_id || !comments) {
            return next(new ErrorHandler("Please fill all required fields", 400));
        }

        // Call the PostgreSQL procedure
        const result = await sequelize.query(
            'CALL public.insert_comments(:p_user_id, :p_rfq_id, :p_state_id, :p_comments)',
            {
                replacements: {
                    p_user_id: user_id,
                    p_rfq_id: rfq_id,
                    p_state_id: state_id,
                    p_comments: comments
                },
                type: sequelize.QueryTypes.RAW
            }
        );

        // Success response
        res.status(200).json({
            success: true,
            message: 'Comments inserted successfully',
            // data: result
        });

    } catch (error) {
        console.log("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});


const insertRFQVersions = catchAsyncError(async (req, res, next) => {

    const { p_rfq_id } = req.body;

    // console.log("RFQ ID ------: ", p_rfq_id);

    if (!p_rfq_id) return next(new ErrorHandler("RFQ id is required", 400));

    const [response] = await sequelize.query(`CALL insert_rfq_versions(:p_rfq_id, null, null)`,
        {
            replacements: {
                p_rfq_id: p_rfq_id,
            },
            type: sequelize.QueryTypes.RAW
        }
    );

    const { success, message } = response[0];
    // console.log("response -----", response);

    if (!success) {
        return next(new ErrorHandler(message || "Failed to insert RFQ versions", 400));
    }

    res.status(200).json({
        success: true,
        message: message || "RFQ version inserted successfully",
    });
})


const getParentRevisionRFQ = catchAsyncError(async (req, res, next) => {
    const { p_rfq_version_id } = req.query;

    if (!p_rfq_version_id) return next(new ErrorHandler("RFQ revision id is required."));

    const query = `SELECT rfq_id FROM rfq_revision_table WHERE id = ${p_rfq_version_id}`;

    const [response] = await sequelize.query(query);

    // console.log("getParentRevisionRFQ response --------------> ", response);
    if(!response[0].rfq_id) return next(new ErrorHandler("Failed to fetch RFQ Parent id."));

    res.status(200).json({
        success: true,
        message: "RFQ parent id fetched successfuly",
        data: response[0]
    });
});


export {
    saveRFQandSKUdata,
    getRFQDetail,
    getRFQforPlantHead,
    uploadRFQDocuments,
    getRFQDocuments,
    downloadRFQDocument,
    deleteRFQDocument,
    deleteRFQDocumentPermanently,
    approveOrRejectRFQ,
    getStatesOfRFQ,
    assignRFQtoUser,
    rejectRFQwithState,
    getRFQDetailByUserRole,
    autoCalculateCostsByRfqId,
    autoLatestCalculateCostsByRfqId,
    updateRfqState,
    insertFactoryOverheadCost,
    insertLatestFactoryOverheadCost,
    insertTotalFactoryCost,
    insertLatestTotalFactoryCost,
    insertCommentsForRFQ,
    updateRFQStatus,
    insertRFQVersions,
    getParentRevisionRFQ
};
