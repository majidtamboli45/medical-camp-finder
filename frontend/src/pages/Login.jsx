import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      // Admin goes directly to admin page, others to the unified dashboard
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Login to access your healthcare dashboard</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? <Link to="/register" className="text-primary-600 font-medium">Register</Link>
        </p>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-semibold mb-1">Demo Accounts:</p>
          <p><span className="font-medium text-gray-700">Patient:</span> rahul@email.com / patient123</p>
          <p><span className="font-medium text-gray-700">NGO:</span> Create one in registration or use existing</p>
          <p><span className="font-medium text-gray-700">Admin:</span> admin@medcamp.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
