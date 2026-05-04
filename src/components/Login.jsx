import React, { useState, useEffect } from 'react';
import { Smartphone, Github, Facebook, Mail } from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');

  // Add floating shapes effect on mount
  useEffect(() => {
    const container = document.querySelector('.floating-shapes');
    if (container && container.children.length === 0) {
      for (let i = 0; i < 15; i++) {
        const shape = document.createElement('div');
        shape.classList.add('shape');
        shape.style.left = `${Math.random() * 100}vw`;
        shape.style.top = `${Math.random() * 100}vh`;
        shape.style.animationDuration = `${Math.random() * 10 + 10}s`;
        shape.style.animationDelay = `${Math.random() * 5}s`;
        shape.style.opacity = Math.random() * 0.5 + 0.1;
        const size = Math.random() * 150 + 50;
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
        container.appendChild(shape);
      }
    }
  }, []);

  const handleProviderClick = (provider) => {
    setSelectedProvider(provider);
    setShowNameInput(true);
  };

  const handleMockLogin = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin({
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        provider: selectedProvider,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      });
    }
  };

  return (
    <div className="login-wrapper">
      <div className="dynamic-background"></div>
      <div className="floating-shapes"></div>
      
      <div className="login-container glass-panel z-10">
        <div className="login-header">
          <h1 className="game-title animated-title">TIC TAC TOE</h1>
          <p className="subtitle typing-effect">Premium Multiplayer Experience</p>
        </div>

        {!showNameInput ? (
          <div className="auth-providers fade-in-up">
            <button className="auth-btn google" onClick={() => handleProviderClick('Google')}>
              <Mail size={20} /> Continue with Google
            </button>
            <button className="auth-btn facebook" onClick={() => handleProviderClick('Facebook')}>
              <Facebook size={20} /> Continue with Facebook
            </button>
            <button className="auth-btn github" onClick={() => handleProviderClick('GitHub')}>
              <Github size={20} /> Continue with GitHub
            </button>
            <button className="auth-btn phone" onClick={() => handleProviderClick('Phone')}>
              <Smartphone size={20} /> Continue with Phone
            </button>
          </div>
        ) : (
          <form onSubmit={handleMockLogin} className="mock-login-form fade-in">
            <h2>Welcome via {selectedProvider}</h2>
            <p>Please enter your display name for the game.</p>
            <input 
              type="text" 
              placeholder="Enter Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              autoFocus
              required
              maxLength={15}
            />
            <div className="form-actions">
              <button type="button" className="btn-outline" onClick={() => setShowNameInput(false)}>Back</button>
              <button type="submit" className="btn-primary glow-btn">Start Playing</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
