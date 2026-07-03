import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, Bus } from 'lucide-react';

export default function CampCard({ camp, showScore }) {
  const available = camp.available_slots ?? (camp.total_slots - camp.booked_slots);

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className="badge-blue">{camp.specialty}</span>
          {camp.is_free ? (
            <span className="badge-green">Free</span>
          ) : (
            <span className="badge-orange">₹{camp.cost}</span>
          )}
          {camp.transport_available && (
            <span className="badge bg-purple-100 text-purple-700">
              <Bus className="w-3 h-3 mr-1" /> Transport
            </span>
          )}
        </div>
        {showScore && camp.recommendation_score > 0 && (
          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
            {camp.recommendation_score}% match
          </span>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{camp.title}</h3>
      <p className="text-sm text-gray-500 mb-3">{camp.organizer}</p>

      <div className="space-y-1.5 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{camp.city} - {camp.address?.substring(0, 40)}...</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <span>{new Date(camp.camp_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400 shrink-0" />
          <span className={available < 20 ? 'text-orange-600 font-medium' : ''}>
            {available} slots available
          </span>
        </div>
      </div>

      {showScore && camp.match_reasons?.length > 0 && (
        <div className="mb-3 text-xs text-primary-600 bg-primary-50 rounded-lg p-2">
          {camp.match_reasons[0]}
        </div>
      )}

      <div className="flex gap-2">
        <Link to={`/camps/${camp.id}`} className="btn-primary flex-1 text-center text-sm">
          View Details
        </Link>
        {available > 0 && (
          <Link to={`/camps/${camp.id}/book`} className="btn-secondary text-sm">
            Book Slot
          </Link>
        )}
      </div>
    </div>
  );
}
