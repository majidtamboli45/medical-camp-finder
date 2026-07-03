import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Building2, ExternalLink } from 'lucide-react';

export default function SchemeDetail() {
  const { id } = useParams();
  const [scheme, setScheme] = useState(null);

  useEffect(() => {
    api.getScheme(id).then(setScheme);
  }, [id]);

  if (!scheme) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/schemes" className="inline-flex items-center gap-1 text-primary-600 text-sm mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to schemes
      </Link>

      <div className="card">
        <span className="badge-blue mb-3">{scheme.category}</span>
        <h1 className="text-2xl font-bold mb-2">{scheme.name}</h1>
        <div className="flex items-center gap-2 text-gray-500 mb-6">
          <Building2 className="w-4 h-4" /> {scheme.government_body} &middot; {scheme.state}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{scheme.description}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Eligibility</h3>
            <p className="text-gray-700">{scheme.eligibility}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Benefits</h3>
            <p className="text-gray-700">{scheme.benefits}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How to Apply</h3>
            <p className="text-gray-700">{scheme.application_process}</p>
          </div>
        </div>

        {scheme.website && (
          <a href={scheme.website} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex items-center gap-2">
            Visit Official Website <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
