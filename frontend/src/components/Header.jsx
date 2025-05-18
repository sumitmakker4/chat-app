import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="bg-indigo-600 text-white flex justify-between items-center px-6 py-3 shadow-md">
      <h1 className="text-xl font-bold">ChatApp</h1>
      <span>Hey {user?.name}</span>
      <button onClick={logout} className="bg-white text-[#3b5998] px-3 py-1 rounded hover:bg-gray-200">Logout</button>
    </header>
  );
}