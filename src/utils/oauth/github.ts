import axios from "axios";
import { env } from "~/env/server.mjs";
import { OAuthConfig } from "./providers";

/** @see https://docs.github.com/en/rest/users/users#get-the-authenticated-user */
export interface GithubProfile extends Record<string, any> {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username?: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  private_gists?: number;
  total_private_repos?: number;
  owned_private_repos?: number;
  disk_usage?: number;
  suspended_at?: string | null;
  collaborators?: number;
  two_factor_authentication: boolean;
  plan?: {
    collaborators: number;
    name: string;
    space: number;
    private_repos: number;
  };
}

export interface GithubEmail extends Record<string, any> {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: "public" | "private";
}

export const githubScopes = ["read:user", "user:email"].join(" ");

export default function GitHub<
  P extends GithubProfile & { verified_email: boolean }
>(): OAuthConfig<P> {
  return {
    id: "github",
    name: "GitHub",
    clientId: env.GITHUB_ID,
    clientSecret: env.GITHUB_SECRET,
    authorization: {
      url: "https://github.com/login/oauth/authorize",
      scopes: githubScopes,
    },
    token: "https://github.com/login/oauth/access_token",
    userinfo: {
      url: "https://api.github.com/user",
      async request({ tokens, provider }) {
        const { data: profile } = await axios.get<P>(provider.userinfo.url, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!profile.email) {
          // If the user does not have a public email, get another via the GitHub API
          // See https://docs.github.com/en/rest/users/emails#list-public-email-addresses-for-the-authenticated-user
          const { data: emails }: { data: GithubEmail[] } = await axios.get(
            "https://api.github.com/user/emails",
            {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            }
          );

          if (emails) {
            const email = (emails.find((e) => e.primary && e.verified) ??
              emails[0])!;
            profile.email = email.email;
            profile.verified_email = email.verified;
          }
        }

        return profile;
      },
    },
    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name ?? profile.login,
        email: profile.email,
        image: profile.avatar_url,
        verified_email: profile.verified_email,
      };
    },
  };
}
