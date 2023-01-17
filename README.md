# Js-Waku Examples

## Examples

Here is the list of the examples using [`js-waku`](https://www.npmjs.com/package/js-waku) and the features they demonstrate: 

See https://examples.waku.org/ for more examples.

### Web Chat App

- [code](web-chat)
- [website](https://examples.waku.org/web-chat)
- Demonstrates: Group chat, React/TypeScript, Relay, Store.

### Ethereum Private Messaging

End-to-end encrypted communication between two Ethereum addresses.

- [code](eth-pm)
- [website](https://examples.waku.org/eth-pm)
- Demonstrates: Private Messaging, React/TypeScript, Light Client, Signature with Web3, Asymmetric Encryption.

### Waku Light Client in JavaScript

Send messages between several users (or just one) using light client targetted protocols.

- [code](light-js)
- [website](https://examples.waku.org/light-js)
- Demonstrates: Waku Light node: Filter + Light Push, Pure Javascript/HTML using ESM/unpkg bundle.

### Minimal Angular (v13) Waku Relay

A barebone messaging app to illustrate the [Angular Relay guide](https://docs.wakuconnect.dev/docs/guides/10_angular_relay/).

- [code](relay-angular-chat)
- [website](https://examples.waku.org/relay-angular-chat)
- Demonstrates: Group messaging, Angular, Waku Relay, Protobuf using `protobufjs`, No async/await syntax.

### Waku Relay in JavaScript

This example uses Waku Relay to send and receive simple text messages.

- [code](relay-js)
- [website](https://examples.waku.org/relay-js)
- Demonstrates: Waku Relay, Pure Javascript/HTML using ESM/unpkg bundle.

### Waku Relay in ReactJS

A barebone chat app to illustrate the [ReactJS Relay guide](https://docs.wakuconnect.dev/docs/guides/07_reactjs_relay/).

- [code](relay-reactjs-chat)
- [website](https://examples.waku.org/relay-reactjs-chat)
- Demonstrates: Group chat, React/JavaScript, Waku Relay, Protobuf using `protobufjs`.

### Using [RLN](https://rfc.vac.dev/spec/32/) in JavaScript

> Rate limiting nullifier (RLN) is a construct based on zero-knowledge proofs
> that provides an anonymous rate-limited signaling/messaging framework
> suitable for decentralized (and centralized) environments

Use RLN in the browser, compatible with nwaku chat2 and go-waku chat2 RLN implementations.

- [code](rln-js)
- [website](https://examples.waku.org/rln-js)
- Demonstrates: 
  - RLN:
    - Generate credentials
    - Insert membership to smart contract (Goerli testnet)
    - Retrieve smart contract state
    - Generate and send proofs
    - Verify incoming proofs
- Pure Javascript/HTML using ESM/unpkg bundle.

### Using Waku Store in JavaScript

This example uses Waku Store to retrieve the latest ping relay message (used for keep alive purposes) and displays its timestamp.

- [code](store-js)
- [website](https://examples.waku.org/store-js)
- Demonstrates: Waku Store: Using a condition to stop retrieving results from Waku Store, Pure Javascript/HTML using ESM/unpkg bundle.

### Minimal ReactJS Waku Store App

A simple app that retrieves chat messages using [Waku Store](https://rfc.vac.dev/spec/13/)
to illustrate the [Retrieve Messages Using Waku Store With ReactJS guide](https://docs.wakuconnect.dev/docs/guides/08_reactjs_store/).

- [code](store-reactjs-chat)
- [website](https://examples.waku.org/store-reactjs-chat)
- Demonstrates: React/JavaScript, Waku Store, Protobuf using `protobufjs`, no async/await syntax.

# Continuous Integration

The `master` branch is being built by Jenkins CI:
https://ci.infra.status.im/job/website/job/examples.waku.org/

Based on the [`ci/Jenkinsfile`](./ci/Jenkinsfile).
