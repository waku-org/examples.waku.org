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

  // window.createForm = (id) => {
  //   return waku.createForm({ id, scheme: "" });
  // };

  // window.fetchForm = (id) => {
  //   return waku.fetchForm(id);
  // };

  // const password = "password";
  // const localHistory = decryptLocalStorage(password);
  // const fromController = new Forms(localHistory);

  // fromController.createForm(scheme);
  // const form = fromController.getForm(id);
  // form.update(newScheme); // throws if don't have pubkey/private key

  // const form = fromController.getForm(id);
  // form.answer(answers);

  // encryptToLocalStorage(password, fromController.toString());
  // encrypt and send to waku
}
