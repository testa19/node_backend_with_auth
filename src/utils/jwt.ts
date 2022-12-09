import jwt, { SignOptions } from "jsonwebtoken";
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
