import { CookieOptions, NextFunction, Request, Response } from "express";
import crypto from "crypto";
import * as argon2 from "argon2";

import { prisma } from "~/utils/db";
import { signJwt, verifyJwt } from "~/utils/jwt";
import { createUser } from "~/models/user.model";
import {
  ForgotPasswordInput,
  LoginUserInput,
  ResetPasswordInput,
  VerifyEmailInput,
  type CreateUserInput,
} from "~/schemas/user.schema";
import { env } from "~/env/server.mjs";
import { signTokens } from "~/services/user.service";
import AppError from "~/utils/appError";
import redisClient from "~/utils/connectRedis";
import {
  sendPasswordResetTokenJob,
  sendVerificationCodeJob,
} from "~/utils/queue";
import { User } from "@prisma/client";
import { getProviderAuthToken } from "~/utils/oauth/providers";
import parseProviders from "~/utils/oauth/parseProviders";

const cookiesOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
};

if (env.NODE_ENV === "production") cookiesOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(Date.now() + +env.ACCESS_TOKEN_EXPIRES_IN! * 60 * 1000),
  maxAge: +env.ACCESS_TOKEN_EXPIRES_IN! * 60 * 1000,
};

const refreshTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(Date.now() + +env.REFRESH_TOKEN_EXPIRES_IN! * 60 * 1000),
  maxAge: +env.REFRESH_TOKEN_EXPIRES_IN! * 60 * 1000,
};

export const registerUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      res.status(400);
      throw new Error("Email already in use.");
    }

    // Emai verification is not implemented yet
    const verifyCode = crypto.randomBytes(32).toString("hex");
    const verificationCode = crypto
      .createHash("sha256")
      .update(verifyCode)
      .digest("hex");

    const user = await createUser({
      data: {
        name: req.body.name,
        email,
        password,
        verificationCode,
      },
      select: { id: true, email: true, name: true },
    });

    const redirectUrl = `${env.ORIGIN}/api/auth/verifyemail/${verifyCode}`;

    try {
      sendVerificationCodeJob(user, redirectUrl);

      res.status(201).json({
        status: "success",
        message:
          "An email with a verification code has been sent to your email",
      });
    } catch (error) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode: null },
      });
      return res.status(500).json({
        status: "error",
        message: "There was an error sending email, please try again",
      });
    }
  } catch (err) {
    next(err);
  }
};

export const loginUserHandler = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, password: true, verified_at: true },
    });

    if (!user) {
      return next(new AppError(400, "Invalid email or password"));
    }

    // Check if user is verified
    if (user.password && !user.verified_at) {
      return next(
        new AppError(
          401,
          "You are not verified, please verify your email to login"
        )
      );
    }

    if (!user) {
      return next(new AppError(400, "Invalid email or password"));
    }

    if (!user.password) {
      return res.status(403).json({
        status: "fail",
        message:
          "We found your account. It looks like you registered with a social auth account. Try signing in with social auth.",
      });
    }

    if (!(await argon2.verify(user.password, password))) {
      return next(new AppError(400, "Invalid email or password"));
    }

    // Sign Tokens
    const { access_token, refresh_token } = await signTokens(user);
    res.cookie("access_token", access_token, accessTokenCookieOptions);
    res.cookie("refresh_token", refresh_token, refreshTokenCookieOptions);
    res.cookie("logged_in", true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    res.status(200).json({
      status: "success",
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};

export const refreshAccessTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    const message = "Could not refresh access token";

    if (!refresh_token) {
      return next(new AppError(403, message));
    }

    // Validate refresh token
    const decoded = verifyJwt<{ sub: string }>(
      refresh_token,
      "REFRESH_TOKEN_PUBLIC_KEY"
    );

    if (!decoded) {
      return next(new AppError(403, message));
    }

    // Check if user has a valid session
    const session = await redisClient.get(decoded.sub);

    if (!session) {
      return next(new AppError(403, message));
    }

    // Check if user still exist
    const user = await prisma.user.findUnique({
      where: { id: JSON.parse(session).id },
      select: { id: true, email: true },
    });

    if (!user) {
      return next(new AppError(403, message));
    }

    // Sign new access token
    const access_token = signJwt({ sub: user.id }, "ACCESS_TOKEN_PRIVATE_KEY", {
      expiresIn: `${env.ACCESS_TOKEN_EXPIRES_IN}m`,
    });

    // 4. Add Cookies
    res.cookie("access_token", access_token, accessTokenCookieOptions);
    res.cookie("logged_in", true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 5. Send response
    res.status(200).json({
      status: "success",
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};

function logout(res: Response) {
  res.cookie("access_token", "", { maxAge: 1 });
  res.cookie("refresh_token", "", { maxAge: 1 });
  res.cookie("logged_in", "", { maxAge: 1 });
}

export const logoutUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await redisClient.del(res.locals.user.id);
    logout(res);

    res.status(200).json({
      status: "success",
    });
  } catch (err: any) {
    next(err);
  }
};

export const verifyEmailHandler = async (
  req: Request<VerifyEmailInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const verificationCode = crypto
      .createHash("sha256")
      .update(req.params.verificationCode)
      .digest("hex");

    const user = await prisma.user.update({
      where: { verificationCode },
      data: { verified_at: new Date(), verificationCode: null },
      select: { email: true },
    });

    if (!user) {
      return next(new AppError(401, "Could not verify email"));
    }

    res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(403).json({
        status: "fail",
        message: `Verification code is invalid or user doesn't exist`,
      });
    }
    next(err);
  }
};

