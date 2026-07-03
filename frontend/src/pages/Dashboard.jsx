import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Calendar, MapPin, Clock, XCircle, Bus, Sparkles, Bell, Shield
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    Promise.all([api.getMyBookings(), api.getNotifications()])
      .then(([b, n]) => { setBookings(b); setNotifications(n.slice(0, 5)); })
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    await api.cancelBooking(id);
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  if (authLoading || !user) return null;

  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.slot_date) >= new Date());
  const past = bookings.filter(b => b.status !== 'confirmed' || new Date(b.slot_date) < new Date());

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">Welcome, {user.name?.split(' ')[0]}!</h1>
      <p className="text-gray-500 mb-8">Your healthcare dashboard</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link to="/recommendations" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary-600" />
          <div><p className="font-semibold">For You</p><p className="text-xs text-gray-500">AI Recommendations</p></div>
        </Link>
        <Link to="/camps" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <Calendar className="w-8 h-8 text-health-600" />
          <div><p className="font-semibold">Find Camps</p><p className="text-xs text-gray-500">Browse all camps</p></div>
        </Link>
        <Link to="/schemes" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <Shield className="w-8 h-8 text-orange-600" />
          <div><p className="font-semibold">Govt Schemes</p><p className="text-xs text-gray-500">Free programs</p></div>
        </Link>
        <Link to="/notifications" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <Bell className="w-8 h-8 text-purple-600" />
          <div><p className="font-semibold">Notifications</p><p className="text-xs text-gray-500">Alerts & reminders</p></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Upcoming Bookings ({upcoming.length})</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : upcoming.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500 mb-4">No upcoming bookings</p>
              <Link to="/camps" className="btn-primary">Find a Camp</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map(b => (
                <div key={b.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{b.camp_title}</h3>
                      <p className="text-sm text-gray-500">{b.specialty} &middot; {b.organizer}</p>
                    </div>
                    <span className="badge-green">Confirmed</span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(b.slot_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {b.slot_time}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {b.city} - {b.address?.substring(0, 50)}</div>
                    {b.transport_available && (
                      <div className="flex items-center gap-2 text-purple-600"><Bus className="w-4 h-4" /> {b.transport_details}</div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/camps/${b.camp_id}`} className="btn-outline text-sm">View Camp</Link>
                    <button onClick={() => handleCancel(b.id)} className="text-sm text-red-600 hover:underline flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Recent Notifications</h2>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No notifications yet</p>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className={`card p-4 ${!n.is_read ? 'border-primary-200 bg-primary-50' : ''}`}>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              <Link to="/notifications" className="text-primary-600 text-sm hover:underline">View all</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
