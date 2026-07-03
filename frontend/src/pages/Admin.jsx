import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, Plus, Users, Calendar, FileText } from 'lucide-react';

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [camps, setCamps] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', organizer: '', organizer_type: 'NGO', specialty: '',
    services: '', city: '', address: '', pincode: '', camp_date: '', is_free: true,
    cost: 0, total_slots: 100, transport_available: false, transport_details: '', contact_phone: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/dashboard'); return; }
    loadData();
  }, [user, isAdmin, authLoading, navigate]);

  const loadData = () => {
    api.getAdminStats().then(setStats);
    api.getAdminCamps().then(setCamps);
    api.getAdminBookings().then(setBookings);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      services: form.services.split(',').map(s => s.trim()).filter(Boolean),
      is_free: form.is_free,
      cost: form.is_free ? 0 : form.cost,
    };
    await api.createCamp(data);
    setShowForm(false);
    setForm({ title: '', description: '', organizer: '', organizer_type: 'NGO', specialty: '', services: '', city: '', address: '', pincode: '', camp_date: '', is_free: true, cost: 0, total_slots: 100, transport_available: false, transport_details: '', contact_phone: '' });
    loadData();
  };

  if (authLoading || !isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {['stats', 'camps', 'bookings'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Camps', value: stats.total_camps, icon: Calendar, color: 'text-primary-600' },
            { label: 'Patients', value: stats.total_users, icon: Users, color: 'text-health-600' },
            { label: 'Bookings', value: stats.total_bookings, icon: FileText, color: 'text-orange-600' },
            { label: 'Govt Schemes', value: stats.total_schemes, icon: Shield, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-4">
              <s.icon className={`w-10 h-10 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'camps' && (
        <div>
          <div className="flex justify-between mb-4">
            <p className="text-gray-500">{camps.length} camps</p>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Camp
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="card mb-6 space-y-3">
              <h3 className="font-semibold">Add New Camp</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field col-span-2" required />
                <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field col-span-2" rows={2} />
                <input placeholder="Organizer" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} className="input-field" required />
                <select value={form.organizer_type} onChange={e => setForm({ ...form, organizer_type: e.target.value })} className="input-field">
                  <option value="NGO">NGO</option><option value="Hospital">Hospital</option>
                  <option value="Government">Government</option><option value="Diagnostic">Diagnostic</option>
                </select>
                <input placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="input-field" required />
                <input placeholder="Services (comma separated)" value={form.services} onChange={e => setForm({ ...form, services: e.target.value })} className="input-field" />
                <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" required />
                <input placeholder="Pincode" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="input-field" />
                <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field col-span-2" required />
                <input type="date" value={form.camp_date} onChange={e => setForm({ ...form, camp_date: e.target.value })} className="input-field" required />
                <input type="number" placeholder="Total Slots" value={form.total_slots} onChange={e => setForm({ ...form, total_slots: +e.target.value })} className="input-field" />
                <input placeholder="Contact Phone" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} className="input-field" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_free} onChange={e => setForm({ ...form, is_free: e.target.checked })} /> Free camp</label>
                {!form.is_free && <input type="number" placeholder="Cost (₹)" value={form.cost} onChange={e => setForm({ ...form, cost: +e.target.value })} className="input-field" />}
                <label className="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" checked={form.transport_available} onChange={e => setForm({ ...form, transport_available: e.target.checked })} /> Transport available</label>
                {form.transport_available && <input placeholder="Transport details" value={form.transport_details} onChange={e => setForm({ ...form, transport_details: e.target.value })} className="input-field col-span-2" />}
              </div>
              <button type="submit" className="btn-primary">Create Camp</button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">Title</th><th className="py-2 pr-4">City</th><th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Slots</th><th className="py-2">Status</th>
              </tr></thead>
              <tbody>
                {camps.map(c => (
                  <tr key={c.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{c.title}</td>
                    <td className="py-3 pr-4">{c.city}</td>
                    <td className="py-3 pr-4">{c.camp_date}</td>
                    <td className="py-3 pr-4">{c.booked_slots}/{c.total_slots}</td>
                    <td className="py-3"><span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-orange'}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">Patient</th><th className="py-2 pr-4">Camp</th>
              <th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Time</th><th className="py-2">Status</th>
            </tr></thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b">
                  <td className="py-3 pr-4">{b.patient_name}<br /><span className="text-gray-400">{b.user_name}</span></td>
                  <td className="py-3 pr-4">{b.camp_title}</td>
                  <td className="py-3 pr-4">{b.slot_date}</td>
                  <td className="py-3 pr-4">{b.slot_time}</td>
                  <td className="py-3"><span className={`badge ${b.status === 'confirmed' ? 'badge-green' : 'badge-orange'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
