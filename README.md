# Js-Waku Examples

## Examples

Here is the list of the examples using [`js-waku`](https://www.npmjs.com/package/js-waku) and the features they demonstrate: 

See https://examples.waku.org/ for more examples.

### Ethereum Private Messaging

End-to-end encrypted communication between two Ethereum addresses.

- [code](examples/eth-pm)
- [website](https://examples.waku.org/eth-pm)
- Demonstrates: Private Messaging, React/TypeScript, Light Client, Signature with Web3, Asymmetric Encryption.

### Using Waku Store in JavaScript

This example uses Waku Store to retrieve the latest ping relay message (used for keep alive purposes) and displays its timestamp.

- [code](examples/store-js)
- [website](https://examples.waku.org/store-js)
- Demonstrates: Waku Store: Using a condition to stop retrieving results from Waku Store, Pure Javascript/HTML using ESM/unpkg bundle.

### Minimal ReactJS Waku Store App

A simple app that retrieves chat messages using [Waku Store](https://docs.waku.org/overview/concepts/protocols#store) to illustrate the retrieval of messages with `js-waku` and ReactJS.

- [code](examples/store-reactjs-chat)
- [website](https://examples.waku.org/store-reactjs-chat)
- Demonstrates: React/JavaScript, Waku Store, Protobuf using `protobufjs`, no async/await syntax.

# Continuous Integration

The `master` branch is being built by Jenkins CI:
https://ci.infra.status.im/job/website/job/examples.waku.org/

Based on the [`ci/Jenkinsfile`](./ci/Jenkinsfile).
