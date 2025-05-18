import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function MessageInput({ socket, selectedChat, setMessages }) {
  const { user } = useContext(AuthContext);
  const [newMessage, setNewMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const [typing, setTyping] = useState(false);

  const sendTyping = () => {
    if (!socket || !selectedChat) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing',{to: selectedChat.id,from: user.id});
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socket.emit('stop-typing',{to: selectedChat.id,from: user.id});
    }, 1500);
  };

  const handleChange = (e) => {
    setNewMessage(e.target.value);
    sendTyping();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Send message API call here
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedChat.id,
          content: newMessage,
        }),
      });
      const savedMessage = await res.json();

      setMessages((prev) => [...prev, savedMessage]);

      socket.emit('send-message', savedMessage);

      setNewMessage('');
      socket.emit('stop-typing', { to: selectedChat.id, from: user.id });
      setTyping(false);
      clearTimeout(typingTimeoutRef.current);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex space-x-2">
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
        value={newMessage}
        onChange={handleChange}
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600 disabled:opacity-50"
        disabled={!newMessage.trim()}
      >
        Send
      </button>
    </form>
  );
}