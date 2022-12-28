import type { OAuth2TokenEndpointResponse } from "oauth4webapi";
import crypto from "crypto";
import axios from "axios";
import qs from "qs";
import { env } from "~/env/server.mjs";

interface DefaultUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  verified_email?: boolean;
}

/** The OAuth profile returned from your provider */
export interface Profile {
  sub?: string;
  name?: string | null;
  email?: string | null;
  image?: string;
}

type UrlParams = Record<string, unknown>;

type TokenSet = Partial<OAuth2TokenEndpointResponse>;

type EndpointRequest<C, R, P> = (
  context: C & {
    /** Provider is passed for convenience, ans also contains the `callbackUrl`. */
    provider: OAuthConfig<P>;
  }
) => Promise<R>;

/** Gives granular control of the request to the given endpoint */
interface AdvancedEndpointHandler<P extends UrlParams, C, R> {
  /** Endpoint URL. Can contain parameters. Optionally, you can use `params` */
  url: string;
  /** These will be prepended to the `url` */
  params?: P;
  /**
   * Control the corresponding OAuth endpoint request completely.
   * Useful if your provider relies on some custom behaviour
   * or it diverges from the OAuth spec.
   *
   * - ⚠ **This is an advanced option.**
   * You should **try to avoid using advanced options** unless you are very comfortable using them.
   */
  request: EndpointRequest<C, R, P>;
}

/** Either an URL (containing all the parameters) or an object with more granular control. */
export type EndpointHandler<
  P extends UrlParams,
  C = any,
  R = any
> = AdvancedEndpointHandler<P, C, R>;

export type UserinfoEndpointHandler = EndpointHandler<
  UrlParams,
  { tokens: TokenSet },
  Profile
>;

export type AuthorizationEndpointHandler = { url: string; scopes: string };

export interface OAuthConfig<P> {
  id: string;
  name: string;
  /**
   * The login process will be initiated by sending the user to this URL.
   *
   * [Authorization endpoint](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1)
   */
  authorization: AuthorizationEndpointHandler;
  token: string;
  userinfo: AdvancedEndpointHandler<UrlParams, { tokens: TokenSet }, Profile>;
  profile: (profile: P) => DefaultUser;
  clientId: string;
  clientSecret: string;
}

export type Provider = OAuthConfig<any>;

export const getProviderUrl = (provider: Provider) => {
  const rootUrl = provider.authorization.url;

  const options = {
    redirect_uri:
      `${env.ORIGIN}/api/auth/oauth/callback${provider.id}` as string,
    client_id: provider.clientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: provider.authorization.scopes,
    state: crypto.randomBytes(32).toString("hex"),
  };

  const qs = new URLSearchParams(options);

  return `${rootUrl}?${qs.toString()}`;
};

export const getProviderAuthToken = async ({
  code,
  provider,
}: {
  code: string;
  provider: Provider;
}): Promise<TokenSet> => {
  const rootURl = provider.token;

  const options = {
    code,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    redirect_uri: env.ORIGIN + "/api/auth/oauth/callback/" + provider.id,
    grant_type: "authorization_code",
  };

  try {
    const { data } = await axios.post<TokenSet>(
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
    console.log(`Failed to fetch ${provider.name} Oauth Tokens`);
    throw new Error(err);
  }
};
