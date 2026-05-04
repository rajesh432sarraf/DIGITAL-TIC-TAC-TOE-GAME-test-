import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Github, Facebook, Mail, Upload, Check } from 'lucide-react';
import './Login.css';

const PREDEFINED_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo'
];

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  
  const [selectedAvatar, setSelectedAvatar] = useState(PREDEFINED_AVATARS[0]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [loginError, setLoginError] = useState('');

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setLoginError('Image must be less than 2MB');
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result); // Base64 string
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMockLogin = async (e) => {
    e.preventDefault();
    if (name.trim()) {
      setLoginError('');
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            provider: selectedProvider,
            avatar: selectedAvatar
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to connect to backend');
        }
        
        const userData = await response.json();
        onLogin(userData); // Pass the real user data back to App
      } catch (err) {
        console.error('Backend connection failed, using local mock data:', err);
        // Fallback to local user if backend is completely down
        onLogin({
          id: Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          provider: selectedProvider,
          avatar: selectedAvatar,
          wins: 0, losses: 0, draws: 0
        });
      }
    }
  };

  return (
    <div className="login-wrapper">
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
            <h2>Profile Setup</h2>
            <p>Choose an avatar and enter your display name.</p>
            
            {loginError && <div className="error-text" style={{color: '#ef4444', marginBottom: '10px'}}>{loginError}</div>}

            {/* Avatar Selection */}
            <div className="avatar-selection">
              <div className="avatar-grid">
                {PREDEFINED_AVATARS.map((avatar, idx) => (
                  <div 
                    key={idx} 
                    className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    <img src={avatar} alt={`Avatar ${idx}`} />
                    {selectedAvatar === avatar && <div className="avatar-check"><Check size={16}/></div>}
                  </div>
                ))}
              </div>
              
              <div className="custom-upload-container">
                {selectedAvatar && !PREDEFINED_AVATARS.includes(selectedAvatar) ? (
                  <div className="custom-preview-wrapper" onClick={() => fileInputRef.current.click()}>
                    <img src={selectedAvatar} className="custom-preview" alt="Custom" />
                    <div className="upload-overlay"><Upload size={16}/></div>
                  </div>
                ) : (
                  <button type="button" className="btn-outline upload-btn" onClick={() => fileInputRef.current.click()}>
                    <Upload size={18} /> {isUploading ? 'Uploading...' : 'Upload Custom Photo'}
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{display: 'none'}} 
                />
              </div>
            </div>

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
