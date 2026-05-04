import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Game from './components/Game';
import LocalGame from './components/LocalGame';

function App() {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  
  // gameMode can be: null (dashboard), 'online', 'local', 'computer'
  const [gameMode, setGameMode] = useState(null);

  useEffect(() => {
    // Check local storage for mocked user session
    const storedUser = localStorage.getItem('tic_tac_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('tic_tac_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setRoom(null);
    setGameMode(null);
    localStorage.removeItem('tic_tac_user');
  };

  const handleJoinOnlineRoom = (roomId) => {
    setGameMode('online');
    setRoom(roomId);
  };

  const handleStartLocalGame = () => {
    setGameMode('local');
  };

  const handleStartComputerGame = () => {
    setGameMode('computer');
  };

  const handleLeaveGame = () => {
    setRoom(null);
    setGameMode(null);
  };

  return (
    <div className="app-container">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : !gameMode ? (
        <Dashboard 
          user={user} 
          onJoinRoom={handleJoinOnlineRoom} 
          onStartLocal={handleStartLocalGame}
          onStartComputer={handleStartComputerGame}
          onLogout={handleLogout} 
        />
      ) : gameMode === 'online' ? (
        <Game user={user} room={room} onLeaveRoom={handleLeaveGame} />
      ) : (
        <LocalGame user={user} mode={gameMode} onLeaveGame={handleLeaveGame} />
      )}
    </div>
  );
}

export default App;
