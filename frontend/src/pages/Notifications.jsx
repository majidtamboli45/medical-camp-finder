import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Bell, CheckCheck } from 'lucide-react';

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    api.getNotifications().then(setNotifications).finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const markRead = async (id) => {
    await api.markAsRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  const markAllRead = async () => {
    await api.markAllAsRead();
    setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
  };

  if (authLoading || !user) return null;

  const typeColors = {
    success: 'border-health-200 bg-health-50',
    reminder: 'border-orange-200 bg-orange-50',
    info: 'border-primary-200 bg-primary-50',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllRead} className="text-sm text-primary-600 flex items-center gap-1 hover:underline">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">No notifications yet</div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`card p-4 cursor-pointer ${!n.is_read ? (typeColors[n.type] || typeColors.info) : ''}`}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div className="flex justify-between items-start">
                <p className="font-medium">{n.title}</p>
                {!n.is_read && <span className="w-2 h-2 bg-primary-600 rounded-full shrink-0 mt-2" />}
              </div>
              <p className="text-sm text-gray-600 mt-1">{n.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(n.created_at).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
