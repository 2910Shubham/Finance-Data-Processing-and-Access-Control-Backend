import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js"
import recordRoutes from "./src/routes/record.routes.js"
import dashboardRoutes from "./src/routes/dashboard.routes.js"

const app = express();

connectDB();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

//Routes
app.use("/api/auth", authRoutes);
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/records',   recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

//handle 404
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});
//global error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res
    .status(status)
    .json({ success: false, message: err.message || "Internal server error" });
});


app.listen(process.env.PORT || 5000, () => {
  console.log(`server is running on port ${process.env.PORT || 5000}`);
});
