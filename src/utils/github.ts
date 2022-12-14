import crypto from "crypto";
import { env } from "~/env/server.mjs";

export const githubScopes = [
  'read:user',
  'user:email',
].join(' ');

export const getGithubUrl = () => {
  const rootUrl = `https://github.com/login/oauth/authorize`;

  const options = {
    redirect_uri: `${env.ORIGIN}/api/auth/oauth/github` as string,
    client_id: env.GITHUB_ID as string,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: githubScopes,
    state: crypto.randomBytes(32).toString("hex"),
  };

  const qs = new URLSearchParams(options);

  return `${rootUrl}?${qs.toString()}`;
};