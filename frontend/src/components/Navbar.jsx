import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Heart, Menu, X, Bell, User, LogOut, LayoutDashboard, Shield, Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      api.getUnreadCount().then(d => setUnread(d.count)).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/camps', label: 'Find Camps' },
    { to: '/schemes', label: 'Govt Schemes' },
    { to: '/ai-search', label: 'AI Search', icon: Sparkles },
    ...(user ? [{ to: '/recommendations', label: 'For You' }] : []),
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="font-bold text-lg text-gray-900 hidden sm:block">
                Medical Camp Finder
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} className="text-gray-600 hover:text-primary-600 font-medium text-sm flex items-center gap-1">
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-primary-600">
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </Link>
                <Link to="/dashboard" className="hidden sm:flex items-center gap-1 text-gray-600 hover:text-primary-600 text-sm font-medium">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="hidden sm:flex items-center gap-1 text-gray-600 hover:text-primary-600 text-sm font-medium">
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link to="/profile" className="hidden sm:flex items-center gap-1 text-gray-600 hover:text-primary-600 text-sm font-medium">
                  <User className="w-4 h-4" /> {user.name?.split(' ')[0]}
                </Link>
                <button onClick={handleLogout} className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-red-600 text-sm">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </>
            )}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="block py-2 text-gray-600 font-medium" onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user && (
            <>
              <Link to="/dashboard" className="block py-2 text-gray-600 font-medium" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/profile" className="block py-2 text-gray-600 font-medium" onClick={() => setMenuOpen(false)}>Profile</Link>
              {isAdmin && <Link to="/admin" className="block py-2 text-gray-600 font-medium" onClick={() => setMenuOpen(false)}>Admin</Link>}
              <button onClick={handleLogout} className="block py-2 text-red-600 font-medium w-full text-left">Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
