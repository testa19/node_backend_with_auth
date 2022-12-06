import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import { env } from "./env/server.mjs";
import { router as authRouter } from "@api/auth/auth.routes.js";
import AppError from "./utils/appError.js";

const app = express();
// MIDDLEWARE

// 1.Body Parser
app.use(express.json({ limit: '10kb' }));

// 2. Cors
app.use(
  cors({
    origin: 'http://localhost:8000',
    credentials: true,
  })
);

// 3. Logger
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ROUTES
app.use('/api/auth', authRouter);

// UNHANDLED ROUTES
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(404, `Route ${req.originalUrl} not found`));
});

// GLOBAL ERROR HANDLER
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

const port = env.PORT;
app.listen(port, () => {
  console.log(`🚀 Server started on port: ${port}`);
});
