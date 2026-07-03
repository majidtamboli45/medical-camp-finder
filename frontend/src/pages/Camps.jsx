import { useState, useEffect } from 'react';
import { api } from '../services/api';
import CampCard from '../components/CampCard';
import { Search, Filter } from 'lucide-react';

export default function Camps() {
  const [camps, setCamps] = useState([]);
  const [cities, setCities] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '', city: '', specialty: '', is_free: '', transport: '',
  });

  useEffect(() => {
    Promise.all([api.getCities(), api.getSpecialties()]).then(([c, s]) => {
      setCities(c);
      setSpecialties(s);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.city) params.city = filters.city;
    if (filters.specialty) params.specialty = filters.specialty;
    if (filters.is_free) params.is_free = 'true';
    if (filters.transport) params.transport = 'true';

    api.getCamps(params)
      .then(setCamps)
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Find Medical Camps</h1>
      <p className="text-gray-500 mb-6">Discover free and affordable healthcare camps near you</p>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search camps..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="input-field pl-9"
            />
          </div>
          <select value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} className="input-field w-auto">
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.specialty} onChange={e => setFilters({ ...filters, specialty: e.target.value })} className="input-field w-auto">
            <option value="">All Specialties</option>
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filters.is_free === 'true'} onChange={e => setFilters({ ...filters, is_free: e.target.checked ? 'true' : '' })} />
            Free only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filters.transport === 'true'} onChange={e => setFilters({ ...filters, transport: e.target.checked ? 'true' : '' })} />
            With transport
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading camps...</div>
      ) : camps.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No camps found matching your criteria.</div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{camps.length} camp{camps.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {camps.map(camp => <CampCard key={camp.id} camp={camp} />)}
          </div>
        </>
      )}
    </div>
  );
}
