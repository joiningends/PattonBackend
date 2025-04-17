import express from "express";
import "dotenv/config";
import { connectdb } from "./config/connectDB.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import swaggerUI from "swagger-ui-express";
import swaggerData from "./swagger.json" assert { type: "json" };
import cors from "cors"; // Import cors
import cookieParser from 'cookie-parser';

// Route imports
import userRoute from "./route/userRoute.js";
import pageRoute from "./route/pageRoute.js";
import roleRoute from "./route/roleRoute.js";
import clientRoute from "./route/clientRoute.js";
import rfqRoute from "./route/rfqRoute.js";
import skuRoute from "./route/skuRoute.js";
import rawMaterialRoute from "./route/rawMaterialRoute.js";
import plantRoute from "./route/plantRoute.js";
import testRoute from "./route/testRoute.js";
import authRoute from "./route/authRoute.js";
import jobTypeRoute from "./route/jobTypeRoute.js";
import otherCostRoute from "./route/otherCostRoute.js";

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for frontend requests
app.use(
  cors({
    origin: "http://localhost:5173", // Allow only your frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies to be sent
  })
);

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies

// Routes
app.use("/api/users", userRoute);
app.use("/api/pages", pageRoute);
app.use("/api/role", roleRoute);
app.use("/api/client", clientRoute);
app.use("/api/rfq", rfqRoute);
app.use("/api/sku", skuRoute);
app.use("/api/rawmaterial", rawMaterialRoute);
app.use("/api/plant", plantRoute);
app.use("/api/auth", authRoute);
app.use("/api/job-type", jobTypeRoute);
app.use("/api/other-cost", otherCostRoute);

//testing 
app.use(testRoute);

// API docs
app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerData));

// Error middleware
app.use(errorMiddleware);

// Connect to DB
connectdb();

app.listen(port, () => {
  console.log(`✅ Server application is running at port: ${port}`);
});
