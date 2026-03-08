import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { businessRoutes } from '#modules/businesses/index.js';
import { authRoutes } from '#modules/users/index.js';
import { authMiddleware } from '#shared/middleware/authMiddleware.js';
import { driverRoutes } from '#modules/drivers/index.js';
import { adminBusinessCustomerRoutes } from '#modules/businessCustomers/index.js';
import { notificationRoutes } from '#modules/notifications/index.js';
import { authorizeRole } from '#shared/middleware/authorizeRole.js';
import { adminDeliveryRequestRoutes } from '#modules/deliveryRequests/index.js';

const app = express();

//#region Normal Middleware

app.use(express.json());

app.use(cors(corsOptions));
app.use(cookieParser());

//#endregion

//#region Route Middlewares

app.get('/api/health', (req, res) => {
  res.send('Delivery System is running');
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes

app.use('/api/drivers', authMiddleware, driverRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/businesses', authMiddleware, businessRoutes);

// Admin routes

app.use(
  '/api/admin/delivery-request',
  authMiddleware,
  authorizeRole('admin'),
  adminDeliveryRequestRoutes
);

app.use(
  '/api/admin/business-customers',
  authMiddleware,
  authorizeRole('admin'),
  adminBusinessCustomerRoutes
);
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
