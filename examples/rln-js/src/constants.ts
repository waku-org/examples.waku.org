import protobuf from "protobufjs";

export type ProtoChatMessageType = {
  timestamp: number;
  nick: string;
  text: string;
};

export const ProtoChatMessage = new protobuf.Type("ChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("nick", 2, "string"))
  .add(new protobuf.Field("text", 3, "string"));

export const CONTENT_TOPIC = "/toy-chat/2/luzhou/proto";

export const SIGNATURE_MESSAGE =
  "The signature of this message will be used to generate your RLN credentials. Anyone accessing it may send messages on your behalf, please only share with the RLN dApp";

export enum StatusEventPayload {
  WASM_LOADING = "WASM Blob download in progress...",
  WASM_FAILED = "Failed to download WASM, check console",
  CONTRACT_LOADING = "Connecting to RLN contract",
  CONTRACT_FAILED = "Failed to connect to RLN contract",
  RLN_INITIALIZED = "RLN dependencies initialized",
  KEYSTORE_LOCAL = "Keystore initialized from localStore",
  KEYSTORE_NEW = "New Keystore was initialized",
  CREDENTIALS_REGISTERING = "Registering credentials...",
  CREDENTIALS_REGISTERED = "Registered credentials",
  CREDENTIALS_FAILURE = "Failed to register credentials, check console",
}
