const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Store active rooms
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

  socket.on('make-move', ({ roomId, index }) => {
    const room = rooms.get(roomId);
    if (room && !room.winner && !room.board[index]) {
      // Find whose turn it is
      const currentSymbol = room.xIsNext ? 'X' : 'O';
      const player = room.players.find(p => p.id === socket.id);
      
      // Verify the player is allowed to make a move
      if (player && player.symbol === currentSymbol) {
        room.board[index] = player.symbol;
        room.xIsNext = !room.xIsNext;
        
        // Check for winner
        room.winner = calculateWinner(room.board);
        
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
    // Remove player from all their rooms
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
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
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
  console.log(`Socket.io Server running on port ${PORT}`);
});
