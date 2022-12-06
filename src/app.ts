import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import morgan from "morgan";
import { env } from "./env/server.mjs";
import { router as authRouter } from "@api/auth/auth.routes.js";

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

const port = env.PORT;
app.listen(port, () => {
  console.log(`🚀 Server started on port: ${port}`);
});
