import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import recordRoutes from './routes/record.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

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

export default app;
