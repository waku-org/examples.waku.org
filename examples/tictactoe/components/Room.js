import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import copy from 'copy-to-clipboard';
import protobuf from 'protobufjs';
import {
  useWaku,
  useContentPair,
  useLightPush,
  useStoreMessages,
  useFilterMessages,
} from '@waku/react';
import { message } from '@waku/core';
import Loading from './Loading';

const ChatMessage = new protobuf.Type('ChatMessage')
  .add(new protobuf.Field('timestamp', 1, 'uint64'))
  .add(new protobuf.Field('sender', 2, 'string'))
  .add(new protobuf.Field('message', 3, 'string'));

export default function Room(props) {
  const { node } = useWaku();
  const [nodeStart, setNodeStart] = useState(false);

  const [move, setMove] = useState(false);
  const [boxes, setBoxes] = useState({});
  const [player, setPlayer] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(null);
  const [winner, setWinner] = useState(null);
  const [winningPattern, setWinningPattern] = useState(null);

  const { decoder, encoder } = useContentPair();

  const { messages: storeMessages } = useStoreMessages({
    node,
    decoder,
  });

  const { messages: filterMessages } = useFilterMessages({ node, decoder });

  const { push } = useLightPush({ node, encoder });

  async function sendMessage(sender, message) {
    const protoMessage = ChatMessage.create({
      timestamp: Date.now(),
      sender,
      message,
    });

    const serialisedMessage = ChatMessage.encode(protoMessage).finish();

    const timestamp = new Date();
    await push({
      payload: serialisedMessage,
      timestamp,
    });

    console.log('MESSAGE PUSHED');
  }

  function decodeMessage(wakuMessage) {
    if (!wakuMessage.payload) return;

    const { timestamp, sender, message } = ChatMessage.decode(wakuMessage.payload);

    if (!timestamp || !sender || !message) return;

    const time = new Date();
    time.setTime(Number(timestamp));

    return {
      message,
      timestamp: time,
      sender,
      timestampInt: wakuMessage.timestamp,
    };
  }

  useEffect(() => {
    if (node !== undefined) {
      if (player === false) {
        const p =
          sessionStorage.getItem('roomId') == props.room && sessionStorage.getItem('player') == 'x'
            ? 'x'
            : 'o';

        setPlayer(p);
        if (p === 'o') {
          sendMessage('o', 'joined');
        }
      }
      setNodeStart(true);
    }
  }, [node]);

  useEffect(() => {
    let messages = storeMessages.concat(filterMessages);

    let b = {};
    let o = false;

    messages = messages.map((message) => decodeMessage(message));

    messages.forEach((message) => {
      if (message.message === 'joined') {
        o = true;
        return;
      }
      if (message.message === 'winner') {
        return;
      }

      b = { ...b, [message.message]: message.sender };
    });

    const winningCombinations = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['1', '4', '7'],
      ['2', '5', '8'],
      ['3', '6', '9'],
      ['1', '5', '9'],
      ['3', '5', '7'],
    ];

    let winner = null;
    let temp = null;
    let winningPattern = null;

    winningCombinations.forEach((combination) => {
      if (winner !== null) {
        return;
      }
      for (let [i, c] of combination.entries()) {
        if (b[c] === undefined) {
          temp = null;
          break;
        } else {
          if (temp === null) {
            temp = b[c];
            continue;
          } else {
            if (temp === b[c]) {
              if (i === 2) {
                winner = temp;
                winningPattern = combination;
              }
              continue;
            }
          }
        }
      }
    });

    setWinner(winner);
    setWinningPattern(winningPattern);
    setOpponentJoined(o);
    setBoxes(b);
  }, [storeMessages, filterMessages]);

  if (!nodeStart || !player || opponentJoined === null) {
    return <Loading />;
  }

  function handlePlay(i) {
    if (opponentJoined === false) {
      alert('Opponent is yet to join!');
      return;
    }

    if (boxes[i] !== undefined) {
      alert('Already played!');
      return;
    }

    if (Object.keys(boxes).length % 2 === 0) {
      if (player === 'o') {
        alert("Opponent's turn");
      } else {
        sendMessage('x', i);
        setBoxes({ ...boxes, i: 'x' });
      }
    } else {
      if (player === 'x') {
        alert("Opponent's turn");
      } else {
        sendMessage('o', i);
        setBoxes({ ...boxes, i: 'o' });
      }
    }
  }

  function renderBoxes() {
    let boxElements = [];
    for (let i = 1; i < 10; i += 1) {
      if (boxes[i] === undefined) {
        boxElements.push(
          <div
            onClick={() => handlePlay(i.toString())}
            className='w-20 h-20 border-2 border-white flex items-center justify-center text-2xl text-white'
          ></div>
        );
      } else {
        if (boxes[i] === 'x') {
          boxElements.push(
            <div className='w-20 h-20 border-2 border-white flex items-center justify-center text-2xl text-white'>
              X
            </div>
          );
        } else {
          boxElements.push(
            <div className='w-20 h-20 border-2 border-white flex items-center justify-center text-2xl text-white'>
              O
            </div>
          );
        }
      }
    }
    return <div id='tiles' className='grid grid-cols-3 grid-rows-3 gap-3 mt-10'>{boxElements}</div>;
  }

  return (
    <section id='room'>
      <div className='flex justify-end mr-5 text-white space-x-5 items-center'>
        <p>Waku status : active</p>

        <svg width='20' height='20' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'>
          <g fill='none' stroke='currentColor' strokeWidth='4'>
            <path d='M13.5 39.37A16.927 16.927 0 0 0 24 43c3.963 0 7.61-1.356 10.5-3.63M19 9.747C12.051 11.882 7 18.351 7 26c0 1.925.32 3.775.91 5.5M29 9.747C35.949 11.882 41 18.351 41 26c0 1.925-.32 3.775-.91 5.5' />
            <path strokeLinecap='round' strokeLinejoin='round' d='M43 36c0 1.342-.528 2.56-1.388 3.458A5 5 0 1 1 43 36Zm-28 0c0 1.342-.528 2.56-1.388 3.458A5 5 0 1 1 15 36ZM29 9c0 1.342-.528 2.56-1.388 3.458A5 5 0 1 1 29 9Z' />
          </g>
        </svg>
        <p>Peers : {node?.libp2p?.getPeers()?.length ?? '-'}</p>
      </div>

      <div className='mx-auto max-w-screen-xl px-4 mt-20 lg:flex lg:h-mt-40 lg:items-center'>
        <div className='mx-auto max-w-xl'>
          <div className='flex space-x-2 text-white opacity-60 mb-5 items-center'>
            <Link href='/'>
              <svg width='20' height='20' viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'>
                <path fill='currentColor' d='M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z' />
                <path
                  fill='currentColor'
                  d='m237.248 512l265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z'
                />
              </svg>
            </Link>
            <p>Game URL</p>
          </div>
          <div className='px-3 py-3 text-center flex border-2 border-white text-white underline items-center justify-between'>
            <p>https://waku-xo.vercel.app/game/{props.room}</p>
            <button onClick={() => copy(`https://waku-xo.vercel.app/game/${props.room}`)}>
              <svg width='20' height='20' viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'>
                <path
                  fill='currentColor'
                  d='M216 32H88a8 8 0 0 0-8 8v40H40a8 8 0 0 0-8 8v128a8 8 0 0 0 8 8h128a8 8 0 0 0 8-8v-40h40a8 8 0 0 0 8-8V40a8 8 0 0 0-8-8Zm-56 176H48V96h112Zm48-48h-32V88a8 8 0 0 0-8-8H96V48h112Z'
                />
              </svg>
            </button>
          </div>

          <h1 className='text-3xl sm:text-4xl text-white mt-20'>
            {!opponentJoined && 'Waiting for opponent to join'}
            {winner == null &&
              opponentJoined &&
              (Object.keys(boxes).length % 2 === 0
                ? player === 'x'
                  ? 'Your turn'
                  : "Opponent's turn"
                : player === 'o'
                ? 'Your turn'
                : "Opponent's turn")}
            {winner != null && (winner === 'x' ? 'X is winner' : 'O is winner')}
          </h1>
{
!winner &&
          <div className='flex justify-center'>{renderBoxes()}</div>
}
        </div>
      </div>
    </section>
  );
}
