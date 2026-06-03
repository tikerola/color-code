import type { ChordProvider } from "./chord-provider";
import { UltimateGuitarProvider } from "./ultimate-guitar";

const providers: ChordProvider[] = [new UltimateGuitarProvider()];

export function getProvider(url: string): ChordProvider {
  const provider = providers.find((p) => p.canHandle(url));
  if (!provider) {
    throw Object.assign(new Error(`No provider for URL: ${url}`), { code: "UNSUPPORTED_URL" });
  }
  return provider;
}
