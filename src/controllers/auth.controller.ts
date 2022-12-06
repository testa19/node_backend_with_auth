import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import { generateTokens } from "~/utils/jwt";
import { addRefreshTokenToWhitelist } from "~/api/auth/auth.services";
import {
  findUserByEmail,
  createUserByEmailAndPassword,
} from "~/models/user.model";
import { type CreateUserInput } from "~/schemas/user.schema";

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

    const user = await createUserByEmailAndPassword({ name: req.body.name, email, password });
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
}