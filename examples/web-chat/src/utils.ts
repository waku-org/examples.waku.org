import type { Peer } from "@libp2p/interface-peer-store";

export async function handleCatch(
  promise?: Promise<Peer[]>
): Promise<Peer[] | undefined> {
  if (!promise) {
    return Promise.resolve(undefined);
  }

  try {
    return await promise;
  } catch (_) {
    return undefined;
  }
}
