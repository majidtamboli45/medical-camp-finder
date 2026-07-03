import { Link } from 'react-router-dom';
import { Building2, ExternalLink } from 'lucide-react';

export default function SchemeCard({ scheme }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="badge-blue">{scheme.category}</span>
        <span className="text-xs text-gray-500">{scheme.state}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{scheme.name}</h3>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <Building2 className="w-4 h-4" />
        {scheme.government_body}
      </div>
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{scheme.description}</p>
      <Link to={`/schemes/${scheme.id}`} className="btn-primary text-sm inline-flex items-center gap-1">
        Learn More <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
