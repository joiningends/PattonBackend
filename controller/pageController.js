import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { Page } from "../model/pageModel.js";
import ErrorHandler from "../util/ErrorHandler.js";


// Create/save page data 
const savePageData = catchAsyncError(async (req, res, next) => {
    try {
        const { pagename, context } = req.body;

        if (!pagename) return next(new ErrorHandler("Page name is required", 400));

        const pageData = await Page.findOne({
            where: {
                pagename: pagename
            }
        });

        if (pageData) return next(new ErrorHandler("Page name already exists", 400));

        const newPageData = await Page.create({
            pagename: pagename,
            context: context,
            status: true
        });

        res.status(201).json({
            success: true,
            message: "Page created successfully",
            data: newPageData
        });

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});


// Get page data
const getPageData = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        let pageData;
        if (id) {
            pageData = await Page.findByPk(id);

            if (!pageData) return next(new ErrorHandler("No page found for the given id.", 404));
        } else {
            pageData = await Page.findAll();

            if (!pageData) return next(new ErrorHandler("No data found.", 404));
        }

        res.status(200).json({
            success: true,
            message: "Page data fetched successfully.",
            data: pageData
        });

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});


// Edit page data
const editPageData = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { pagename, context, status } = req.body;

        if (!id) return next(new ErrorHandler("Page id is required", 400));

        const pageData = await Page.findByPk(id);
        if (!pageData) return next(new ErrorHandler("Page not found", 404));

        // if(pagename) {
        //     const pagenameExists = await Page.find({
        //         where: {
        //             pagename: pagename
        //         }
        //     })

        //     if(pagenameExists) return next(new ErrorHandler("Page name already in use", 400));
        // }


        const page = await pageData.update({
            pagename: pagename || pageData.pagename,
            context: context || pageData.context,
            status: status || pageData.status,
            updatedAt: Date.now(),
        });

        res.status(200).json({
            success: true,
            message: "Page updated successfully",
            data: page
        });


    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});

// Disable page (soft delete)
const enableDisablePage = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;         
        const {status} = req.body;               // If status 1 then false, If 2 then true

        if (!id) return next(new ErrorHandler("Page id is required", 400));
        if(!status) return next(new ErrorHandler("Status code required", 400));

        const pageData = await Page.findByPk(id);
        if (!pageData) return next(new ErrorHandler("Page not found by the given id", 404));

        if(status === 1) {
            await pageData.update({
                status: false,
            });
        }else if(status === 2){
            await pageData.update({
                status: true,
            });
        };
        

        res.status(200).json({
            success: true,
            message: "Page status updated successfully",
            data: pageData,
        });

    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
});



// Delete user (Hard delete)
const deletePage = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) return next(new ErrorHandler("Page id is required", 400));

        const pageData = await Page.findByPk(id);
        if (!pageData) return next(new ErrorHandler("No data found", 404));

        await pageData.destroy();

        res.status(200).json({
            success: true,
            message: "Page deleted successfully"
        })
    } catch (error) {
        console.error("Error details: ", error);
        next(new ErrorHandler("Internal server error", 500));
    }
})

export { savePageData, getPageData, editPageData, enableDisablePage, deletePage };