import axios from "axios";
import { env } from "~/env/server.mjs";
import { OAuthConfig } from "./providers";

export const googleScopes = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export interface GoogleProfile extends Record<string, any> {
  aud: string;
  azp: string;
  email: string;
  email_verified: boolean;
  exp: number;
  family_name: string;
  given_name: string;
  hd: string;
  iat: number;
  iss: string;
  jti: string;
  name: string;
  nbf: number;
  picture: string;
  sub: string;
}

export default function Google<P extends GoogleProfile>(): OAuthConfig<P> {
  return {
    id: "google",
    name: "Google",
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    authorization: {
      url: "https://accounts.google.com/o/oauth2/v2/auth",
      scope: googleScopes,
    },
    token: "https://oauth2.googleapis.com/token",
    userinfo: {
      url: "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      async request({ tokens, provider }) {
        const { data: profile } = await axios.get<P>(provider.userinfo.url, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        return profile;
      },
    },
    profile(profile) {
      return {
        id: profile.id ?? profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        verified_email: profile.verified_email,
      };
    },
  };
}
