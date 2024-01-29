import { bytesToHex } from "@waku/utils/bytes";

export function randomNumber() {
  return Math.ceil(Math.random() * 1000);
}

export function renderBytes(bytes) {
  return bytes ? bytesToHex(bytes) : "none";
}
