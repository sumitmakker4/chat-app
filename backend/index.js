const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL,'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

const User = require('./models/User');

let onlineUsers = []

function getSocketIdByUserId(userId) {
  const user = onlineUsers.find(user => user.id == userId);
  return user ? user.socket_id : null;
}

io.on('connection', (socket) => {

  socket.on('user-online', async (userId) => {
    await User.findByIdAndUpdate(userId, {
      is_online: true,
      socket_id: socket.id,
    });

    const users = await User.find({ is_online: true })
    .select('_id name socket_id')

    onlineUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      socket_id: user.socket_id
    }));

    io.emit('online-users', onlineUsers);
  });

  socket.on('typing', async ({ to, from }) => {
    if (!to || !from) return;
    const toUser = await User.findById(to);
    if (toUser?.socket_id) {
      io.to(toUser.socket_id).emit('typing', { from });
    }
  });

  socket.on('stop-typing', async ({ to, from }) => {
    if (!to || !from) return;
    const toUser = await User.findById(to);
    if (toUser?.socket_id) {
      io.to(toUser.socket_id).emit('stop-typing', { from });
    }
  });

  socket.on('send-message', (message) => {
    const receiverSocketId = getSocketIdByUserId(message.receiver)
    console.log('send-message received:', message);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message-received', message);
      console.log(`Sent message to receiver socket ${receiverSocketId}`);
    }
    // Optionally emit back to sender (acknowledgement)
    socket.emit('message-sent', message);
  });

  socket.on('disconnect', async () => {
    try {
      const user = await User.findOne({ socket_id: socket.id });
      if (user) {
        user.is_online = false;
        user.socket_id = null;
        await user.save();

        const onlineUsers = await User.find({ is_online: true }).select('_id name');
        io.emit('online-users', onlineUsers);
      }
    } catch (err) {
      console.error('Error handling disconnect:', err);
    }
  });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

app.use('/api/messages',messageRoutes);
app.use('/api/auth',authRoutes);