import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Users, 
  CalendarDays, 
  UserCircle, 
  LogOut, 
  Bell,
  Menu,
  X 
} from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) return null;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Calendar },
    { path: '/calendar', label: 'Kalendarz', icon: CalendarDays },
    { path: '/groups', label: 'Grupy', icon: Users },
    { path: '/events', label: 'Wydarzenia', icon: Calendar },
    { path: '/friends', label: 'Znajomi', icon: UserCircle },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Calendar size={28} />
          <span>Meeting Scheduler</span>
        </Link>

        <button 
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="navbar-links">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`navbar-link ${location.pathname === path ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="navbar-actions">
            <Link to="/profile" className="navbar-action">
              <Bell size={20} />
            </Link>
            <div className="navbar-user">
              <Link to="/profile" className="navbar-user-link">
                <UserCircle size={20} />
                <span>{user?.username || 'Profil'}</span>
              </Link>
            </div>
            <button onClick={logout} className="navbar-logout">
              <LogOut size={20} />
              <span>Wyloguj</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

