import axios from "axios";
import qs from "qs";
import { env } from "~/env/server.mjs";

interface GithubOauthToken {
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

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

export const getGithubOauthToken = async ({
  code,
}: {
  code: string;
}): Promise<GithubOauthToken> => {
  const rootURl = "https://github.com/login/oauth/access_token";

  const options = {
    code,
    client_id: env.GITHUB_ID,
    client_secret: env.GITHUB_SECRET,
    redirect_uri: env.ORIGIN + "/api/auth/oauth/github",
  };
  try {
    const { data } = await axios.post<GithubOauthToken>(
      rootURl,
      qs.stringify(options),
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    
    return data;
  } catch (err: any) {
    console.log("Failed to fetch Github Oauth Tokens");
    throw new Error(err);
  }
};

interface GithubUserResult {
  id: string;
  email: string;
  name: string;
  image: string;
}

export async function getGithubUser({
  access_token,
}: {
  access_token: string;
}): Promise<GithubUserResult> {
  try {
    const { data } = await axios.get<GithubProfile>(
      `https://api.github.com/user`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    if (!data.email) {
      // If the user does not have a public email, get another via the GitHub API
      // See https://docs.github.com/en/rest/users/emails#list-public-email-addresses-for-the-authenticated-user
      const {data: emails}: {data: GithubEmail[]} = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      if (emails) {
        data.email = (emails.find((e) => e.primary) ?? emails[0])!.email;
      }
    }
    
    return {
      id: data.id.toString(),
      name: data.name ?? data.login,
      email: data.email!,
      image: data.avatar_url,
    };
  } catch (err: any) {
    console.log(err);
    throw Error(err);
  }
}
