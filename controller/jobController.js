import { catchAsyncError } from "../middleware/catchAsyncErrorMiddleware.js";
import { JobTypes } from "../model/jobTypeModel.js";
import ErrorHandler from "../util/ErrorHandler.js";






const saveJobTypes = catchAsyncError(async (req, res, next) => {
    const { job_name } = req.body;

    if (!job_name) return next(new ErrorHandler("Job name is required.", 400));

    const jobData = await JobTypes.findOne({
        where: {
            job_name: job_name
        }
    });

    if (jobData) return next(new ErrorHandler("Job already exists.", 400));

    const newJobData = await JobTypes.create({
        job_name: job_name,
        status: true
    })

    res.status(200).json({
        success: true,
        message: "Job type created successfully.",
        data: newJobData
    });

});



const getJobType = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    let jobData;
    if (id) {
        jobData = await JobTypes.findByPk(id);
        if (!jobData) return next(new ErrorHandler("No job type found by the given id.", 404));
    } else {
        jobData = await JobTypes.findAll();
        if (!jobData) return next(new ErrorHandler("No data found.", 404));
    }

    res.status(200).json({
        success: true,
        message: "Job type data fetched successfully.",
        data: jobData
    });
})



const editJobType = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { job_name, status } = req.body;

    if (!id) return next(new ErrorHandler("Job type id is required.", 400));

    const jobData = await JobTypes.findByPk(id);
    if (!jobData) return next(new ErrorHandler("Job type not found.", 404));

    await JobTypes.update(
        {
            job_name: job_name || jobData.job_name,
            status: status || jobData.status,
            updated_at: new Date()
        },
        {
            where: { id },
        }
    );

    const updatedJobType = await JobTypes.findByPk(id);

    res.status(200).json({
        success: true,
        message: "Job type updated successfully.",
        data: updatedJobType
    });
});



const deleteJobType = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) return next(new ErrorHandler("Job type id is required.", 400));

    const jobData = await JobTypes.findByPk(id);
    if (!jobData) return next(new ErrorHandler("Job type not found by the given id.", 404));

    await jobData.destroy();

    res.status(200).json({
        success: true,
        message: "Job type deleted successfully"
    });
});



export { saveJobTypes, getJobType, editJobType, deleteJobType };