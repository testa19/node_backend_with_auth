import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "~/env/server.mjs";

export const signJwt = (payload: Object, options: SignOptions = {}) => {
  const privateKey = Buffer.from(
    env.ACCESS_TOKEN_PRIVATE_KEY,
    "base64"
  ).toString("ascii");
  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: "RS256",
  });
};

export const verifyJwt = <T>(token: string): T | null => {
  try {
    const publicKey = Buffer.from(
      env.ACCESS_TOKEN_PUBLIC_KEY,
      "base64"
    ).toString("ascii");
    return jwt.verify(token, publicKey) as T;
  } catch (error) {
    return null;
  }
};