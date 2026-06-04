const origins = [process.env.FRONTEND_URL, 'http://localhost:5173']; // Allow local and production frontend origins

export const corsOptions = {
  origin: origins,
  credentials: true,
};
