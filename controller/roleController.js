import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware";
import ErrorHandler from "../util/ErrorHandler";

const roleController = catchAsyncError(async (req, res) => {
    try {
        const { rolename } = req.body;
        

    } catch (error) {
        console.log("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
})