import { createDecoder, createEncoder } from "@waku/sdk";
import * as utils from "@waku/utils/bytes";
import protobuf from "protobufjs";
import { Waku } from "./waku";

run()
  .then(() => {
    console.log("App is running...");
  })
  .catch((e) => {
    console.error("Failed to run app: ", e);
  });

async function run() {
  const waku = await Waku.create();
  window.waku = waku;

  window.createForm = (id) => {
    return waku.createForm({ id, scheme: "" });
  };

  window.fetchForm = (id) => {
    return waku.fetchForm(id);
  };
}
