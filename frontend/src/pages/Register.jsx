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
  const [role, setRole] = useState('patient'); // 'patient' or 'ngo'
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '', pincode: '', max_budget: 0,
    medical_needs: [], license_number: '', org_type: 'NGO', description: '',
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
      // Send the appropriate fields based on the role
      const payload = {
        ...form,
        role,
        ...(role === 'ngo' ? {
          medical_needs: [],
          max_budget: 0,
        } : {
          license_number: '',
          description: '',
        })
      };
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="card w-full max-w-lg shadow-xl border border-gray-100 bg-white p-6 rounded-2xl">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Join Sehat Saathi / Swasthya Setu network</p>

        {/* Role Toggle Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setRole('patient'); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              role === 'patient'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Register as Patient
          </button>
          <button
            type="button"
            onClick={() => { setRole('ngo'); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              role === 'ngo'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            NGO / Hospital
          </button>
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm p-3.5 rounded-r-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {role === 'patient' ? 'Full Name' : 'Organization Name'}
              </label>
              <input 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                className="input-field" 
                placeholder={role === 'patient' ? 'e.g. Rahul Sharma' : 'e.g. LifeCare Foundation'} 
                required 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="name@domain.com" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="••••••••" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="e.g. 9876543210" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" placeholder="e.g. Mumbai" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode</label>
              <input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="input-field" placeholder="e.g. 400001" />
            </div>

            {role === 'patient' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Max Budget (₹)</label>
                <input type="number" value={form.max_budget} onChange={e => setForm({ ...form, max_budget: +e.target.value })} className="input-field" min={0} />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Organization Type</label>
                <select value={form.org_type} onChange={e => setForm({ ...form, org_type: e.target.value })} className="input-field">
                  <option value="NGO">NGO</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Clinic">Clinic</option>
                  <option value="Diagnostic">Diagnostic Center</option>
                </select>
              </div>
            )}

            {role === 'ngo' && (
              <>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">License / Reg Number</label>
                  <input value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} className="input-field" placeholder="e.g. REG-12345-MH" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Brief Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Tell us about your healthcare services..." rows={2} />
                </div>
              </>
            )}
          </div>

          {role === 'patient' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Interests (for recommendations)</label>
              <div className="flex flex-wrap gap-2">
                {MEDICAL_NEEDS.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => toggleNeed(n.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      form.medical_needs.includes(n.id)
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
