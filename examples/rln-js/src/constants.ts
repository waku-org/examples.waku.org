import protobuf from "protobufjs";

export const ProtoChatMessage = new protobuf.Type("ChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("nick", 2, "string"))
  .add(new protobuf.Field("text", 3, "bytes"));

export const CONTENT_TOPIC = "/toy-chat/2/luzhou/proto";

export const SIGNATURE_MESSAGE =
  "The signature of this message will be used to generate your RLN credentials. Anyone accessing it may send messages on your behalf, please only share with the RLN dApp";
