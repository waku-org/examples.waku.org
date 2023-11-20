/// <reference types="react-scripts" />

type EthereumEvents = "accountsChanged" | "chainChanged";
type EthereumEventListener = (v: any) => void;

type Ethereum = {
  request: () => void;
  on: (name: EthereumEvents, fn: EthereumEventListener) => void;
  removeListener: (name: EthereumEvents, fn: EthereumEventListener) => void;
};

interface Window {
  ethereum: Ethereum;
}
