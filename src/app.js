import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import authRoutesV1 from './modules/users/routes/v1/auth.route.js';
import cookieParser from 'cookie-parser';

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
app.use('/api/v1/auth', authRoutesV1);

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
