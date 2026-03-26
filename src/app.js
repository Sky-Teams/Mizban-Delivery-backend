import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { adminBusinessRoutes, businessRoutes } from '#modules/businesses/index.js';
import { authRoutes } from '#modules/users/index.js';
import { authMiddleware } from '#shared/middleware/authMiddleware.js';
import { driverRoutes } from '#modules/drivers/index.js';
import { notificationRoutes } from '#modules/notifications/index.js';
import { authorizeRole } from '#shared/middleware/authorizeRole.js';
import { adminBusinessCustomerRoutes } from '#modules/businessCustomers/index.js';
import { routeNotFound } from '#shared/errors/error.js';
import { orderRoutes } from '#modules/orders/index.js';
import { loggerMiddleware } from '#shared/middleware/loggerMiddleware.js';

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

app.use(authMiddleware);
app.use(loggerMiddleware);

app.use('/api/notifications', notificationRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/drivers', authorizeRole('admin'), driverRoutes);

app.use('/api/orders', authorizeRole('admin'), orderRoutes);

app.use('/api/admin/business-customers', authorizeRole('admin'), adminBusinessCustomerRoutes);
app.use('/api/admin/businesses', authorizeRole('admin'), adminBusinessRoutes);
//#endregion

//#region Not found (404) middleware

app.use((req, res, next) => {
  next(routeNotFound());
});

//#endregion

//#region Error Handler middleware

app.use(errorHandler);

//#endregion

export default app;
