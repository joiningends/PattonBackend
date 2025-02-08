// For handling the async error in the request pipeline

export const catchAsyncError = (func) => (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch(next);
}