import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const ChatContext = createContext();

export const ChatProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});  // chatId -> userId typing

  useEffect(() => {
    if (!user) return;

    const s = io(import.meta.env.VITE_API_URL, {
      query: { userId: user.id },
    });

    setSocket(s);

    s.emit('user-online', user.id);

    s.on('online-users', (users) => {
      setOnlineUsers(users.map(u => u.id.toString()));
    });

    s.on('typing', ({ chatId, userId }) => {
      setTypingUsers((prev) => ({ ...prev, [chatId]: userId }));
    });

    s.on('stop-typing', ({ chatId, userId }) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        if (copy[chatId] === userId) {
          delete copy[chatId];
        }
        return copy;
      });
    });

    return () => {
      s.disconnect();
      setSocket(null);
      setOnlineUsers([]);
      setTypingUsers({});
    };
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        onlineUsers,
        typingUsers,
        selectedChat,
        setSelectedChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);