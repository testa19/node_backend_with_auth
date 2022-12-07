import express from "express";
import { deserializeUser } from "~/middleware/deserializeUser";
import { requireUser } from "~/middleware/requireUser";
import {
  loginUserHandler,
  logoutUserHandler,
  refreshAccessTokenHandler,
  registerUserHandler,
} from "~/controllers/auth.controller";
import { validate } from "~/middleware/validate";
import { createUserSchema, loginUserSchema } from "~/schemas/user.schema";

const router = express.Router();

router.post("/register", validate(createUserSchema), registerUserHandler);

router.post("/login", validate(loginUserSchema), loginUserHandler);

router.get("/refresh", refreshAccessTokenHandler);

router.get("/logout", deserializeUser, requireUser, logoutUserHandler);

export { router };
