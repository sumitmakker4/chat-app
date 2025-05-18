import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivateRoute from './components/PrivateRoute';
import Chats from './pages/Chats';

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
          path="/"
          element={
            <PrivateRoute>
              <Chats />
            </PrivateRoute>
          }
        />
    </Routes>
  );
}

export default App;