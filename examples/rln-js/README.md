# Using [RLN](https://rfc.vac.dev/spec/32/) in JavaScript

> Rate limiting nullifier (RLN) is a construct based on zero-knowledge proofs
> that provides an anonymous rate-limited signaling/messaging framework
> suitable for decentralized (and centralized) environments

**Demonstrates**:

- RLN:
  - Generate credentials
  - Insert membership to smart contract (Goerli testnet)
  - Retrieve smart contract state
  - Generate and send proofs
  - Verify incoming proofs
- Pure Javascript/HTML.
- Use minified bundle of js from unpkg.com, no import, no package manager.

# Getting Started

```shell
git clone https://github.com/waku-org/js-waku-examples
cd js-waku-examples/examples/rln-js
npm install
npm run dev
# open  http://127.0.0.1:3000 In your browser
```

**There are a known issue using this webapp with Firefox + MetaMask. Try Chrome or Brave if you encounter any issue**.

The `master` branch's HEAD is deployed at https://examples.waku.org/rln-js/.