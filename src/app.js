import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { authRoutes } from './modules/users/index.js';

const app = express();

//#region Normal Midlleware

app.use(express.json());

app.use(cors(corsOptions));
app.use(cookieParser());

//#endregion

//#region Route Middlewares

app.get('/api/health', (req, res) => {
  res.send('Delivery System is running');
});

// Public routes
app.use('/api/v1/auth', authRoutes);

// Protected routes

// API Versioning Example: app.use('/api/v1/deliveries', deliveryRoutesV1);

//#endregion

//#region Not found (404) middleware

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//#endregion

//#region Error Handler middleware

app.use(errorHandler);

//#endregion

export default app;
