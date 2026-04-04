import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import http from 'http';
import { CustomSocket } from './config/socket.js';
import { registerNotificationListeners } from '#modules/notifications/listeners/index.js';
import { defineOfferJobs } from './jobs/offer.job.js';
import { agenda } from '#config/agenda.js';

connectDB();

// For now we need to initialize the agenda with our API server in same the process.Different process cause big problem for us.

defineOfferJobs();
await agenda.start();

const server = http.createServer(app);

CustomSocket.initialize(server);

// Register listeners
registerNotificationListeners();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
