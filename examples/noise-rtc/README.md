State of this example: **work in progress**

What's done:
- By using `js-noise` users can establish secure communication channel.
- This channel is used to exchange `offer/answer` to initiate direct WebRTC connection.

What should be done:
- `STUN` server: in order not to loose benefits of peer-to-peer protocols used underneath we should find a way to be able to retrieve coordinates of a user to build `offer/answer` by not involving one `STUN` server for it;
- `TURN` server: similarly to prev point we should be able to cover a need to create WebRTC connection for users who are behind secure `NAT` and are not able to communicated just as it is.

Additional reading that explains why `STUN/TURN` is not easily removable from the equation: https://github.com/libp2p/specs/pull/497/files#diff-2cb0b0dcc282bd123b21f5a0610e8a01b516fc453b95c655cf7e16734f2f7b11R48-R53