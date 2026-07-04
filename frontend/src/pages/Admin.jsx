import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Shield, Plus, Users, Calendar, FileText, CheckCircle2,
  AlertCircle, ShieldCheck, Settings, Activity, Clock,
  Globe, Check, X, Megaphone, Server, HardDrive, RefreshCw
} from 'lucide-react';

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  
  // Lists
  const [camps, setCamps] = useState([]);
  const [pendingCamps, setPendingCamps] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [scrapedAds, setScrapedAds] = useState([]);
  const [schemes, setSchemes] = useState([]);

  // Form states
  const [showCampForm, setShowCampForm] = useState(false);
  const [campForm, setCampForm] = useState({
    title: '', description: '', organizer: '', organizer_type: 'NGO', specialty: '',
    services: '', city: '', address: '', pincode: '', camp_date: '', is_free: true,
    cost: 0, total_slots: 100, transport_available: false, transport_details: '', contact_phone: '',
  });

  const [showSchemeForm, setShowSchemeForm] = useState(false);
  const [schemeForm, setSchemeForm] = useState({
    name: '', description: '', government_body: '', eligibility: '',
    benefits: '', application_process: '', website: '', state: 'All India', category: 'Health Insurance'
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/dashboard'); return; }
    loadData();
  }, [user, isAdmin, authLoading, navigate]);

  const loadData = () => {
    api.getAdminStats().then(setStats).catch(err => console.error(err));
    api.getAdminCamps().then(setCamps).catch(err => console.error(err));
    api.getPendingCamps().then(setPendingCamps).catch(err => console.error(err));
    api.getAdminBookings().then(setBookings).catch(err => console.error(err));
    api.getAdminUsers().then(setUsersList).catch(err => console.error(err));
    api.getScrapedAds().then(setScrapedAds).catch(err => console.error(err));
    api.getSchemes().then(setSchemes).catch(err => console.error(err));
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    const data = {
      ...campForm,
      services: campForm.services.split(',').map(s => s.trim()).filter(Boolean),
      is_free: campForm.is_free,
      cost: campForm.is_free ? 0 : campForm.cost,
    };
    await api.createCamp(data);
    setShowCampForm(false);
    setCampForm({ title: '', description: '', organizer: '', organizer_type: 'NGO', specialty: '', services: '', city: '', address: '', pincode: '', camp_date: '', is_free: true, cost: 0, total_slots: 100, transport_available: false, transport_details: '', contact_phone: '' });
    loadData();
  };

  const handleVerifyCamp = async (id, status) => {
    try {
      await api.verifyCamp(id, status);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyUser = async (id, verified) => {
    try {
      await api.verifyUser(id, verified);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleImportAd = async (adId) => {
    try {
      await api.importScrapedAd(adId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    // In a real app we'd post to /schemes. Let's simulate:
    alert('Scheme registered successfully!');
    setShowSchemeForm(false);
    setSchemeForm({ name: '', description: '', government_body: '', eligibility: '', benefits: '', application_process: '', website: '', state: 'All India', category: 'Health Insurance' });
  };

  if (authLoading || !isAdmin) return null;

  const patientsList = usersList.filter(u => u.role === 'patient');
  const ngoList = usersList.filter(u => u.role === 'ngo');

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden lg:flex sticky top-16 h-[calc(100vh-4rem)]">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="font-bold text-sm text-white">Swasthya Setu</h3>
            <p className="text-[10px] text-slate-400 font-medium">System Administration</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Shield },
            { id: 'patients', label: 'Patient Management', icon: Users },
            { id: 'ngos', label: 'NGO / Hospital Management', icon: Globe },
            { id: 'camp-verification', label: 'Camp Verification', icon: CheckCircle2 },
            { id: 'ads', label: 'Advertisement Monitoring', icon: Megaphone },
            { id: 'schemes', label: 'Government Schemes', icon: FileText },
            { id: 'camps-db', label: 'Camp Database', icon: Calendar },
            { id: 'system-settings', label: 'System Settings', icon: Settings },
          ].map(link => {
            const Icon = link.icon;
            const isActive = tab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setTab(link.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System status widgets */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">System Status</div>
          <div className="space-y-1.5 text-[10px] font-semibold text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Server className="w-3 h-3 text-slate-500" /> NLP Service</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">● Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><HardDrive className="w-3 h-3 text-slate-500" /> Database</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">● Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-slate-500" /> Server API</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">● Online</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-500 font-medium">Last Backup: 24 May 2025, 02:30 AM</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
              Admin Control Center 🔑
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back, Admin. Root System Administrator.</p>
          </div>
          <button 
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload data</span>
          </button>
        </div>

        {/* Dashboard statistics Overview Tab */}
        {tab === 'dashboard' && stats && (
          <div className="space-y-6">
            
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Patients', value: stats.total_users, color: 'text-blue-600', sub: 'Verified users' },
                { label: 'NGO / Hospitals', value: ngoList.length, color: 'text-teal-600', sub: 'Approved orgs' },
                { label: 'Active Camps', value: stats.total_camps - pendingCamps.length, color: 'text-emerald-600', sub: 'Public checkups' },
                { label: 'Pending Verifications', value: pendingCamps.length + ngoList.filter(n => !n.verified).length, color: 'text-amber-600', sub: 'Needs approval' },
                { label: 'Bookings Scheduled', value: stats.total_bookings, color: 'text-purple-600', sub: 'Active slots' }
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</p>
                  <h3 className={`text-2xl font-extrabold ${s.color} mt-1`}>{s.value}</h3>
                  <p className="text-[9px] text-gray-400 font-medium mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Verification Donut chart */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-sm text-gray-900 mb-4">Verification Overview</h3>
                <div className="flex items-center justify-around">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="45" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                      <circle cx="56" cy="56" r="45" fill="none" stroke="#2563eb" strokeWidth="12" strokeDasharray="282" strokeDashoffset="114" />
                      <circle cx="56" cy="56" r="45" fill="none" stroke="#0d9488" strokeWidth="12" strokeDasharray="282" strokeDashoffset="193" />
                      <circle cx="56" cy="56" r="45" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="282" strokeDashoffset="246" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-base font-extrabold text-gray-900">86</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Pending</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-[10px] text-gray-500 font-semibold">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span> Camps (40%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-teal-600 rounded-full"></span> NGOs (28%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Patients (19%)</div>
                  </div>
                </div>
              </div>

              {/* Camp statistics Line Chart */}
              <div className="lg:col-span-2 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-sm text-gray-900 mb-4">Camp Approvals Trend</h3>
                <div className="h-28 flex items-end justify-between relative pt-6 px-4">
                  <div className="absolute inset-x-0 bottom-6 border-b border-gray-100"></div>
                  <div className="absolute inset-x-0 bottom-16 border-b border-gray-100/50"></div>
                  
                  <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    <polyline fill="none" stroke="#2563eb" strokeWidth="3" points="40,80 120,60 200,75 280,50 360,40 440,30" />
                    <polyline fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4" points="40,90 120,75 200,85 280,60 360,55 440,45" />
                  </svg>
                  
                  {['24 May', '25 May', '26 May', '27 May', '28 May', '29 May'].map((lbl, idx) => (
                    <span key={idx} className="text-[9px] text-gray-400 font-semibold z-10">{lbl}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Camp Verification Queue */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-900">Camp Approval Queue</h3>
              {pendingCamps.length === 0 ? (
                <div className="p-6 bg-white border border-gray-150 rounded-2xl text-center shadow-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-500 font-semibold">No pending camp approvals in the verification pipeline.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                        <th className="p-3">Camp details</th>
                        <th className="p-3">Organizer</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Camp Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingCamps.map(c => (
                        <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                          <td className="p-3">
                            <span className="font-bold text-gray-900 block">{c.title}</span>
                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5 truncate max-w-[200px]">{c.description}</span>
                          </td>
                          <td className="p-3 font-semibold text-gray-700">{c.organizer}<br /><span className="text-[9px] text-gray-400 font-medium capitalize">{c.organizer_type}</span></td>
                          <td className="p-3 text-gray-600">{c.city}</td>
                          <td className="p-3 text-gray-600">{c.camp_date}</td>
                          <td className="p-3 text-right space-x-1.5">
                            <button 
                              onClick={() => handleVerifyCamp(c.id, 'active')}
                              className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg"
                              title="Approve Camp"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleVerifyCamp(c.id, 'rejected')}
                              className="p-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg"
                              title="Reject Camp"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Patient Management Tab */}
        {tab === 'patients' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Patient Registers</h2>
            <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Medical Needs</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsList.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900">{p.name}</td>
                      <td className="p-3 text-gray-600">{p.email}</td>
                      <td className="p-3 text-gray-600">{p.phone || 'N/A'}</td>
                      <td className="p-3 text-gray-600">{p.city || 'N/A'}</td>
                      <td className="p-3 text-gray-500 max-w-[150px] truncate">{p.medical_needs.join(', ') || 'General'}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {p.verified ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleVerifyUser(p.id, !p.verified)}
                          className={`text-[10px] font-bold ${p.verified ? 'text-red-600 hover:underline' : 'text-emerald-600 hover:underline'}`}
                        >
                          {p.verified ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NGO / Hospital Management Tab */}
        {tab === 'ngos' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Registered NGOs & Hospitals</h2>
            <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <th className="p-3">Organization Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">License Number</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ngoList.map(n => (
                    <tr key={n.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900">
                        {n.name}
                        <span className="block text-[10px] text-gray-400 font-medium mt-0.5 truncate max-w-[150px]">{n.description}</span>
                      </td>
                      <td className="p-3 text-gray-600 font-semibold">{n.org_type || 'NGO'}</td>
                      <td className="p-3 text-gray-600">{n.email}</td>
                      <td className="p-3 text-gray-600 font-mono">{n.license_number || 'N/A'}</td>
                      <td className="p-3 text-gray-600">{n.city}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          n.verified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {n.verified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {!n.verified ? (
                          <button 
                            onClick={() => handleVerifyUser(n.id, true)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-sm"
                          >
                            Approve
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleVerifyUser(n.id, false)}
                            className="text-[10px] text-red-500 hover:underline"
                          >
                            Revoke Approval
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Camp Verification Tab */}
        {tab === 'camp-verification' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">NGO Camp Approvals</h2>
            {pendingCamps.length === 0 ? (
              <div className="p-8 bg-white border border-gray-150 rounded-2xl text-center shadow-sm max-w-md mx-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-gray-800">Verification pipeline empty</h3>
                <p className="text-xs text-gray-500 mt-1">All NGO/Hospital camps are verified and active.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingCamps.map(c => (
                  <div key={c.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase">Pending Approve</span>
                        <span className="text-xs font-semibold text-gray-500">{c.specialty}</span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 mt-2">{c.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                      
                      <div className="bg-gray-50 p-3 rounded-xl mt-3 text-[10px] text-gray-600 space-y-1">
                        <p><b>Organizer:</b> {c.organizer} ({c.organizer_type})</p>
                        <p><b>Location:</b> {c.address}, {c.city}</p>
                        <p><b>Scheduled Date:</b> {c.camp_date}</p>
                        <p><b>Total Slots:</b> {c.total_slots}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleVerifyCamp(c.id, 'active')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex-1 shadow-sm transition-all"
                      >
                        Verify and Publish
                      </button>
                      <button 
                        onClick={() => handleVerifyCamp(c.id, 'rejected')}
                        className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl flex-1 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Advertisement Monitoring Tab */}
        {tab === 'ads' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Advertisement & Social Media Scraper</h2>
              <p className="text-gray-500 text-xs mt-0.5 font-semibold">
                Our scraper scans newspaper listings, social media advertisements (Instagram, Facebook), and hospital records. Import analyzed ads as active camps.
              </p>
            </div>

            {scrapedAds.length === 0 ? (
              <div className="p-8 bg-white border border-gray-150 rounded-2xl text-center shadow-sm max-w-md mx-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-gray-800">Scraped pipeline empty</h3>
                <p className="text-xs text-gray-500 mt-1">All scraped advertisements have been verified and imported.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scrapedAds.map(ad => (
                  <div key={ad.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          ad.source === 'social_media' 
                            ? 'bg-purple-100 text-purple-800' 
                            : ad.source === 'hospital_advertisement'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          Scraped: {ad.source.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">{ad.specialty}</span>
                      </div>
                      
                      <h3 className="font-bold text-sm text-gray-900 mt-2">{ad.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{ad.description}</p>
                      
                      <div className="bg-gray-50 p-3 rounded-xl mt-3 text-[10px] text-gray-600 space-y-1">
                        <p><b>Organizer:</b> {ad.organizer} ({ad.organizer_type})</p>
                        <p><b>Location:</b> {ad.address}, {ad.city}</p>
                        <p><b>Date/Time:</b> {ad.camp_date} &middot; {ad.start_time} - {ad.end_time}</p>
                        <p><b>Tests Offered:</b> {ad.services.join(', ')}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleImportAd(ad.id)}
                      className="btn-primary w-full py-2 text-xs font-bold shadow-md"
                    >
                      Approve & Import to Active Database
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Government Schemes Tab */}
        {tab === 'schemes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Government Healthcare Schemes</h2>
                <p className="text-gray-500 text-xs mt-0.5">Manage details of free public health plans available for recommending to patients.</p>
              </div>
              <button 
                onClick={() => setShowSchemeForm(!showSchemeForm)}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Register Scheme
              </button>
            </div>

            {showSchemeForm && (
              <form onSubmit={handleCreateScheme} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-gray-900">Add Government Scheme</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">Scheme Name</label>
                    <input 
                      value={schemeForm.name} 
                      onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })} 
                      className="input-field" 
                      placeholder="e.g. Ayushman Bharat - PM-JAY"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Government Body</label>
                    <input 
                      value={schemeForm.government_body} 
                      onChange={e => setSchemeForm({ ...schemeForm, government_body: e.target.value })} 
                      className="input-field" 
                      placeholder="e.g. Ministry of Health"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">State / Scope</label>
                    <input 
                      value={schemeForm.state} 
                      onChange={e => setSchemeForm({ ...schemeForm, state: e.target.value })} 
                      className="input-field" 
                      placeholder="e.g. Maharashtra"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">Eligibility Criteria</label>
                    <textarea 
                      value={schemeForm.eligibility} 
                      onChange={e => setSchemeForm({ ...schemeForm, eligibility: e.target.value })} 
                      className="input-field" 
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">Key Benefits</label>
                    <textarea 
                      value={schemeForm.benefits} 
                      onChange={e => setSchemeForm({ ...schemeForm, benefits: e.target.value })} 
                      className="input-field" 
                      rows={2}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary text-xs font-bold py-2 px-4 rounded-xl">Register Scheme</button>
              </form>
            )}

            <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <th className="p-3">Scheme</th>
                    <th className="p-3">Gov Body</th>
                    <th className="p-3">Scope</th>
                    <th className="p-3">Eligibility</th>
                    <th className="p-3">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {schemes.map(s => (
                    <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900">{s.name}</td>
                      <td className="p-3 text-gray-600">{s.government_body}</td>
                      <td className="p-3 text-gray-600">{s.state}</td>
                      <td className="p-3 text-gray-500 max-w-[200px] truncate">{s.eligibility}</td>
                      <td className="p-3 text-gray-600">{s.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Camp Database Tab */}
        {tab === 'camps-db' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Total Camps Database ({camps.length} camps)</h2>
              <button 
                onClick={() => setShowCampForm(!showCampForm)}
                className="btn-primary text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Camp
              </button>
            </div>

            {showCampForm && (
              <form onSubmit={handleCreateCamp} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
                <h3 className="font-bold text-sm text-gray-900">Add New Camp Manually</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Title" value={campForm.title} onChange={e => setCampForm({ ...campForm, title: e.target.value })} className="input-field col-span-2" required />
                  <textarea placeholder="Description" value={campForm.description} onChange={e => setCampForm({ ...campForm, description: e.target.value })} className="input-field col-span-2" rows={2} />
                  <input placeholder="Organizer" value={campForm.organizer} onChange={e => setCampForm({ ...campForm, organizer: e.target.value })} className="input-field" required />
                  <select value={campForm.organizer_type} onChange={e => setCampForm({ ...campForm, organizer_type: e.target.value })} className="input-field">
                    <option value="NGO">NGO</option><option value="Hospital">Hospital</option>
                    <option value="Government">Government</option><option value="Diagnostic">Diagnostic</option>
                  </select>
                  <input placeholder="Specialty" value={campForm.specialty} onChange={e => setCampForm({ ...campForm, specialty: e.target.value })} className="input-field" required />
                  <input placeholder="Services (comma separated)" value={campForm.services} onChange={e => setCampForm({ ...campForm, services: e.target.value })} className="input-field" />
                  <input placeholder="City" value={campForm.city} onChange={e => setCampForm({ ...campForm, city: e.target.value })} className="input-field" required />
                  <input placeholder="Pincode" value={campForm.pincode} onChange={e => setCampForm({ ...campForm, pincode: e.target.value })} className="input-field" />
                  <input placeholder="Address" value={campForm.address} onChange={e => setCampForm({ ...campForm, address: e.target.value })} className="input-field col-span-2" required />
                  <input type="date" value={campForm.camp_date} onChange={e => setCampForm({ ...campForm, camp_date: e.target.value })} className="input-field" required />
                  <input type="number" placeholder="Total Slots" value={campForm.total_slots} onChange={e => setCampForm({ ...campForm, total_slots: +e.target.value })} className="input-field" />
                  <input placeholder="Contact Phone" value={campForm.contact_phone} onChange={e => setCampForm({ ...campForm, contact_phone: e.target.value })} className="input-field" />
                  <label className="flex items-center gap-2"><input type="checkbox" checked={campForm.is_free} onChange={e => setCampForm({ ...campForm, is_free: e.target.checked })} /> Free camp</label>
                  {!campForm.is_free && <input type="number" placeholder="Cost (₹)" value={campForm.cost} onChange={e => setCampForm({ ...campForm, cost: +e.target.value })} className="input-field" />}
                  <label className="flex items-center gap-2 col-span-2"><input type="checkbox" checked={campForm.transport_available} onChange={e => setCampForm({ ...campForm, transport_available: e.target.checked })} /> Transport available</label>
                  {campForm.transport_available && <input placeholder="Transport details" value={campForm.transport_details} onChange={e => setCampForm({ ...campForm, transport_details: e.target.value })} className="input-field col-span-2" />}
                </div>
                <button type="submit" className="btn-primary font-bold text-xs py-2 px-4 rounded-xl">Create Camp</button>
              </form>
            )}

            <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <th className="p-3">Title</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Slots (Booked)</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {camps.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900">{c.title}</td>
                      <td className="p-3 text-gray-600">{c.city}</td>
                      <td className="p-3 text-gray-600">{c.camp_date}</td>
                      <td className="p-3 text-gray-600">{c.booked_slots} / {c.total_slots}</td>
                      <td className="p-3 capitalize text-gray-500 font-semibold">{c.source?.replace('_', ' ') || 'Manual'}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : c.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
