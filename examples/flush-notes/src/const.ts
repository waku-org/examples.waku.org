export const CONTENT_TOPIC = "/flush-notes/1/note/proto";

export enum WakuStatus {
  Initializing = "Initializing...",
  WaitingForPeers = "Waiting for peers...",
  Connected = "Connected",
  Failed = "Failed to initialize(see logs)",
}
