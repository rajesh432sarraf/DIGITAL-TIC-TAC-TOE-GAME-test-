import React, { useState } from 'react';
import { LogOut, Plus, Users, Gamepad2, User, MonitorCheck } from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ user, onJoinRoom, onStartLocal, onStartComputer, onLogout }) => {
  const [joinCode, setJoinCode] = useState('');

  const handleCreateRoom = () => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    onJoinRoom(newRoomCode);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCode.trim().length > 0) {
      onJoinRoom(joinCode.toUpperCase());
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dash-header glass-panel">
        <div className="user-profile">
          <img src={user.avatar} alt="avatar" className="avatar" />
          <div className="user-info">
            <h2>{user.name}</h2>
            <span className="badge">{user.provider} User</span>
          </div>
        </div>
        <button className="btn-icon log-out-btn" onClick={onLogout} title="Logout">
          <LogOut size={20} />
        </button>
      </header>

      <div className="dash-content split-view">
        
        {/* ONLINE MULTIPLAYER SECTION */}
        <div className="mode-section glass-panel">
          <h3 className="section-title"><Gamepad2 size={24} className="inline-icon" /> Online Multiplayer</h3>
          <p className="status-text mb-4">
            <span className="pulse-dot"></span> Play with friends over the internet
          </p>
          
          <div className="action-row">
            <div className="action-card inner-card create-card">
              <div className="card-icon"><Plus size={24} /></div>
              <h4>Create Room</h4>
              <button className="btn-primary full-width" onClick={handleCreateRoom}>
                Create Game
              </button>
            </div>

            <div className="action-card inner-card join-card">
              <div className="card-icon"><Users size={24} /></div>
              <h4>Join Game</h4>
              <form onSubmit={handleJoinSubmit} className="join-form">
                <input 
                  type="text" 
                  placeholder="Code" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  maxLength={6}
                  className="input-field code-input"
                />
                <button type="submit" className="btn-primary" disabled={!joinCode.trim()}>
                  Go
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* OFFLINE MODES SECTION */}
        <div className="mode-section glass-panel">
          <h3 className="section-title"><User size={24} className="inline-icon offline-icon" /> Offline Modes</h3>
          <p className="status-text mb-4 text-offline">
            Play locally on the same device
          </p>
          
          <div className="action-row">
            <div className="action-card inner-card local-card">
              <div className="card-icon offline-bg"><Users size={24} /></div>
              <h4>Pass & Play</h4>
              <p className="small-text">2 Players Local</p>
              <button className="btn-outline full-width mt-auto offline-btn" onClick={onStartLocal}>
                Start Local
              </button>
            </div>

            <div className="action-card inner-card computer-card">
              <div className="card-icon ai-bg"><MonitorCheck size={24} /></div>
              <h4>VS Computer</h4>
              <p className="small-text">Play an AI</p>
              <button className="btn-outline full-width mt-auto offline-btn" onClick={onStartComputer}>
                Start Solo
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
