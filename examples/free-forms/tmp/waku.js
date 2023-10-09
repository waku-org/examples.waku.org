import {
  createDecoder,
  createEncoder,
  createLightNode,
  waitForRemotePeer,
} from "@waku/sdk";
import { enrTree, wakuDnsDiscovery } from "@waku/dns-discovery";
import * as utils from "@waku/utils/bytes";

const VERSION = `0.0.00001`;

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
            lightPush: 1,
            store: 1,
            filter: 1,
          }),
        ],
      },
    });

    await waitForRemotePeer(node);

    return new Waku(node);
  }

  fetchForm(id) {
    return Form.fetch(this.node, id);
  }

  createForm({ id, scheme }) {
    return Form.create(this.node, { id, scheme });
  }
}

class Form {
  constructor(id, waku) {
    this.waku = waku;
    this.history = [];
    this.contentTopic = `/free-form/${VERSION}/definition:${id}/proto`;
    this.decoder = createDecoder(this.contentTopic);
    this.encoder = createEncoder({ contentTopic: this.contentTopic });
  }

  // Initiates new form
  static async create(waku, { id, scheme }) {
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
