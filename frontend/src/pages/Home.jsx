import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import CampCard from '../components/CampCard';
import {
  Search, MapPin, Sparkles, Heart, Shield, Bell, Bus, Calendar,
  ArrowRight, Stethoscope, Brain, Users
} from 'lucide-react';

export default function Home() {
  const [camps, setCamps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ camps: 0, cities: 0 });

  useEffect(() => {
    api.getCamps({ is_free: 'true' }).then(data => {
      setCamps(data.slice(0, 6));
      setStats(s => ({ ...s, camps: data.length }));
    });
    api.getCities().then(cities => setStats(s => ({ ...s, cities: cities.length })));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/ai-search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const features = [
    { icon: Sparkles, title: 'AI-Powered Search', desc: 'Natural language search to find camps by symptoms, location, or budget' },
    { icon: Heart, title: 'Smart Recommendations', desc: 'Personalized camp suggestions based on your health needs and location' },
    { icon: Calendar, title: 'Online Booking', desc: 'Book appointment slots instantly with real-time availability' },
    { icon: Bus, title: 'Transport Help', desc: 'Find camps with free pickup and shuttle services' },
    { icon: Shield, title: 'Govt Schemes', desc: 'Discover government healthcare schemes you are eligible for' },
    { icon: Bell, title: 'Notifications', desc: 'Get alerts for new camps near you and booking reminders' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Brain className="w-4 h-4" /> AI-Powered Healthcare Discovery
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Find Free & Affordable<br />Medical Camps Near You
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto mb-8">
            Discover healthcare camps, diagnostic services, and government schemes.
            AI-driven recommendations help you access quality healthcare at low or no cost.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Try "free eye checkup in Mumbai" or "diabetes camp near me"'
                className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <button type="submit" className="bg-health-500 hover:bg-health-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Search
            </button>
          </form>

          <div className="flex justify-center gap-8 mt-10 text-primary-100">
            <div><span className="text-3xl font-bold text-white">{stats.camps}+</span><br />Free Camps</div>
            <div><span className="text-3xl font-bold text-white">{stats.cities}+</span><br />Cities</div>
            <div><span className="text-3xl font-bold text-white">8+</span><br />Govt Schemes</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">How It Works</h2>
        <p className="text-gray-500 text-center mb-10">AI, NLP, and data analytics power your healthcare discovery</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Camps */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">Upcoming Free Camps</h2>
              <p className="text-gray-500">Book your slot before they fill up</p>
            </div>
            <Link to="/camps" className="btn-secondary text-sm flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {camps.map(camp => <CampCard key={camp.id} camp={camp} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="card bg-primary-50 border-primary-200">
          <Stethoscope className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Get Personalized Recommendations</h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Create a free account, set your health preferences, and let our AI recommend the best camps for you.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn-primary">Create Free Account</Link>
            <Link to="/recommendations" className="btn-secondary">View Recommendations</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
