import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import MessageInput from './MessageInput';

export default function ChatBox() {
  const { user } = useContext(AuthContext);
  const {socket,selectedChat,messages,setMessages} = useContext(ChatContext);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/conversation?user1=${user.id}&user2=${selectedChat.id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const data = await res.json();
      
      setMessages(data);
      
    };

    fetchMessages();
  }, [selectedChat]);

  useEffect(() => {
    if (!socket || !selectedChat) return;

    const handleMessage = (msg) => {
      // Push new message if it's for this chat (either from or to)
      if (msg.from === selectedChat.id || msg.to === selectedChat.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleTyping = ({ from }) => {
      if (from === selectedChat.id) setTyping(true);
    };

    const handleStopTyping = ({ from }) => {
      if (from === selectedChat.id) setTyping(false);
    };

    socket.on('message-received', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('stop-typing', handleStopTyping);

    return () => {
      socket.off('message-received', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('stop-typing', handleStopTyping);
    };
  }, [socket,selectedChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedChat) {
    return <div className="flex-1 p-6 text-gray-600"></div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-white p-4 overflow-hidden">
      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-xs px-4 py-2 rounded-md ${
              msg.sender === user.id ? 'bg-blue-500 text-white self-end ml-auto' : 'bg-gray-200 text-black self-start mr-auto'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {typing && <div className="text-sm text-gray-400 italic">Typing...</div>}
        <div ref={bottomRef} />
      </div>
      <MessageInput socket={socket} selectedChat={selectedChat} setMessages={setMessages} />
    </div>
  );
}