import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import CampCard from '../components/CampCard';
import { Sparkles, Search, Brain } from 'lucide-react';

const SUGGESTIONS = [
  'Free eye checkup in Mumbai',
  'Diabetes screening camp near Delhi',
  'Affordable blood test in Bangalore under 200',
  'Women health camp with transport',
  'Free vaccination for children',
  'Cardiac screening camp this week',
];

export default function AISearch() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await api.aiSearch(q);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); doSearch(q); }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 rounded-full px-4 py-1.5 text-sm mb-4">
          <Brain className="w-4 h-4" /> NLP-Powered Search
        </div>
        <h1 className="text-3xl font-bold mb-2">AI Medical Camp Search</h1>
        <p className="text-gray-500">Search in natural language — our NLP engine understands medical terms, locations, and affordability</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='e.g. "free cataract screening in Mumbai with transport"'
            className="input-field pl-10 py-3"
          />
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2 px-6">
          <Sparkles className="w-5 h-5" /> Search
        </button>
      </form>

      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => { setQuery(s); doSearch(s); }} className="text-xs bg-gray-100 hover:bg-primary-50 text-gray-600 hover:text-primary-600 px-3 py-1.5 rounded-full">
            {s}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Analyzing your query with NLP...</div>}

      {result && !loading && (
        <>
          <div className="card bg-primary-50 border-primary-200 mb-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-sm mb-2">AI Query Analysis</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Intent:</span> <span className="font-medium">{result.analysis.intent}</span></div>
              <div><span className="text-gray-500">Specialties:</span> <span className="font-medium">{result.analysis.specialties.join(', ') || 'Any'}</span></div>
              <div><span className="text-gray-500">Location:</span> <span className="font-medium">{result.analysis.city || result.analysis.pincode || 'Any'}</span></div>
              <div><span className="text-gray-500">Free only:</span> <span className="font-medium">{result.analysis.isFree ? 'Yes' : 'No'}</span></div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">{result.result_count} camp{result.result_count !== 1 ? 's' : ''} found</p>

          {result.results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No camps match your query. Try different keywords.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.results.map(camp => <CampCard key={camp.id} camp={camp} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
