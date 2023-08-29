# Using Waku Relay WebRTC

**Demonstrates**:

- Waku Relay node with direct WebRTC connection 
- Pure Javascript/HTML.

This example uses Waku Filter to listen to messages and Waku Light Push to send messages.

To test the example run `npm install` and then `npm start`.

The `master` branch's HEAD is deployed at https://examples.waku.org/relay-chat/.

### Steps to run an example: 
1. Build and then run `go-waku` node with following command: `./build/waku --ws true --relay true --circuit-relay true`
2. Copy node's multiaddr (e.g `/ip4/192.168.0.101/tcp/60001/ws/p2p/16Uiu2HAm9w2xeDWFJm5eeGLZfJdaPtkNatQD1xrzK5EFWSeXdFvu`)
3. In `relay-chat` example's folder run `npm install` and then `npm start`
4. Use `go-waku`'s multiaddr for **Remote node multiaddr** and press dial. Repeat in two more tabs.
5. In `tab2` copy **Local Peer Id** and use as **WebRTC Peer** in `tab1` and press dial.
6. In `tab1` or `tab2` press **Ensure WebRTC Relay connection**
7. In `tab1` press **Drop non WebRTC connections**
8. In `tab1` enter **Nickname** and **Message** and send. 
9. See the message in `tab3` which was connected only to `go-waku` node.
