require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow base64 profile pictures

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// --- MONGODB CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI || '';
let dbConnected = false;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB successfully.');
      dbConnected = true;
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      console.log('⚠️ Running without database persistence.');
    });
} else {
  console.log('⚠️ No MONGODB_URI provided in environment. Running with in-memory storage (Data will be lost on restart!).');
}

// --- DATABASE SCHEMA ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  provider: { type: String, default: 'Local' },
  avatar: { type: String }, // Base64 string or URL
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// In-Memory Fallback Store
const memoryUsers = new Map();

// --- REST API ENDPOINTS ---
app.post('/api/login', async (req, res) => {
  const { name, provider, avatar } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    if (dbConnected) {
      // Find or create user
      let user = await User.findOne({ name, provider });
      if (!user) {
        user = new User({ name, provider, avatar });
        await user.save();
      } else {
        // Update avatar if a new one is provided
        if (avatar && user.avatar !== avatar) {
          user.avatar = avatar;
          await user.save();
        }
      }
      return res.json({ 
        id: user._id.toString(), 
        name: user.name, 
        provider: user.provider, 
        avatar: user.avatar, 
        wins: user.wins, 
        losses: user.losses, 
        draws: user.draws 
      });
    } else {
      // Memory fallback logic
      const mockId = name + '-' + provider;
      if (!memoryUsers.has(mockId)) {
        memoryUsers.set(mockId, { id: mockId, name, provider, avatar, wins: 0, losses: 0, draws: 0 });
      } else if (avatar) {
        memoryUsers.get(mockId).avatar = avatar;
      }
      return res.json(memoryUsers.get(mockId));
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch updated stats for a user
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (dbConnected && mongoose.Types.ObjectId.isValid(id)) {
      const user = await User.findById(id);
      if (user) return res.json({
        id: user._id.toString(),
        name: user.name,
        provider: user.provider,
        avatar: user.avatar,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws
      });
    } else if (memoryUsers.has(id)) {
      return res.json(memoryUsers.get(id));
    }
    res.status(404).json({ error: 'User not found' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- SERVE PRODUCTION FRONTEND ---
// Ensure the API routes above are defined before this catch-all
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- SOCKET.IO MULTIPLAYER LOGIC ---
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, user }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        players: [],
        board: Array(9).fill(null),
        xIsNext: true,
        winner: null,
      });
    }

    const room = rooms.get(roomId);
    
    // Add player if room is not full and player not already in
    if (room.players.length < 2 && !room.players.find(p => p.id === socket.id)) {
      const symbol = room.players.length === 0 ? 'X' : 'O';
      room.players.push({ id: socket.id, user, symbol });
    }

    io.to(roomId).emit('room-update', room);
    console.log(`User ${user.name} joined room ${roomId}`);
  });

  socket.on('make-move', async ({ roomId, index }) => {
    const room = rooms.get(roomId);
    if (room && !room.winner && !room.board[index]) {
      const currentSymbol = room.xIsNext ? 'X' : 'O';
      const player = room.players.find(p => p.id === socket.id);
      
      if (player && player.symbol === currentSymbol) {
        room.board[index] = player.symbol;
        room.xIsNext = !room.xIsNext;
        
        room.winner = calculateWinner(room.board);
        
        // Update database stats if the game ended
        if (room.winner && room.players.length === 2) {
          try {
            const player1 = room.players[0].user;
            const player2 = room.players[1].user;
            
            if (dbConnected) {
              if (room.winner.symbol === 'DRAW') {
                if (mongoose.Types.ObjectId.isValid(player1.id)) await User.findByIdAndUpdate(player1.id, { $inc: { draws: 1 } });
                if (mongoose.Types.ObjectId.isValid(player2.id)) await User.findByIdAndUpdate(player2.id, { $inc: { draws: 1 } });
              } else {
                const winningPlayer = room.players.find(p => p.symbol === room.winner.symbol);
                const losingPlayer = room.players.find(p => p.symbol !== room.winner.symbol);
                if (winningPlayer && mongoose.Types.ObjectId.isValid(winningPlayer.user.id)) await User.findByIdAndUpdate(winningPlayer.user.id, { $inc: { wins: 1 } });
                if (losingPlayer && mongoose.Types.ObjectId.isValid(losingPlayer.user.id)) await User.findByIdAndUpdate(losingPlayer.user.id, { $inc: { losses: 1 } });
              }
            } else {
              // Memory fallback stats update
              if (room.winner.symbol === 'DRAW') {
                 if(memoryUsers.has(player1.id)) memoryUsers.get(player1.id).draws++;
                 if(memoryUsers.has(player2.id)) memoryUsers.get(player2.id).draws++;
              } else {
                 const winningPlayer = room.players.find(p => p.symbol === room.winner.symbol);
                 const losingPlayer = room.players.find(p => p.symbol !== room.winner.symbol);
                 if(winningPlayer && memoryUsers.has(winningPlayer.user.id)) memoryUsers.get(winningPlayer.user.id).wins++;
                 if(losingPlayer && memoryUsers.has(losingPlayer.user.id)) memoryUsers.get(losingPlayer.user.id).losses++;
              }
            }
          } catch (e) {
            console.error('Failed to update stats:', e);
          }
        }
        
        io.to(roomId).emit('room-update', room);
      }
    }
  });

  socket.on('reset-game', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.board = Array(9).fill(null);
      room.xIsNext = true;
      room.winner = null;
      io.to(roomId).emit('room-update', room);
    }
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    const room = rooms.get(roomId);
    if (room) {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        io.to(roomId).emit('room-update', room);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    rooms.forEach((room, roomId) => {
      if (room.players.find(p => p.id === socket.id)) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('room-update', room);
        }
      }
    });
  });
});

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

server.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
