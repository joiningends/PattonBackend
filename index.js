import express from "express";
import "dotenv/config";
import { connectdb } from "./config/connectDB.js";
import userRoute from "./route/userRoute.js";
import errorMiddleware from "./middleware/errorMiddleware.js";



const app = express();

const port = process.env.PORT || 3000;


// Middleware
app.use(express.json()); // Parse JSON bodies


// Routes
app.use("/api/users", userRoute);

// Error middleware
app.use(errorMiddleware);


app.listen(port, () => {
    console.log(`✅ Server application is running at port: ${port}`);
});

connectdb();
