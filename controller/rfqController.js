import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import ErrorHandler from "../util/ErrorHandler.js";
import { sequelize } from "../config/connectDB.js";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from 'util';

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
        const { p_user_id, p_rfq_id, p_client_id } = req.body; // Get parameters from query string

        // Query the function using raw SQL
        const query = `SELECT * FROM get_rfq(:p_user_id, :p_rfq_id, :p_client_id);`;

        const rfqData = await sequelize.query(query, {
            replacements: {
                p_user_id: p_user_id || null,
                p_rfq_id: p_rfq_id || null,
                p_client_id: p_client_id || null
            },
            type: sequelize.QueryTypes.SELECT,
        });

        if (!rfqData || rfqData.length === 0) {
            return next(new ErrorHandler("No RFQ data found", 404));
        }

        res.status(200).json({
            success: true,
            data: rfqData, // Send the array of RFQ details
        });
    } catch (error) {
        console.error("Error fetching RFQ details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
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




export { saveRFQandSKUdata, getRFQDetail, uploadRFQDocuments, getRFQDocuments, downloadRFQDocument, deleteRFQDocument, deleteRFQDocumentPermanently };