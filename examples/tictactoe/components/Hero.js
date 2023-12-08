import React, { useState, useEffect } from 'react';
import Loading from './Loading';
import ShortUniqueId from 'short-unique-id';
import Router from 'next/router';

export default function Hero() {
  const options = { length: 8 };
  const uid = new ShortUniqueId(options);

  const [room, setRoom] = useState(null);
  const [game, setGame] = useState(null);
  const [joinLink, setJoinLink] = useState('');

  useEffect(() => {
    if (room === null) {
      setRoom(uid.rnd());
    }
  }, []);

  if (room === null) {
    return <Loading />;
  }

  const handleNewGameClick = () => {
    sessionStorage.setItem('roomId', room);
    sessionStorage.setItem('player', 'x');
    Router.push(`/game/${room}`);
  };

  const handleJoinGameClick = () => {
    setGame('join');
  };

  const handleJoinLinkChange = (e) => {
    setJoinLink(e.target.value);
  };

  const handleJoinButtonClick = () => {
    Router.push(`/game/${joinLink}`);
  };

  const handleGoBackClick = () => {
    setGame(null);
  };

  return (
    <section id='hero'>
      <div className="mx-auto max-w-screen-xl px-4 lg:flex lg:mt-40 lg:items-center mt-40">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl sm:text-8xl text-white">TicTacToe</h1>
          <div className='mt-8 sm:text-xl/relaxed text-white opacity-60 flex items-center justify-center'>
            <p>Built with</p>
            <img src='https://waku.org/theme/image/logo.svg' />
            <a href='https://waku.org' className='underline'>
              Waku
            </a>
          </div>

          {game === null && (
            <div className="mt-20 flex flex-wrap justify-center gap-4">
              <button
                className="block w-full bg-white px-12 py-3 text-sm font-medium hover:text-white hover:bg-black hover:border-2  hover:border-white focus:outline-none focus:ring  text-black"
                onClick={handleNewGameClick}
              >
                New game
              </button>
              <button
                onClick={handleJoinGameClick}
                className="block w-full bg-white px-12 py-3 text-sm font-medium hover:text-white hover:bg-black hover:border-2  hover:border-white focus:outline-none focus:ring  text-black"
              >
                Join game
              </button>
            </div>
          )}

          {game === 'join' && (
            <div className="mt-20 space-y-4">
              <input
                value={joinLink}
                onChange={handleJoinLinkChange}
                className="px-3 py-3 border-2 border-white w-full"
                placeholder='Enter the game link'
              />
              <div className='flex space-x-5 items-center'>
                <button
                  onClick={handleJoinButtonClick}
                  className="block w-full bg-white px-12 py-3 text-sm font-medium hover:text-white hover:bg-black hover:border-2  hover:border-white focus:outline-none focus:ring  text-black"
                >
                  Join game
                </button>
                <button
                  onClick={handleGoBackClick}
                  className="block w-full bg-white px-12 py-3 text-sm font-medium hover:text-white hover:bg-black hover:border-2  hover:border-white focus:outline-none focus:ring text-black"
                >
                  Go back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
