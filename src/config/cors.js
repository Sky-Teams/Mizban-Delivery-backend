const origins = process.env.FRONTEND_URL;

export const corsOptions = {
  origin: origins,
  credentials: true,
};
