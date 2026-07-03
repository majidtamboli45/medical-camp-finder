import { useState, useEffect } from 'react';
import { api } from '../services/api';
import SchemeCard from '../components/SchemeCard';
import { Search, Shield } from 'lucide-react';

export default function Schemes() {
  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', state: '' });

  useEffect(() => {
    api.getSchemeCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.state) params.state = filters.state;
    api.getSchemes(params).then(setSchemes).finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold">Government Healthcare Schemes</h1>
      </div>
      <p className="text-gray-500 mb-6">Discover free and subsidized government healthcare programs you may be eligible for</p>

      <div className="card mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search schemes..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="input-field pl-9"
          />
        </div>
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="input-field w-auto">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          placeholder="Filter by state"
          value={filters.state}
          onChange={e => setFilters({ ...filters, state: e.target.value })}
          className="input-field w-auto"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading schemes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map(s => <SchemeCard key={s.id} scheme={s} />)}
        </div>
      )}
    </div>
  );
}
