import express from "express";
import "dotenv/config";
import { connectdb } from "./config/connectDB.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import swaggerUI from "swagger-ui-express";
import swaggerData from "./swagger.json" assert { type: "json" };
import cors from "cors"; // Import cors

// Route imports
import userRoute from "./route/userRoute.js";
import pageRoute from "./route/pageRoute.js";
import roleRoute from "./route/roleRoute.js";

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for frontend requests
app.use(
  cors({
    origin: "http://localhost:5173", // Allow only your frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json()); // Parse JSON bodies

// Routes
app.use("/api/users", userRoute);
app.use("/api/pages", pageRoute);
app.use("/api/role", roleRoute);

// API docs
app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerData));

// Error middleware
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`✅ Server application is running at port: ${port}`);
});

connectdb();