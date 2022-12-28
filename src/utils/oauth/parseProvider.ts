import GitHub from "./github";
import Google from "./google";
import { Provider } from "./providers";

const providers = [GitHub(), Google()];

export default function parseProviders(
  providerId: string
): Provider | undefined {
  const provider = providers.find((provider) => provider.id === providerId);
  return provider;
}
