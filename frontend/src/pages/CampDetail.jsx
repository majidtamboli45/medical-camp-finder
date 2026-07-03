import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  MapPin, Calendar, Clock, Phone, Bus, Users, IndianRupee, ArrowLeft, ExternalLink
} from 'lucide-react';

export default function CampDetail() {
  const { id } = useParams();
  const [camp, setCamp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCamp(id).then(setCamp).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  if (!camp) return <div className="text-center py-20 text-gray-500">Camp not found</div>;

  const available = camp.available_slots ?? (camp.total_slots - camp.booked_slots);
  const mapUrl = camp.latitude && camp.longitude
    ? `https://www.google.com/maps?q=${camp.latitude},${camp.longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(camp.address + ', ' + camp.city)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/camps" className="inline-flex items-center gap-1 text-primary-600 text-sm mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to camps
      </Link>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="badge-blue">{camp.specialty}</span>
          <span className="badge bg-gray-100 text-gray-700">{camp.organizer_type}</span>
          {camp.is_free ? <span className="badge-green">Free</span> : <span className="badge-orange">₹{camp.cost}</span>}
          {camp.transport_available && <span className="badge bg-purple-100 text-purple-700">Transport Available</span>}
        </div>

        <h1 className="text-2xl font-bold mb-2">{camp.title}</h1>
        <p className="text-gray-500 mb-4">Organized by {camp.organizer}</p>
        <p className="text-gray-700 mb-6">{camp.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-sm text-gray-600">
                {new Date(camp.camp_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium">Time</p>
              <p className="text-sm text-gray-600">{camp.start_time} - {camp.end_time}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-sm text-gray-600">{camp.address}, {camp.city} - {camp.pincode}</p>
              <a href={mapUrl} target="_blank" rel="noreferrer" className="text-primary-600 text-sm inline-flex items-center gap-1 mt-1">
                Open in Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="font-medium">Availability</p>
              <p className={`text-sm ${available < 20 ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                {available} of {camp.total_slots} slots available
              </p>
            </div>
          </div>
          {camp.contact_phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="font-medium">Contact</p>
                <p className="text-sm text-gray-600">{camp.contact_phone}</p>
              </div>
            </div>
          )}
        </div>

        {camp.transport_available && camp.transport_details && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 font-medium text-purple-800 mb-1">
              <Bus className="w-5 h-5" /> Transport Assistance
            </div>
            <p className="text-sm text-purple-700">{camp.transport_details}</p>
          </div>
        )}

        {camp.services?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Services Offered</h3>
            <div className="flex flex-wrap gap-2">
              {camp.services.map((s, i) => (
                <span key={i} className="badge bg-gray-100 text-gray-700">{s}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {available > 0 ? (
            <Link to={`/camps/${camp.id}/book`} className="btn-primary">Book a Slot</Link>
          ) : (
            <button disabled className="btn-primary opacity-50">Fully Booked</button>
          )}
          <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-outline">Get Directions</a>
        </div>
      </div>
    </div>
  );
}
