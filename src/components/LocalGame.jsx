import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Crown, Monitor, User } from 'lucide-react';
import './Game.css'; // Reusing some CSS
import './LocalGame.css'; // Specific overrides

const LocalGame = ({ user, mode, onLeaveGame }) => {
  // mode === 'local' or 'computer'
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  
  // To simulate Computer thinking time
  const [isComputerThinking, setIsComputerThinking] = useState(false);

  // When board or turn changes, check win/draw conditions and computer turn
  useEffect(() => {
    const calculatedWinner = calculateWinner(board);
    if (calculatedWinner) {
      setWinner(calculatedWinner);
      if (calculatedWinner.symbol !== 'DRAW') {
        createConfetti();
      }
      return;
    }

    // Computer Turn (O)
    if (mode === 'computer' && !xIsNext && !winner && !calculatedWinner) {
      setIsComputerThinking(true);
      const timer = setTimeout(() => {
        makeComputerMove(board);
        setIsComputerThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [board, xIsNext, mode, winner]);

  const handleMakeMove = (index) => {
    // Prevent move if cell filled, game over, or if computer is currently thinking
    if (board[index] || winner || isComputerThinking) return;

    // Prevent Player O from moving if it's computer mode and Player O turn
    if (mode === 'computer' && !xIsNext) return;

    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const makeComputerMove = (currentBoard) => {
    // Simple AI: 
    // 1. Try to win
    // 2. Try to block
    // 3. Take center
    // 4. Random available space
    
    const availableLines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    let move = -1;

    // 1. Try to win (Look for 2 'O's and 1 null)
    if (move === -1) move = findWinningMove(currentBoard, 'O', availableLines);
    
    // 2. Try to block (Look for 2 'X's and 1 null)
    if (move === -1) move = findWinningMove(currentBoard, 'X', availableLines);
    
    // 3. Take center if available
    if (move === -1 && currentBoard[4] === null) move = 4;
    
    // 4. Random space
    if (move === -1) {
      const emptyIndices = currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
      if (emptyIndices.length > 0) {
        move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    }

    if (move !== -1) {
      const newBoard = [...currentBoard];
      newBoard[move] = 'O';
      setBoard(newBoard);
      setXIsNext(true); // Switch back to X
    }
  };

  const findWinningMove = (b, player, lines) => {
    for (let i = 0; i < lines.length; i++) {
      const [x, y, z] = lines[i];
      if (b[x] === player && b[y] === player && b[z] === null) return z;
      if (b[x] === player && b[y] === null && b[z] === player) return y;
      if (b[x] === null && b[y] === player && b[z] === player) return x;
    }
    return -1;
  };

  const handleResetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
  };

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
        if(container) container.innerHTML = '';
    }, 5000);
  };

  const currentSymbol = xIsNext ? 'X' : 'O';

  // Compute Player Names for Display
  const player1Name = user.name + " (P1)";
  const player2Name = mode === 'computer' ? "Computer" : "Player 2";
  
  return (
    <div className="game-container local-container">
      {/* Top Header */}
      <div className="game-header">
        <button className="btn-icon header-btn" onClick={onLeaveGame}>
          <ArrowLeft size={20} />
        </button>
        <div className="room-info local-info glass-panel">
          {mode === 'computer' ? <><Monitor size={18} /> VS Computer</> : <><User size={18} /> Pass & Play</>}
        </div>
      </div>

      {/* Players info */}
      <div className="players-area">
        {/* Player X */}
        <div className={`player-card glass-panel local-card x-player ${!winner && xIsNext ? 'active-turn flex-grow' : ''}`}>
           <img src={user.avatar} className="game-avatar" alt="P1 Avatar" />
           <div className="player-details local-details">
             <span className="player-name">{player1Name}</span>
             <span className="player-symbol">X</span>
           </div>
        </div>

        {/* Player O */}
        <div className={`player-card glass-panel local-card o-player ${!winner && !xIsNext ? 'active-turn flex-grow' : ''}`}>
           {mode === 'computer' ? (
             <div className={`ai-avatar ${isComputerThinking ? 'thinking' : ''}`}>
               <Monitor size={28} />
             </div>
           ) : (
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=P2${user.name}`} className="game-avatar" alt="P2 Avatar" />
           )}
           <div className="player-details local-details">
             <span className="player-name">
                {player2Name} 
                {isComputerThinking && <span className="dots-anim">...</span>}
             </span>
             <span className="player-symbol">O</span>
           </div>
        </div>
      </div>

      {/* Status Message */}
      <div className={`status-message ${winner ? 'winner-msg' : ''}`}>
        {winner ? (
          winner.symbol === 'DRAW' ? "It's a Draw!" : 
          <span className="win-text"><Crown size={24}/> {winner.symbol === 'X' ? player1Name : player2Name} Wins!</span>
        ) : isComputerThinking ? (
          "Computer is thinking..."
        ) : mode === 'computer' && xIsNext ? (
          "Your turn!"
        ) : (
          `Player ${currentSymbol}'s turn`
        )}
      </div>

      {/* Game Board */}
      <div className={`board glass-panel ${winner || isComputerThinking ? 'disabled-board' : ''}`}>
        {board.map((cell, index) => {
          const isWinningCell = winner?.line?.includes(index);
          return (
            <button 
              key={index} 
              className={`cell ${cell ? cell.toLowerCase() : ''} ${isWinningCell ? 'winning-cell' : ''}`}
              onClick={() => handleMakeMove(index)}
              disabled={!!cell || !!winner || (mode === 'computer' && !xIsNext)}
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

// Extracted win calculation logic
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { symbol: squares[a], line: [a, b, c] };
    }
  }
  if (!squares.includes(null)) {
    return { symbol: 'DRAW', line: [] };
  }
  return null;
}

export default LocalGame;
