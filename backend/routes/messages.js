const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

router.get('/chat-users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await User.find({ _id: { $ne: userId } }).select('_id name email');

    const usersWithLastMessages = await Promise.all(
      users.map(async (otherUser) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: userId, receiver: otherUser.id },
            { sender: otherUser.id, receiver: userId },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          id: otherUser.id,
          name : otherUser.name,
          email: otherUser.email,
          lastMessage: lastMessage?.text || 'No message yet',
          lastMessageDate: lastMessage?.createdAt || null,
        };
      })
    );

    // Optionally sort users by recent message
    usersWithLastMessages.sort((a, b) => {
      if (!a.lastMessageDate) return 1;
      if (!b.lastMessageDate) return -1;
      return new Date(b.lastMessageDate) - new Date(a.lastMessageDate);
    });

    res.json(usersWithLastMessages);
  } catch (error) {
    console.error("Error in chat-users route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/conversation', async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Both user1 and user2 are required' });
    }

    // Find messages where (from=user1 and to=user2) OR (from=user2 and to=user1)
    const messages = await Message.find({
      $or: [
        { from: user1, to: user2 },
        { from: user2, to: user1 }
      ]
    }).sort({ createdAt: 1 }); // Sort by oldest first

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;