import express from "express";
import { deserializeUser } from "~/middleware/deserializeUser";
import { requireUser } from "~/middleware/requireUser";
import {
  forgotPasswordHandler,
  githubOauthHandler,
  googleOauthHandler,
  loginUserHandler,
  logoutUserHandler,
  refreshAccessTokenHandler,
  registerUserHandler,
  resetPasswordHandler,
  verifyEmailHandler,
} from "~/controllers/auth.controller";
import { validate } from "~/middleware/validate";
import {
  createUserSchema,
  forgotPasswordSchema,
  loginUserSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "~/schemas/user.schema";

const router = express.Router();

router.post("/register", validate(createUserSchema), registerUserHandler);

router.post("/login", validate(loginUserSchema), loginUserHandler);

router.get("/refresh", refreshAccessTokenHandler);

router.get("/logout", deserializeUser, requireUser, logoutUserHandler);

router.get(
  "/verifyemail/:verificationCode",
  validate(verifyEmailSchema),
  verifyEmailHandler
);

router.post(
  "/forgotpassword",
  validate(forgotPasswordSchema),
  forgotPasswordHandler
);

router.patch(
  "/resetpassword/:resetToken",
  validate(resetPasswordSchema),
  resetPasswordHandler
);

router.get('/oauth/github', githubOauthHandler);
router.get('/oauth/google', googleOauthHandler);

export { router };
