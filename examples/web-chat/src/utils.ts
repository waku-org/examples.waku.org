import type { Peer } from "@libp2p/interface-peer-store";
import { Multiaddr, multiaddr } from "@multiformats/multiaddr";

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

export async function saveMultiaddrsToLocalStorage(
  peerPromise?: Promise<Peer>
) {
  let addresses: Peer["addresses"] = [];

  try {
    addresses = (await peerPromise)?.addresses ?? [];
  } catch (error) {}

  for (const addr of addresses) {
    if (!addr.multiaddr.toString().includes("wss")) continue;

    localStorage.setItem(
      `peer-exchange-${addr.multiaddr.toString()}`,
      addr.multiaddr.toString()
    );
  }
}

export function getMultiaddrsFromLocalStorage(): Multiaddr[] {
  const multiaddrs: Multiaddr[] = [];
  for (const key in localStorage) {
    if (key.startsWith("peer-exchange-")) {
      const addr = localStorage.getItem(key);
      if (addr) {
        multiaddrs.push(multiaddr(addr));
      }
    }
  }
  return multiaddrs;
}
