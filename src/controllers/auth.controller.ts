import { CookieOptions, NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

import { generateTokens } from "~/utils/jwt";
import { addRefreshTokenToWhitelist } from "~/api/auth/auth.services";
import {
  findUserByEmail,
  createUserByEmailAndPassword,
  findUniqueUser,
} from "~/models/user.model";
import { LoginUserInput, type CreateUserInput } from "~/schemas/user.schema";
import { env } from "process";
import { signTokens } from "~/services/user.service";
import AppError from "~/utils/appError";

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
    if (!email || !password) {
      res.status(400);
      throw new Error("You must provide an email and a password.");
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      res.status(400);
      throw new Error("Email already in use.");
    }

    // Emai verification is not implemented yet
    // const verifyCode = crypto.randomBytes(32).toString('hex');
    // const verificationCode = crypto
    //   .createHash('sha256')
    //   .update(verifyCode)
    //   .digest('hex');

    const user = await createUserByEmailAndPassword({
      name: req.body.name,
      email,
      password,
      // verificationCode,
    });
    const jti = uuidv4();
    const { accessToken, refreshToken } = generateTokens(user, jti);
    await addRefreshTokenToWhitelist({ jti, refreshToken, userId: user.id });

    res.json({
      accessToken,
      refreshToken,
    });
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

    const user = await findUniqueUser(
      { email: email.toLowerCase() },
      { id: true, email: true, password: true }
    );

    if (!user) {
      return next(new AppError(400, 'Invalid email or password'));
    }

    // Emai verification is not implemented yet
    // Check if user is verified
    // if (!user.verified) {
    //   return next(
    //     new AppError(
    //       401,
    //       'You are not verified, please verify your email to login'
    //     )
    //   );
    // }

    if (!user || !(await bcrypt.compare(password, user.password!))) {
      return next(new AppError(400, 'Invalid email or password'));
    }

    // Sign Tokens
    const { access_token, refresh_token } = await signTokens(user);
    res.cookie('access_token', access_token, accessTokenCookieOptions);
    res.cookie('refresh_token', refresh_token, refreshTokenCookieOptions);
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};
