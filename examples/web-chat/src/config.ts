import { Protocols } from "@waku/interfaces";

export const CONTENT_TOPIC = "/toy-chat/2/huilong/proto";

const PUBLIC_KEY = "AOGECG2SPND25EEFMAJ5WF3KSGJNSGV356DSTL2YVLLZWIV6SAYBM";
const FQDN = "test.waku.nodes.status.im";
export const ENR_TREE = `enrtree://${PUBLIC_KEY}@${FQDN}`;

export const PROTOCOLS = [
  Protocols.Filter,
  Protocols.Store,
  Protocols.LightPush,
];
