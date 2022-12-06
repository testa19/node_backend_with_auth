import crypto from "crypto";

export const hashToken = (token: string): string => {
  return crypto.createHash("sha512").update(token).digest("hex");
}
