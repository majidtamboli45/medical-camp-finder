import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const MEDICAL_NEEDS = [
  { id: 'general', label: 'General Checkup' }, { id: 'eye', label: 'Eye Care' },
  { id: 'dental', label: 'Dental' }, { id: 'diabetes', label: 'Diabetes' },
  { id: 'heart', label: 'Heart' }, { id: 'women', label: 'Women Health' },
  { id: 'child', label: 'Child Health' }, { id: 'cancer', label: 'Cancer' },
  { id: 'bone', label: 'Bone & Joint' }, { id: 'mental', label: 'Mental Health' },
  { id: 'blood', label: 'Blood Tests' }, { id: 'kidney', label: 'Kidney' },
];

export default function Profile() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    setForm({
      name: user.name || '', phone: user.phone || '', city: user.city || '',
      pincode: user.pincode || '', max_budget: user.max_budget || 0,
      medical_needs: user.medical_needs || [],
    });
  }, [user, authLoading, navigate]);

  const toggleNeed = (id) => {
    setForm(f => ({
      ...f,
      medical_needs: f.medical_needs.includes(id)
        ? f.medical_needs.filter(n => n !== id)
        : [...f.medical_needs, id],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile(form);
      updateUser(updated);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user || !form) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      {message && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('success') ? 'bg-health-50 text-health-700' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input value={user.email} disabled className="input-field bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pincode</label>
            <input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Budget (₹, 0 = free only)</label>
          <input type="number" value={form.max_budget} onChange={e => setForm({ ...form, max_budget: +e.target.value })} className="input-field" min={0} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Medical Interests</label>
          <div className="flex flex-wrap gap-2">
            {MEDICAL_NEEDS.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => toggleNeed(n.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.medical_needs.includes(n.id)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
