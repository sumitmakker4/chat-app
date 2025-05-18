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

io.on('connection', (socket) => {

  // Handle user coming online
  socket.on('user-online', async (userId) => {
    await User.findByIdAndUpdate(userId, {
      is_online: true,
      socket_id: socket.id,
    });

    const users = await User.find({ is_online: true })
    .select('_id name')

    const onlineUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
    }));

    io.emit('online-users', onlineUsers);
  });

  socket.on('send-message', async ({ senderId, receiverId, text }) => {
    try {
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text,
      });

      const receiver = await User.findById(receiverId);
      if (receiver?.socket_id) {
        io.to(receiver.socket_id).emit('receive-message', {
          senderId,
          text,
          createdAt: newMessage.createdAt,
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  });

  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('typing', ({ to, from }) => {
    if (!to || !from) return;
    // Emit to the recipient's socket only
    socket.to(to).emit('typing', from); // send 'typing' event with from id
  });

  socket.on('stop-typing', ({ to, from }) => {
    if (!to || !from) return;
    socket.to(to).emit('stop-typing', from); // send 'stop-typing' event with from id
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