import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Friends from './pages/Friends';
import Profile from './pages/Profile';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="app">
            <Navbar />
            <div className="main-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
                <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
                <Route path="/groups/:groupId" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
                <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
                <Route path="/events/:eventId" element={<PrivateRoute><EventDetails /></PrivateRoute>} />
                <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
            <ToastContainer 
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