export const forgotPasswordHandler = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    ForgotPasswordInput
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the user from the collection
    const chkUser = await prisma.user.findFirst({
      where: { email: req.body.email.toLowerCase() },
    });
    const message =
      "You will receive a reset email if user with that email exist";
    if (!chkUser) {
      return res.status(200).json({
        status: "success",
        message,
      });
    }

    if (!chkUser.verified_at) {
      return res.status(403).json({
        status: "fail",
        message: "Account not verified",
      });
    }

    if (!chkUser.password) {
      return res.status(403).json({
        status: "fail",
        message:
          "We found your account. It looks like you registered with a social auth account. Try signing in with social auth.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await prisma.user.update({
      where: { id: chkUser.id },
      data: {
        passwordResetToken,
        passwordResetAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      select: { id: true, name: true, email: true },
    });

    try {
      const url = `${env.ORIGIN}/api/auth/resetPassword/${resetToken}`;
      // await new Email(user, url).sendPasswordResetToken();
      sendPasswordResetTokenJob(user, url);

      res.status(200).json({
        status: "success",
        message,
      });
    } catch (err: any) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetAt: null },
      });
      return res.status(500).json({
        status: "error",
        message: "There was an error sending email",
      });
    }
  } catch (err: any) {
    next(err);
  }
};

export const resetPasswordHandler = async (
  req: Request<
    ResetPasswordInput["params"],
    Record<string, never>,
    ResetPasswordInput["body"]
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the user from the collection
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken,
        passwordResetAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(403).json({
        status: "fail",
        message: "Invalid token or token has expired",
      });
    }

    const hashedPassword = await argon2.hash(req.body.password);
    // Change password data
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetAt: null,
      },
      select: { email: true },
    });

    logout(res);
    res.status(200).json({
      status: "success",
      message: "Password data updated successfully",
    });
  } catch (err: any) {
    next(err);
  }
};

export const calbackOauthHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the code from the query
    const code = req.query.code as string;

    if (!code) {
      return next(new AppError(401, "Authorization code not provided!"));
    }

    const providerId = req.params.providerId;
    if (!providerId) {
      return next(new AppError(401, `Oauth provider not provided!`));
    }
    const provider = parseProviders(providerId);
    if (!provider) {
      return next(new AppError(401, `Unknown provider!`));
    }

    // Use the code to get the id and access tokens
    const { id_token, access_token } = await getProviderAuthToken({
      code,
      provider,
    });

    // Use the token to get the User
    const providerProfile = await provider.userinfo.request({
      tokens: { id_token, access_token },
      provider,
    });

    const profile = provider.profile(providerProfile);

    // Check if user is verified
    if (!profile.verified_email) {
      return next(new AppError(403, `${provider.name} account not verified`));
    }

    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          providerAccountId: profile.id,
          provider: provider.id,
        },
      },
      select: { User: true },
    });

    let user: User;
    let userByAccount = account?.User ?? null;

    if (userByAccount) {
      user = userByAccount;
    } else {
      const userByEmail = profile.email
        ? await prisma.user.findUnique({ where: { email: profile.email } })
        : null;

      if (userByEmail) {
        // If you trust the oauth provider to correctly verify email addresses
        user = userByEmail;
      } else {
        user = await createUser({
          data: {
            name: profile.name,
            email: profile.email,
            image: profile.image,
          },
        });
      }
      await prisma.account.create({
        data: {
          userId: user.id,
          token_type: "bearer",
          scope: provider.authorization.scope,
          access_token: access_token,
          provider: provider.id,
          type: "oauth",
          providerAccountId: profile.id,
        },
      });
    }

    // Create access and refresh token
    // Sign Tokens
    const { access_token: app_access_token, refresh_token } = await signTokens(
      user
    );
    res.cookie("access_token", app_access_token, accessTokenCookieOptions);
    res.cookie("refresh_token", refresh_token, refreshTokenCookieOptions);
    res.cookie("logged_in", true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    res.status(200).json({
      status: "success",
      app_access_token,
    });
  } catch (err: any) {
    console.log("Failed to authorize Google User", err);
    next(err);
  }
};
