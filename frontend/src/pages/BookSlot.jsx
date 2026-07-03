import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function BookSlot() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [camp, setCamp] = useState(null);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({
    slot_date: '', slot_time: '', patient_name: '', patient_age: '', patient_gender: '', medical_concern: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.getCamp(id).then(c => {
      setCamp(c);
      setForm(f => ({ ...f, slot_date: c.camp_date, patient_name: user.name || '' }));
    });
  }, [id, user, navigate]);

  useEffect(() => {
    if (form.slot_date) {
      api.getSlots(id, form.slot_date).then(d => setSlots(d.slots));
    }
  }, [id, form.slot_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.slot_time) { setError('Please select a time slot'); return; }
    setError('');
    setLoading(true);
    try {
      await api.createBooking({ camp_id: +id, ...form, patient_age: +form.patient_age || null });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (!camp) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-health-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 mb-6">Your slot at {camp.title} has been booked successfully.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/dashboard" className="btn-primary">View Dashboard</Link>
          <Link to={`/camps/${id}`} className="btn-outline">Back to Camp</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link to={`/camps/${id}`} className="inline-flex items-center gap-1 text-primary-600 text-sm mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="card">
        <h1 className="text-xl font-bold mb-1">Book a Slot</h1>
        <p className="text-gray-500 text-sm mb-6">{camp.title}</p>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" value={form.slot_date} onChange={e => setForm({ ...form, slot_date: e.target.value, slot_time: '' })} className="input-field" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Time Slot</label>
            <div className="grid grid-cols-4 gap-2">
              {slots.map(s => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setForm({ ...form, slot_time: s.time })}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.slot_time === s.time
                      ? 'bg-primary-600 text-white border-primary-600'
                      : s.available
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Patient Name</label>
            <input value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input type="number" value={form.patient_age} onChange={e => setForm({ ...form, patient_age: e.target.value })} className="input-field" min={0} max={120} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select value={form.patient_gender} onChange={e => setForm({ ...form, patient_gender: e.target.value })} className="input-field">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Medical Concern (optional)</label>
            <textarea value={form.medical_concern} onChange={e => setForm({ ...form, medical_concern: e.target.value })} className="input-field" rows={3} placeholder="Describe your health concern..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
