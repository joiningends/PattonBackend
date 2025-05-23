import { sequelize } from "../config/connectDB.js";
import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { Currency } from "../model/currencyModel.js";
import ErrorHandler from "../util/ErrorHandler.js";

const saveCurrency = catchAsyncError(async (req, res, next) => {
    const { currency_name, currency_code, currency_value } = req.body;

    if (!currency_name || !currency_code || !currency_value) return next(new ErrorHandler("Please provide all the required fields.", 400));

    const currencyData = await Currency.findOne({
        where: {
            currency_name: currency_name
        }
    });

    if (currencyData) return next(new ErrorHandler("Currency already exists.", 400));

    const newCurrencyData = await Currency.create({
        currency_name: currency_name,
        currency_code: currency_code,
        currency_value: currency_value,
        status: true
    });

    res.status(200).json({
        success: true,
        message: "New currency save successfuly",
        data: newCurrencyData
    });
});

const getCurrency = catchAsyncError(async (req, res, next) => {
    const { id } = req.query;

    let currencyData;
    if (id) {
        currencyData = await Currency.findByPk(id);
        if (!currencyData) return next(new ErrorHandler("Currency data with given id not found.", 404));
    } else {
        currencyData = await Currency.findAll();
        if (!currencyData) return next(new ErrorHandler("No record found.", 404));
    }

    res.status(200).json({
        success: true,
        message: "Currency data fetched successfully",
        data: currencyData
    });
})

const editCurrency = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { currency_name, currency_code, currency_value, status } = req.body;

    if (!id) return next(new ErrorHandler("Id is required", 400));

    const currencyData = await Currency.findByPk(id);
    if (!currencyData) return next(new ErrorHandler("No record found by the given id.", 404));

    await Currency.update({
        currency_name: currency_name || currencyData.currency_name,
        currency_code: currency_code || currencyData.currency_code,
        currency_value: currency_value || currencyData.currency_value,
        status: status || currencyData.status,
        updatedAt: new Date()
    }, {
        where: { id },
    });

    const updatedCurrency = await Currency.findByPk(id);

    res.status(200).json({
        success: true,
        message: "Currency updated successfully",
        data: updatedCurrency
    });
});

const deleteCurrency = catchAsyncError(async(req, res, next) => {
    const {id} = req.params;

    if(!id) return next(new ErrorHandler("Id is required.", 400));

    const currencyData = await Currency.findByPk(id);
    if(!currencyData) return next(new ErrorHandler("No record found by the given currency id.", 404));

    await currencyData.destroy();

    res.status(200).json({
        success: true,
        message: "Currency data deleted successfully",
    });
});


export { saveCurrency, getCurrency, editCurrency, deleteCurrency };