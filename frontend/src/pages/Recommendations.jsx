import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CampCard from '../components/CampCard';
import { Sparkles, Settings } from 'lucide-react';

export default function Recommendations() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    api.getRecommendations()
      .then(setRecommendations)
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold">Recommended For You</h1>
      </div>
      <p className="text-gray-500 mb-6">
        AI-powered recommendations based on your location ({user.city || 'not set'}),
        medical interests, and budget preferences.
      </p>

      {!user.city && (
        <div className="card bg-yellow-50 border-yellow-200 mb-6 flex items-center justify-between">
          <p className="text-sm text-yellow-800">Set your city and medical preferences for better recommendations.</p>
          <Link to="/profile" className="btn-outline text-sm flex items-center gap-1">
            <Settings className="w-4 h-4" /> Update Profile
          </Link>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Analyzing your preferences...</div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No recommendations yet. Update your profile preferences.</p>
          <Link to="/profile" className="btn-primary">Update Profile</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map(camp => <CampCard key={camp.id} camp={camp} showScore />)}
        </div>
      )}
    </div>
  );
}
