import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import "../index.css"; // Tailwind or other global styles
import { ChatProvider } from "../context/ChatContext";

export default function Chats() {

  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <ChatProvider user={user}>
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <ChatBox />
        </div>
      </div>
    </ChatProvider>

  );
}