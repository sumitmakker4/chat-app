import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { selectedChat, setSelectedChat, onlineUsers, typingUsers } = useContext(ChatContext);
  const [chatUsers, setChatUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChatUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/chat-users/${user.id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        setChatUsers(data);
      } catch (err) {
        console.error('Error loading chat users', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatUsers();
  }, [user]);

  function ChatItem({ user }) {
    const isOnline = onlineUsers.includes(user.id);
    const isTyping = typingUsers[user.id];

    return (
      <li
        key={user.id}
        onClick={() => setSelectedChat(user)}
        className={`cursor-pointer p-3 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-between ${
          selectedChat?.id === user.id ? 'bg-blue-100' : ''
        }`}
      >
        <div>
          <div className="font-semibold flex items-center space-x-2">
            <span
              title={isOnline ? 'Online' : 'Offline'}
              className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
            ></span>
            <span>{user.name}</span>
          </div>
          <div className="text-sm text-gray-500">
            {isTyping && <span className="italic text-blue-500">Typing...</span>}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className="w-1/5 border-r p-4 overflow-y-auto">
      {loading ? (
        <div className="text-sm text-gray-500 animate-pulse">Loading chats...</div>
      ) : chatUsers.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul className="space-y-2">
          {chatUsers.map((chat_user) => (
            <ChatItem key={chat_user.id} user={chat_user} />
          ))}
        </ul>
      )}
    </div>
  );
}