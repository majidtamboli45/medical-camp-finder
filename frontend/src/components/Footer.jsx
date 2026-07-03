import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="font-bold text-white">Medical Camp Finder</span>
            </div>
            <p className="text-sm text-gray-400">
              AI-powered platform helping patients discover free and affordable healthcare camps, diagnostic services, and government schemes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/camps" className="hover:text-white">Find Camps</Link></li>
              <li><Link to="/schemes" className="hover:text-white">Government Schemes</Link></li>
              <li><Link to="/ai-search" className="hover:text-white">AI Search</Link></li>
              <li><Link to="/recommendations" className="hover:text-white">Recommendations</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>Camp Discovery</li>
              <li>Slot Booking</li>
              <li>Transport Assistance</li>
              <li>Personalized Notifications</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Technology</h4>
            <ul className="space-y-2 text-sm">
              <li>AI & NLP Processing</li>
              <li>Recommendation Engine</li>
              <li>Location-based Services</li>
              <li>Data Analytics</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          &copy; 2026 Medical Camp Finder. Built for healthcare accessibility.
        </div>
      </div>
    </footer>
  );
}
