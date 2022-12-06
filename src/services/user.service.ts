import { Prisma } from "@prisma/client";
import { omit } from "lodash";
import { env } from "~/env/server.mjs";
import { signJwt } from "~/utils/jwt";
import { excludedFields } from "~/models/user.model";
import redisClient from "~/utils/connectRedis";

export const signTokens = async (user: Prisma.UserCreateInput) => {
  // 1. Create Session
  redisClient.set(`${user.id}`, JSON.stringify(omit(user, excludedFields)), {
    EX: +env.REDIS_CACHE_EXPIRES_IN * 60,
  });

  // 2. Create Access and Refresh tokens
  const access_token = signJwt({ sub: user.id }, "ACCESS_TOKEN_PRIVATE_KEY", {
    expiresIn: `${env.ACCESS_TOKEN_EXPIRES_IN}m`,
  });

  const refresh_token = signJwt({ sub: user.id }, "REFRESH_TOKEN_PRIVATE_KEY", {
    expiresIn: `${env.REFRESH_TOKEN_EXPIRES_IN}m`,
  });

  return { access_token, refresh_token };
};