# Ethereum Private Message Web App

**Demonstrates**:

- Private Messaging
- React/TypeScript
- Waku Light Push
- Waku Filter
- Signature with Web3 (EIP-712, sign typed data)
- Asymmetric Encryption
- Symmetric Encryption

A PoC implementation of [20/ETH-DM](https://rfc.vac.dev/spec/20/).

Ethereum Private Message, or Eth-PM, is a protocol that allows sending encrypted message to a recipient,
only knowing their Ethereum Address.

This protocol has been created to demonstrated how encryption and signature could be added to message
sent over the Waku v2 network.

The `master` branch's HEAD is deployed at https://examples.waku.org/eth-pm/.

To run a development version locally, do:

```shell
git clone https://github.com/waku-org/js-waku-examples
cd js-waku-examples/examples/eth-pm
npm install
npm run start
```
