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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

//handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

//global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = err.keyValue ? err.keyValue[field] : undefined;
    return res.status(409).json({
      success: false,
      message: field
        ? `Duplicate value for "${field}": "${value}".`
        : 'Duplicate key error.',
      errors: field
        ? [{ field, message: `${field} already exists.`, value }]
        : undefined,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
      value: fieldError.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});


app.listen(process.env.PORT || 5000, () => {
  console.log(`server is running on port ${process.env.PORT || 5000}`);
});
