import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';

export default function MessageInput({ socket, selectedChat, onSendMessage }) {
  const { user } = useContext(AuthContext);
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef(null);

  const emitTyping = () => {
    if (!socket || !selectedChat) return;

    socket.emit('typing', { chatId: selectedChat.id, from: user.id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { chatId: selectedChat.id, from: user.id });
    }, 2000);
  };

  const handleChange = (e) => {
    setText(e.target.value);
    emitTyping();
  };

  const handleSend = () => {
    if (!text.trim()) return;

    onSendMessage(text);
    setText('');
    socket.emit('stop-typing', { chatId: selectedChat.id, from: user.id });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type a message..."
        className="flex-1 p-2 border rounded"
      />
      <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded">
        Send
      </button>
    </div>
  );
}