import ErrorHandler from "../util/ErrorHandler.js";
import { catchAsyncError } from "./catchAsyncErrorMiddleware.js";
import jwt from 'jsonwebtoken';



const authenticateUser = catchAsyncError(async(req, res, next) => {

    // Get the token from header or cookies
    const token = req.headers.authorization?.split(' ')[1];

    // console.log("token: ", token);

    if(!token) {
        return next(new ErrorHandler("Unauthorized user, please login.", 401));
    }

    try{
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded user information to the request object
        req.user = decoded;

        next();
    }catch(error){
        return next(new ErrorHandler('Invalid or expire token. Please log in again.', 401));
    }
})

export default authenticateUser;