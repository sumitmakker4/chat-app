import { useRef } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const ChatContext = createContext();

export const ChatProvider = ({ children, user }) => {

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);

  const selectedChatRef = useRef(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (!user) return;

    const s = io(import.meta.env.VITE_API_URL);
    setSocket(s);

    s.emit('user-online', user.id);

    s.on('online-users', (users) => {
      const onlineIds = users.map((u) => u.id);
      setOnlineUsers(onlineIds);
    });

    s.on('typing', ({ from }) => {
      setTypingUsers((prev) => ({ ...prev, [from]: true }));
    });

    s.on('stop-typing', ({ from }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[from];
        return updated;
      });
    });

    s.on('message-received', (message) => {          
      const selected = selectedChatRef.current;
      const isFromSelectedUser =
        selected && (message.sender === selected.id || message.receiver === selected.id);

      if (isFromSelectedUser) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
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
        selectedChat,
        setSelectedChat,
        onlineUsers,
        typingUsers,
        chats,
        setChats,
        messages,
        setMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);