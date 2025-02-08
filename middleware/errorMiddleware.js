const errorMiddleware = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);  // If headers are already sent, pass the error to the default Express handler
    }

    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};

export default errorMiddleware;
