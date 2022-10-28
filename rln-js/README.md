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

To test the example, simply download the `index.html` file from this folder and open it in a browser.

The `master` branch's HEAD is deployed at https://examples.waku.org/rln-js/.
