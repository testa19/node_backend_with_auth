import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { env } from "~/env/server.mjs";

// Usually I keep the token between 5 minutes - 15 minutes
export const generateAccessToken = (user: User) => {
  return jwt.sign({ userId: user.id }, env.JWT_ACCESS_SECRET, {
    expiresIn: "5m",
  });
}

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
}

export const generateTokens = (user: User, jti: string) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user, jti);

  return {
    accessToken,
    refreshToken,
  };
}
