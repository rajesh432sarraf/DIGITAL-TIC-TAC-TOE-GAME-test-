import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ArrowLeft, RotateCcw, Trophy, Crown } from 'lucide-react';
import './Game.css';

// Configure this to match the backend server address or use empty string to connect to current origin
const SOCKET_URL = '/';

const Game = ({ user, room: roomId, onLeaveRoom }) => {
  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-room', { roomId, user });
    });

    newSocket.on('connect_error', () => {
      setConnectionError(true);
    });

    newSocket.on('room-update', (state) => {
      setRoomState(state);
      
      // Trigger confetti if someone won
      if (state.winner && state.winner.symbol !== 'DRAW') {
        createConfetti();
      }
    });

    return () => {
      newSocket.emit('leave-room', roomId);
      newSocket.disconnect();
    };
  }, [roomId, user]);

  const handleMakeMove = (index) => {
    if (socket && roomState) {
      socket.emit('make-move', { roomId, index });
    }
  };

  const handleResetGame = () => {
    if (socket) {
      socket.emit('reset-game', roomId);
    }
  };

  // Simple pure CSS/DOM Confetti trigger
  const createConfetti = () => {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 0; i < 100; i++) {
        const confetto = document.createElement('div');
        confetto.className = 'confetto';
        confetto.style.left = Math.random() * 100 + 'vw';
        confetto.style.animationDelay = Math.random() * 3 + 's';
        confetto.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        container.appendChild(confetto);
    }
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000); // clear after animation
  };

  if (connectionError) {
    return (
      <div className="game-container glass-panel">
        <h2 className="error-text">Failed to connect to Game Server</h2>
        <button className="btn-outline" onClick={onLeaveRoom}>Go Back</button>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="game-container loader-container">
        <div className="spinner"></div>
        <p>Connecting to Room {roomId}...</p>
      </div>
    );
  }

  const { players, board, xIsNext, winner } = roomState;
  const myPlayer = players.find((p) => p.user.id === user.id);
  const currentSymbol = xIsNext ? 'X' : 'O';
  const isMyTurn = myPlayer && myPlayer.symbol === currentSymbol;
  
  const waitingForOpponent = players.length < 2;

  return (
    <div className="game-container">
      {/* Top Header */}
      <div className="game-header">
        <button className="btn-icon header-btn" onClick={onLeaveRoom}>
          <ArrowLeft size={20} />
        </button>
        <div className="room-info glass-panel">
          Room Code: <strong>{roomId}</strong>
        </div>
      </div>

      {/* Players info */}
      <div className="players-area">
        {players.map((p, idx) => (
          <div key={p.id} className={`player-card glass-panel ${p.symbol === 'X' ? 'x-player' : 'o-player'} ${!winner && p.symbol === currentSymbol && !waitingForOpponent ? 'active-turn' : ''}`}>
             <img src={p.user.avatar} className="game-avatar" alt="Avatar" />
             <div className="player-details">
               <span className="player-name">{p.user.name} {p.user.id === user.id ? '(You)' : ''}</span>
               <span className="player-symbol">{p.symbol}</span>
             </div>
          </div>
        ))}
        {waitingForOpponent && (
          <div className="player-card glass-panel dashed waiting-card">
            <div className="spinner-small"></div>
            <span>Waiting for opponent...</span>
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className={`status-message ${winner ? 'winner-msg' : ''}`}>
        {winner ? (
          winner.symbol === 'DRAW' ? "It's a Draw!" : 
          <span className="win-text"><Crown size={24}/> Player {winner.symbol} Wins!</span>
        ) : waitingForOpponent ? (
          "Waiting for another player to join..."
        ) : isMyTurn ? (
          "It's your turn!"
        ) : (
          "Opponent's turn..."
        )}
      </div>

      {/* Game Board */}
      <div className={`board glass-panel ${!isMyTurn || winner || waitingForOpponent ? 'disabled-board' : ''}`}>
        {board.map((cell, index) => {
          const isWinningCell = winner?.line?.includes(index);
          return (
            <button 
              key={index} 
              className={`cell ${cell ? cell.toLowerCase() : ''} ${isWinningCell ? 'winning-cell' : ''}`}
              onClick={() => handleMakeMove(index)}
              disabled={!!cell || !isMyTurn || !!winner || waitingForOpponent}
            >
              {cell}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      {winner && (
        <div className="game-controls animate-up">
          <button className="btn-primary reset-btn" onClick={handleResetGame}>
            <RotateCcw size={20} /> Play Again
          </button>
        </div>
      )}
      
      {/* Container for CSS Confetti */}
      <div id="confetti-container"></div>
    </div>
  );
};

export default Game;
