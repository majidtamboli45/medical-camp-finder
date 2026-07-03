import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MEDICAL_NEEDS = [
  { id: 'general', label: 'General Checkup' },
  { id: 'eye', label: 'Eye Care' },
  { id: 'dental', label: 'Dental' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'heart', label: 'Heart' },
  { id: 'women', label: 'Women Health' },
  { id: 'child', label: 'Child Health' },
  { id: 'cancer', label: 'Cancer' },
  { id: 'bone', label: 'Bone & Joint' },
  { id: 'mental', label: 'Mental Health' },
  { id: 'blood', label: 'Blood Tests' },
  { id: 'kidney', label: 'Kidney' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '', pincode: '', max_budget: 0,
    medical_needs: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleNeed = (id) => {
    setForm(f => ({
      ...f,
      medical_needs: f.medical_needs.includes(id)
        ? f.medical_needs.filter(n => n !== id)
        : [...f.medical_needs, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="card w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Join to get personalized camp recommendations</p>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" placeholder="Mumbai" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincode</label>
              <input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="input-field" placeholder="400001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Budget (₹)</label>
              <input type="number" value={form.max_budget} onChange={e => setForm({ ...form, max_budget: +e.target.value })} className="input-field" min={0} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Medical Interests (for AI recommendations)</label>
            <div className="flex flex-wrap gap-2">
              {MEDICAL_NEEDS.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => toggleNeed(n.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.medical_needs.includes(n.id)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-primary-600 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}
