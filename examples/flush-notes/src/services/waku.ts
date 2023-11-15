import { LightNode, createLightNode } from "@waku/sdk";

type WakuOptions = {
  node: LightNode;
};

export class Waku {
  private node: undefined | LightNode;

  private constructor(options: WakuOptions) {
    this.node = options.node;
  }

  public static async init(): Promise<Waku> {
    const node = await createLightNode({ defaultBootstrap: true });
    return new Waku({ node });
  }
}
