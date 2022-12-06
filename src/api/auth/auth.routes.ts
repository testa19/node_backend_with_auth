import express from "express";
import { registerUserHandler } from "~/controllers/auth.controller";
import { validate } from "~/middleware/validate";
import { createUserSchema } from "~/schemas/user.schema";
// const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/register', validate(createUserSchema), registerUserHandler);

export { router };