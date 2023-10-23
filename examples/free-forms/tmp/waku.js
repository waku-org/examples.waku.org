/*
to crate form:
-> generate pubkey/private key (maybe derived from wallet)
-> create scheme
-> sign scheme and send
creating form {
  id(pubkey),
  scheme: { nonce, scheme },
  signature: "",
}

updating form {
  id(pubkey),
  nonce: 0,
  scheme: { nonce, scheme },
  signature: "",
}

fetching form:
-> get form by pubkey
-> is signature valid
-> encrypt answers
-> send update

answering form {
  id(pubkey),
  answers: encrypted({ nonce, answers }),
}

reading answers:
-> is possible to decrypt
-> 
*/
import {
  createDecoder,
  createEncoder,
  createLightNode,
  waitForRemotePeer,
} from "@waku/sdk";
import { enrTree, wakuDnsDiscovery } from "@waku/dns-discovery";
import * as utils from "@waku/utils/bytes";

const VERSION = `0.0.1-rc-1`;

export class Waku {
  constructor(node) {
    this.node = node;
  }

  static async create() {
    const node = await createLightNode({
      defaultBootstrap: true,
      libp2p: {
        peerDiscovery: [
          wakuDnsDiscovery([enrTree["PROD"]], {
            lightPush: 6,
            store: 6,
            filter: 6,
          }),
        ],
      },
    });

    await waitForRemotePeer(node);

    return new Waku(node);
  }
}

class Form {
  constructor({ pubKey, privateKey, waku }) {
    this.waku = waku;
    this.history = [];
    this.pubKey = pubKey;
    this.privateKey = privateKey;
    this.decoder = createDecoder(this.contentTopic);
    this.contentTopic = `/free-form/${VERSION}/definition/proto`;
    this.encoder = createEncoder({ contentTopic: this.contentTopic });
  }

  // Initiates new form
  static async create(waku, { scheme }) {
    const form = new Form(id, waku);
    await form.createNew({ scheme });
    return form;
  }

  // Fetches history of an existing form
  static async fetch(waku, id) {
    // TODO: throw on attempt to fetch non existing form
    const form = new Form(id, waku);
    await form.fetchState(id);
    return form;
  }

  async createNew({ scheme }) {
    // TODO: throw on attempt to create existing form
    const command = {
      type: "CREATE",
      nonce: 0,
      signature: "",
      scheme,
    };
    const payload = this.toPayload(command);
    await this.waku.lightPush.send(this.encoder, { payload });
    this.history.push(command);
    console.log("DEBUG", this.history);
  }

  async fetchState() {
    let historyPromises = [];

    for await (const promises of this.waku.store.queryGenerator([
      this.decoder,
    ])) {
      historyPromises = [...historyPromises, ...promises];
    }

    if (!historyPromises.length) {
      console.error("DEBUG", "No form info fetched from store");
    }

    const commandPackets = await Promise.all(historyPromises);
    const commands = commandPackets
      .map(({ payload }) => {
        try {
          // validate scheme of command record
          // check signature
          const command = this.toCommand(payload);
          return command;
        } catch (e) {
          console.error("DEBUG", "failed to parse update command.");
          return;
        }
      })
      .filter((c) => !!c);

    this.history = [...this.history, ...commands];
    console.log("DEBUG", this.history);
  }

  async patchState({ scheme }) {
    if (!this.history.length) {
      throw Error("no history");
    }

    const command = {
      type: "PATCH",
      nonce: this.history[this.history.length - 1].nonce + 1,
      signature: "",
      scheme,
    };
    const payload = this.toPayload(command);

    await this.waku.lightPush.send(this.encoder, { payload });
    this.history.push(command);
    console.log("DEBUG patch", this.history);
  }

  toPayload(command) {
    return utils.utf8ToBytes(JSON.stringify(command));
  }

  toCommand(payload) {
    return JSON.parse(utils.bytesToUtf8(payload));
  }
}
