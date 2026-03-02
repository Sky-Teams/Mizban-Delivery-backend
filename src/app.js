import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { authMiddleware } from '#shared/middleware/authMiddleware.js';
import { driverRoutes } from '#modules/drivers/index.js';
import { notificationRoutes } from '#modules/notifications/index.js';

const app = express();

//#region Normal Midlleware

app.use(express.json());

app.use(cors(corsOptions));

//#endregion

//#region Route Middlewares

app.get('/api/health', (req, res) => {
  res.send('Delivery System is running');
});

// Public routes

// Protected routes

// API Versioning Example: app.use('/api/v1/deliveries', deliveryRoutesV1);

app.use('/api/v1/drivers', authMiddleware, driverRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

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
