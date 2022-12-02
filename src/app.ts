require('dotenv').config();
import express from 'express';
import config from 'config';
import { Prisma, PrismaClient } from '@prisma/client'

const app = express();
const prisma = new PrismaClient()

const port = config.get<number>('port');
app.listen(port, () => {
  console.log(`🚀 Server started on port: ${port}`);
});