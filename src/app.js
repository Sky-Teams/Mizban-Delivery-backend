import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { businessRoutes } from '#modules/businesses/index.js';
import { authRoutes, userRoutes } from '#modules/users/index.js';
import { authMiddleware } from '#shared/middleware/authMiddleware.js';
import { driverRoutes } from '#modules/drivers/index.js';
import { notificationRoutes } from '#modules/notifications/index.js';
import { authorizeRole } from '#shared/middleware/authorizeRole.js';
import { businessCustomerRoutes } from '#modules/businessCustomers/index.js';
import { routeNotFound } from '#shared/errors/error.js';
import { orderRoutes } from '#modules/orders/index.js';
import { loggerMiddleware } from '#shared/middleware/loggerMiddleware.js';
import { logRoutes } from '#modules/logs/index.js';

const app = express();

//#region Normal Middleware

app.use(express.json());

app.use(cors(corsOptions));
app.use(cookieParser());

//#endregion
//Logger Middleware
app.use(loggerMiddleware);

//#region Route Middlewares

app.get('/api/health', (req, res) => {
  res.send('Delivery System is running');
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use(authMiddleware);

app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/drivers', authorizeRole('admin'), driverRoutes);
app.use('/api/orders', authorizeRole('admin'), orderRoutes);
app.use('/api/businesses', authorizeRole('admin'), businessRoutes);
app.use('/api/business-customers', authorizeRole('admin'), businessCustomerRoutes);
app.use('/api/logs', authorizeRole('admin'), logRoutes);

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
