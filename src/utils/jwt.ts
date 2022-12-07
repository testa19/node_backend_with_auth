import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "@prisma/client";
import { env } from "~/env/server.mjs";

export const signJwt = (
  payload: Object,
  keyName: "ACCESS_TOKEN_PRIVATE_KEY" | "REFRESH_TOKEN_PRIVATE_KEY",
  options: SignOptions
) => {
  const privateKey = Buffer.from(env[keyName], "base64").toString("ascii");
  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: "RS256",
  });
};

export const verifyJwt = <T>(
  token: string,
  keyName: "ACCESS_TOKEN_PUBLIC_KEY" | "REFRESH_TOKEN_PUBLIC_KEY"
): T | null => {
  try {
    // console.log({token: token});
    // console.log({REFRESH_TOKEN_PRIVATE_KEY: env.REFRESH_TOKEN_PRIVATE_KEY});
    // console.log({REFRESH_TOKEN_PUBLIC_KEY: env.REFRESH_TOKEN_PUBLIC_KEY});
    // console.log({ACCESS_TOKEN_PRIVATE_KEY: env.ACCESS_TOKEN_PRIVATE_KEY});
    // console.log({ACCESS_TOKEN_PUBLIC_KEY: env.ACCESS_TOKEN_PUBLIC_KEY});
    
    const publicKey = Buffer.from(env[keyName], "base64").toString("ascii");
    const decoded = jwt.verify(token, publicKey) as T;

    return decoded;
  } catch (error) {
    return null;
  }
};

// Usually I keep the token between 5 minutes - 15 minutes
export const generateAccessToken = (user: User) => {
  return jwt.sign({ userId: user.id }, env.JWT_ACCESS_SECRET, {
    expiresIn: "5m",
  });
};

// I choosed 8h because i prefer to make the user login again each day.
// But keep him logged in if he is using the app.
// You can change this value depending on your app logic.
// I would go for a maximum of 7 days, and make him login again after 7 days of inactivity.
export const generateRefreshToken = (user: User, jti: string) => {
  return jwt.sign(
    {
      userId: user.id,
      jti,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: "8h",
    }
  );
};

export const generateTokens = (user: User, jti: string) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user, jti);

  return {
    accessToken,
    refreshToken,
  };
};
