import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import MessageInput from './MessageInput';

export default function ChatBox({ chats }) {
  const { user } = useContext(AuthContext);
  const { socket, selectedChat, typingUsers } = useContext(ChatContext);

  const [messages, setMessages] = useState([]);
  const bottomRef = useRef();

  useEffect(() => {
    if (!selectedChat) return;

    // Fetch messages API here
    const fetchMessages = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${selectedChat.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      setMessages(data);
    };

    fetchMessages();

    if (socket) {
      socket.emit('join-chat', selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      if (msg.chatId === selectedChat.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('message-received', handleMessage);

    return () => {
      socket.off('message-received', handleMessage);
    };
  }, [socket, selectedChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedChat) return <div className="flex-1 p-4">Select a chat to start messaging</div>;

  const isTyping = typingUsers[selectedChat.id] && typingUsers[selectedChat.id] !== user.id;

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex-1 overflow-auto space-y-2 mb-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-xs px-4 py-2 rounded-md ${
              msg.from === user.id ? 'bg-blue-500 text-white self-end ml-auto' : 'bg-gray-200 text-black self-start mr-auto'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && <div className="text-sm italic text-gray-400">Typing...</div>}
        <div ref={bottomRef} />
      </div>
      <MessageInput
        socket={socket}
        selectedChat={selectedChat}
        onSendMessage={(text) => {
          // Send message logic (emit event and update UI)
          const newMsg = {
            chatId: selectedChat.id,
            from: user.id,
            text,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, newMsg]);
          socket.emit('send-message', newMsg);
        }}
      />
    </div>
  );
}