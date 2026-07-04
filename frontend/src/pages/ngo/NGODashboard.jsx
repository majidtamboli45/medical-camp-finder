import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Calendar, MapPin, Clock, XCircle, CheckCircle2,
  User, HelpCircle, ChevronRight, PlusCircle, LayoutDashboard,
  FileText, Users, PieChart, Info, Settings, LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NGODashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    active_camps: 0,
    pending_camps: 0,
    total_bookings: 0,
    patients_served: 0,
    pending_requests: 0
  });
  const [camps, setCamps] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Camp Form State
  const [campForm, setCampForm] = useState({
    title: '',
    description: '',
    specialty: 'General',
    services: '',
    city: user?.city || '',
    address: '',
    pincode: user?.pincode || '',
    camp_date: '',
    start_time: '09:00',
    end_time: '17:00',
    is_free: true,
    cost: 0,
    total_slots: 100,
    transport_available: false,
    transport_details: '',
    contact_phone: user?.phone || '',
    contact_email: user?.email || '',
    image_url: ''
  });
  const [campCreated, setCampCreated] = useState(false);
  const [campError, setCampError] = useState('');

  // NGO Profile State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    license_number: user?.license_number || '',
    org_type: user?.org_type || 'NGO',
    description: user?.description || ''
  });
  const [profileUpdated, setProfileUpdated] = useState(false);

  // Sidebar links
  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-camp', label: 'Create Camp', icon: PlusCircle },
    { id: 'my-camps', label: 'My Camps', icon: Calendar },
    { id: 'booking-requests', label: 'Booking Requests', icon: FileText },
    { id: 'patients-list', label: 'Patients List', icon: Users },
    { id: 'ngo-profile', label: 'Organization Profile', icon: User }
  ];

  useEffect(() => {
    loadNgoData();
  }, []);

  const loadNgoData = () => {
    setLoading(true);
    Promise.all([
      api.getNgoStats(),
      api.getNgoCamps(),
      api.getNgoBookings()
    ])
      .then(([s, c, b]) => {
        setStats(s);
        setCamps(c);
        setBookings(b);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    setCampError('');
    setCampCreated(false);
    try {
      const payload = {
        ...campForm,
        services: campForm.services.split(',').map(s => s.trim()).filter(Boolean),
        is_free: campForm.is_free,
        cost: campForm.is_free ? 0 : campForm.cost
      };
      await api.ngoCreateCamp(payload);
      setCampCreated(true);
      setCampForm({
        title: '',
        description: '',
        specialty: 'General',
        services: '',
        city: user?.city || '',
        address: '',
        pincode: user?.pincode || '',
        camp_date: '',
        start_time: '09:00',
        end_time: '17:00',
        is_free: true,
        cost: 0,
        total_slots: 100,
        transport_available: false,
        transport_details: '',
        contact_phone: user?.phone || '',
        contact_email: user?.email || '',
        image_url: ''
      });
      loadNgoData();
      
      // Redirect to My Camps after 2 seconds
      setTimeout(() => {
        setActiveTab('my-camps');
        setCampCreated(false);
      }, 2000);
    } catch (err) {
      setCampError(err.message || 'Failed to publish camp.');
    }
  };

  const handleAcceptRequest = async (bookingId) => {
    try {
      await api.updateNgoBookingStatus(bookingId, 'confirmed');
      loadNgoData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeclineRequest = async (bookingId) => {
    if (!confirm('Are you sure you want to decline this booking?')) return;
    try {
      await api.updateNgoBookingStatus(bookingId, 'cancelled');
      loadNgoData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await api.updateProfile(profileForm);
      setProfileUpdated(true);
      setTimeout(() => setProfileUpdated(false), 3000);
      loadNgoData();
    } catch (err) {
      console.error(err);
    }
  };

  // Extract unique patients listing
  const getUniquePatients = () => {
    const patientsMap = new Map();
    bookings.forEach(b => {
      if (!patientsMap.has(b.user_name)) {
        patientsMap.set(b.user_name, {
          name: b.patient_name || b.user_name,
          email: b.email,
          phone: b.phone,
          age: b.patient_age,
          gender: b.patient_gender,
          bookingsCount: 1
        });
      } else {
        const p = patientsMap.get(b.user_name);
        p.bookingsCount += 1;
      }
    });
    return Array.from(patientsMap.values());
  };

  const uniquePatients = getUniquePatients();
  const pendingRequests = bookings.filter(b => b.status === 'pending');

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      
      {/* Sidebar navigation */}
      <aside className="w-64 bg-white border-r border-gray-150 flex flex-col hidden lg:flex sticky top-16 h-[calc(100vh-4rem)]">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">ND</div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Swasthya Setu</h3>
            <p className="text-[10px] text-gray-500 font-medium">NGO / Hospital Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'N'}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-xs text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.org_type || 'NGO'} Partner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content pane */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0]} 🏥
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your camps and accept patient slot bookings.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified NGO
            </span>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && activeTab === 'dashboard' ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            <p className="text-gray-500 text-sm mt-3 font-medium">Loading organization dashboard...</p>
          </div>
        ) : (
          <>
            {/* TABS RENDER */}
            
            {/* 1. OVERVIEW DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Stats Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Camps', value: stats.active_camps, color: 'text-primary-600', pct: '+20% this week' },
                    { label: 'Total Bookings', value: stats.total_bookings, color: 'text-sky-600', pct: '+15% this month' },
                    { label: 'Patients Served', value: stats.patients_served, color: 'text-emerald-600', pct: '+18% this month' },
                    { label: 'Pending Requests', value: stats.pending_requests, color: 'text-amber-600', pct: 'Need action' }
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-gray-150 rounded-2xl p-4.5 shadow-sm">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.label}</p>
                      <h3 className={`text-2xl lg:text-3xl font-extrabold ${s.color} mt-1`}>{s.value}</h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">{s.pct}</p>
                    </div>
                  ))}
                </div>

                {/* Dashboard layout: Camps list vs recent booking request */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left block: Upcoming camps list */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-900">Upcoming Camp Outlines</h2>
                      <button onClick={() => setActiveTab('my-camps')} className="text-xs text-primary-600 font-bold hover:underline">
                        View All
                      </button>
                    </div>

                    {camps.length === 0 ? (
                      <div className="bg-white border border-gray-150 rounded-2xl p-8 text-center shadow-sm">
                        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <h4 className="font-bold text-sm text-gray-800">No camps created yet</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                          Create your first health camp using our simple form to begin accepting slot bookings from patients.
                        </p>
                        <button onClick={() => setActiveTab('create-camp')} className="btn-primary mt-3 text-xs">
                          Create Camp
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                              <th className="p-3">Camp Title</th>
                              <th className="p-3">Specialty</th>
                              <th className="p-3">Camp Date</th>
                              <th className="p-3">Slots (Booked)</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {camps.slice(0, 5).map(c => (
                              <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                <td className="p-3 font-bold text-gray-900 truncate max-w-[150px]">{c.title}</td>
                                <td className="p-3 text-gray-600">{c.specialty}</td>
                                <td className="p-3 text-gray-600">{c.camp_date}</td>
                                <td className="p-3 text-gray-600 font-semibold">{c.booked_slots} / {c.total_slots}</td>
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
                    )}

                    {/* SVG Line Chart representing Analytics bookings overview */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                      <h3 className="font-bold text-sm text-gray-900 mb-4">Bookings Trend Overview</h3>
                      <div className="h-40 flex items-end justify-between relative pt-6 px-4">
                        <div className="absolute inset-x-0 bottom-6 border-b border-gray-100"></div>
                        <div className="absolute inset-x-0 bottom-16 border-b border-gray-100/50"></div>
                        <div className="absolute inset-x-0 bottom-28 border-b border-gray-100/50"></div>
                        
                        {/* Mock SVG Line overlay */}
                        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="3"
                            points="40,110 120,95 200,120 280,75 360,50 440,65"
                          />
                        </svg>
                        
                        {['1 May', '7 May', '13 May', '19 May', '25 May', '31 May'].map((lbl, idx) => (
                          <div key={idx} className="flex flex-col items-center z-10">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border-2 border-white shadow-sm mb-1"></span>
                            <span className="text-[10px] text-gray-400 font-semibold">{lbl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right block: Recent booking requests list */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
                      <button onClick={() => setActiveTab('booking-requests')} className="text-xs text-primary-600 font-bold hover:underline">
                        View All
                      </button>
                    </div>

                    {pendingRequests.length === 0 ? (
                      <div className="bg-white border border-gray-150 rounded-2xl p-6 text-center shadow-sm">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <h4 className="font-bold text-sm text-gray-800">All caught up!</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          You have no pending appointment slot booking requests requiring approval.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingRequests.slice(0, 3).map(req => (
                          <div key={req.id} className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-xs text-gray-900 leading-tight truncate">{req.patient_name}</h4>
                                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full uppercase">Pending</span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5">Age: {req.patient_age} &middot; Gender: {req.patient_gender}</p>
                              <div className="bg-gray-50 p-2 rounded-xl mt-3 text-[10px] text-gray-600 space-y-0.5">
                                <p className="truncate"><b>Camp:</b> {req.camp_title}</p>
                                <p><b>Time:</b> {req.slot_date} &middot; {req.slot_time}</p>
                                {req.medical_concern && <p className="line-clamp-2"><b>Concern:</b> {req.medical_concern}</p>}
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <button 
                                onClick={() => handleAcceptRequest(req.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg flex-1 shadow-sm transition-all"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleDeclineRequest(req.id)}
                                className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-[10px] rounded-lg flex-1 transition-all"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SVG Circular Donut Chart showing Camp Analytics specialties breakdown */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                      <h3 className="font-bold text-sm text-gray-900 mb-4">Camp Analytics</h3>
                      <div className="flex items-center justify-around">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          {/* Mock Donut SVG */}
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r="45" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                            <circle cx="56" cy="56" r="45" fill="none" stroke="#0284c7" strokeWidth="12" strokeDasharray="282" strokeDashoffset="120" />
                            <circle cx="56" cy="56" r="45" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="282" strokeDashoffset="220" />
                            <circle cx="56" cy="56" r="45" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="282" strokeDashoffset="260" />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-base font-extrabold text-gray-900">{stats.total_bookings}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Bookings</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-[10px] text-gray-500 font-semibold">
                          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-sky-600 rounded-full"></span> Diabetes</div>
                          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Ophthalmology</div>
                          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Cardiology</div>
                          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-200 rounded-full"></span> Others</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* 2. CREATE CAMP */}
            {activeTab === 'create-camp' && (
              <div className="max-w-2xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                <div className="mb-5 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Publish Health Camp</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Define camp parameters. Published camps default to 'pending' and require Admin approval.</p>
                  </div>
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800 flex items-center gap-1.5 max-w-xs leading-normal">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Submitted camps must be verified by admin before becoming visible.</span>
                  </div>
                </div>

                {campCreated && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-2xl text-xs font-semibold mb-4">
                    Camp created successfully and submitted for Admin verification! Redirecting to list...
                  </div>
                )}

                {campError && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-2xl text-xs font-semibold mb-4">
                    {campError}
                  </div>
                )}

                <form onSubmit={handleCreateCamp} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Camp Title</label>
                      <input 
                        value={campForm.title} 
                        onChange={e => setCampFormState('title', e.target.value)}
                        className="input-field" 
                        placeholder="e.g. Free Eye Checkup & Cataract Screening Camp"
                        required 
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
                      <textarea 
                        value={campForm.description} 
                        onChange={e => setCampFormState('description', e.target.value)}
                        className="input-field" 
                        placeholder="Provide details on tests, free medicines, eligibility..."
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Primary Medical Specialty</label>
                      <select 
                        value={campForm.specialty} 
                        onChange={e => setCampFormState('specialty', e.target.value)}
                        className="input-field"
                      >
                        <option value="General">General Medicine</option>
                        <option value="Ophthalmology">Ophthalmology (Eye)</option>
                        <option value="Dental">Dental Care</option>
                        <option value="Diabetes">Diabetes Check</option>
                        <option value="Cardiology">Cardiology (Heart)</option>
                        <option value="Gynecology">Gynecology (Women)</option>
                        <option value="Pediatric">Pediatrics (Child)</option>
                        <option value="Oncology">Oncology (Cancer)</option>
                        <option value="Orthopedic">Orthopedic (Bone/Joint)</option>
                        <option value="Nephrology">Nephrology (Kidney)</option>
                        <option value="Mental Health">Mental Health</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Services Provided (comma separated)</label>
                      <input 
                        value={campForm.services} 
                        onChange={e => setCampFormState('services', e.target.value)}
                        className="input-field" 
                        placeholder="e.g. Vision Test, BP Check, Free Spectacles"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">City</label>
                      <input 
                        value={campForm.city} 
                        onChange={e => setCampFormState('city', e.target.value)}
                        className="input-field" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Pincode</label>
                      <input 
                        value={campForm.pincode} 
                        onChange={e => setCampFormState('pincode', e.target.value)}
                        className="input-field" 
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Camp Address</label>
                      <input 
                        value={campForm.address} 
                        onChange={e => setCampFormState('address', e.target.value)}
                        className="input-field" 
                        placeholder="e.g. Andheri Sports Complex Hall, Mumbai"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Camp Date</label>
                      <input 
                        type="date"
                        value={campForm.camp_date} 
                        onChange={e => setCampFormState('camp_date', e.target.value)}
                        className="input-field" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Total Slots Available</label>
                      <input 
                        type="number"
                        value={campForm.total_slots} 
                        onChange={e => setCampFormState('total_slots', +e.target.value)}
                        className="input-field" 
                        min={10}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Start Time</label>
                      <input 
                        type="time"
                        value={campForm.start_time} 
                        onChange={e => setCampFormState('start_time', e.target.value)}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">End Time</label>
                      <input 
                        type="time"
                        value={campForm.end_time} 
                        onChange={e => setCampFormState('end_time', e.target.value)}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Image URL (Optional)</label>
                      <input 
                        value={campForm.image_url} 
                        onChange={e => setCampFormState('image_url', e.target.value)}
                        className="input-field" 
                        placeholder="Image URL link"
                      />
                    </div>
                    <div className="flex items-center gap-4 py-2 col-span-1 sm:col-span-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={campForm.is_free} 
                          onChange={e => setCampFormState('is_free', e.target.checked)}
                          className="w-4 h-4 rounded text-primary-600"
                        />
                        <span>Is Free Camp</span>
                      </label>
                      {!campForm.is_free && (
                        <div className="flex-1">
                          <input 
                            type="number" 
                            placeholder="Cost in ₹" 
                            value={campForm.cost} 
                            onChange={e => setCampFormState('cost', +e.target.value)}
                            className="input-field"
                            min={1}
                          />
                        </div>
                      )}
                    </div>
                    <div className="col-span-1 sm:col-span-2 border-t border-gray-100 pt-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer mb-2">
                        <input 
                          type="checkbox" 
                          checked={campForm.transport_available} 
                          onChange={e => setCampFormState('transport_available', e.target.checked)}
                          className="w-4 h-4 rounded text-primary-600"
                        />
                        <span>Provide Shuttle/Transportation Recommendations</span>
                      </label>
                      {campForm.transport_available && (
                        <input 
                          value={campForm.transport_details} 
                          onChange={e => setCampFormState('transport_details', e.target.value)}
                          className="input-field" 
                          placeholder="e.g. Free bus from local train terminal at 8:30 AM"
                        />
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full py-2.5 rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5"
                  >
                    Publish Camp for Review
                  </button>
                </form>
              </div>
            )}

            {/* 3. MY CAMPS */}
            {activeTab === 'my-camps' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">My Campaigns</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Track registration numbers and verification status for all your camps.</p>
                  </div>
                  <button onClick={() => setActiveTab('create-camp')} className="btn-primary text-xs flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4" /> Create Camp
                  </button>
                </div>

                {camps.length === 0 ? (
                  <div className="bg-white border border-gray-150 rounded-2xl p-10 text-center shadow-sm max-w-md mx-auto">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-sm text-gray-800">No campaigns found</h3>
                    <p className="text-xs text-gray-500 mt-1">Publish a camp to begin.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {camps.map(c => (
                      <div key={c.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-sm text-gray-900 leading-snug">{c.title}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : c.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 bg-gray-50 p-3 rounded-xl mt-3.5 border border-gray-100/50">
                            <div><b>Specialty:</b> {c.specialty}</div>
                            <div><b>Date:</b> {c.camp_date}</div>
                            <div><b>Slots:</b> {c.booked_slots} / {c.total_slots} (booked)</div>
                            <div><b>Fee:</b> {c.is_free ? 'Free' : `₹${c.cost}`}</div>
                          </div>
                        </div>
                        
                        {c.status === 'pending' && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 p-2.5 rounded-xl flex items-center gap-1.5 border border-amber-100">
                            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span>Awaiting administrator verification before taking public bookings.</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. BOOKING REQUESTS */}
            {activeTab === 'booking-requests' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Patient Booking Requests</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Approve slot bookings and check patient details.</p>
                </div>

                {bookings.length === 0 ? (
                  <div className="bg-white border border-gray-150 rounded-2xl p-10 text-center shadow-sm max-w-md mx-auto">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-sm text-gray-800">No booking requests</h3>
                    <p className="text-xs text-gray-500 mt-1">Bookings submitted by patients appear here.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                          <th className="p-3">Patient Name</th>
                          <th className="p-3">Age / Gender</th>
                          <th className="p-3">Camp Title</th>
                          <th className="p-3">Date & Slot</th>
                          <th className="p-3">Medical Concern</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-900">
                              {b.patient_name}
                              <span className="block text-[10px] text-gray-400 font-medium">{b.email}</span>
                            </td>
                            <td className="p-3 text-gray-600">{b.patient_age} yrs / {b.patient_gender}</td>
                            <td className="p-3 text-gray-600 truncate max-w-[150px] font-medium">{b.camp_title}</td>
                            <td className="p-3 text-gray-600">{b.slot_date}<span className="block text-[10px] text-gray-400 font-medium">{b.slot_time}</span></td>
                            <td className="p-3 text-gray-500 italic max-w-[150px] truncate">{b.medical_concern || 'None'}</td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                b.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : b.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              {b.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleAcceptRequest(b.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => handleDeclineRequest(b.id)}
                                    className="px-2.5 py-1 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-[10px] rounded-lg transition-all"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                              {b.status === 'confirmed' && (
                                <button 
                                  onClick={() => handleDeclineRequest(b.id)}
                                  className="text-[10px] text-red-500 hover:underline"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 5. PATIENTS LIST */}
            {activeTab === 'patients-list' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Patients Roster</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Directory of patient details who have booked appointment slots in your campaigns.</p>
                </div>

                {uniquePatients.length === 0 ? (
                  <div className="bg-white border border-gray-150 rounded-2xl p-10 text-center shadow-sm max-w-md mx-auto">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-sm text-gray-800">No patient records found</h3>
                    <p className="text-xs text-gray-500 mt-1">Confirmed patient files show up here.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                          <th className="p-3">Patient Name</th>
                          <th className="p-3">Contact Email</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Age / Gender</th>
                          <th className="p-3 text-center">Total Bookings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniquePatients.map((p, i) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-900">{p.name}</td>
                            <td className="p-3 text-gray-600">{p.email}</td>
                            <td className="p-3 text-gray-600">{p.phone || 'Not provided'}</td>
                            <td className="p-3 text-gray-600">{p.age || 'N/A'} yrs / {p.gender || 'N/A'}</td>
                            <td className="p-3 text-center text-primary-600 font-bold">{p.bookingsCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 6. ORGANIZATION PROFILE */}
            {activeTab === 'ngo-profile' && (
              <div className="max-w-2xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Organization Settings</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Manage organization details and administrative profile metadata.</p>
                </div>

                {profileUpdated && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-r-xl text-xs font-semibold mb-4">
                    Organization profile updated successfully!
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Organization Name</label>
                      <input 
                        value={profileForm.name} 
                        onChange={e => setProfileState('name', e.target.value)}
                        className="input-field" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Contact Phone</label>
                      <input 
                        value={profileForm.phone} 
                        onChange={e => setProfileState('phone', e.target.value)}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">City</label>
                      <input 
                        value={profileForm.city} 
                        onChange={e => setProfileState('city', e.target.value)}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Pincode</label>
                      <input 
                        value={profileForm.pincode} 
                        onChange={e => setProfileState('pincode', e.target.value)}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">License / Reg Number</label>
                      <input 
                        value={profileForm.license_number} 
                        disabled
                        className="input-field bg-gray-100 text-gray-500 cursor-not-allowed" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Organization Type</label>
                      <select 
                        value={profileForm.org_type} 
                        onChange={e => setProfileState('org_type', e.target.value)}
                        className="input-field"
                      >
                        <option value="NGO">NGO</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Clinic">Clinic</option>
                        <option value="Diagnostic">Diagnostic Center</option>
                      </select>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Profile Description</label>
                      <textarea 
                        value={profileForm.description} 
                        onChange={e => setProfileState('description', e.target.value)}
                        className="input-field" 
                        rows={3}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full py-2.5 rounded-xl font-bold shadow-md transform hover:-translate-y-0.5 transition-all"
                  >
                    Update Profile
                  </button>
                </form>
              </div>
            )}

          </>
        )}
      </main>
    </div>
  );

  function setCampFormState(field, val) {
    setCampForm(prev => ({ ...prev, [field]: val }));
  }

  function setProfileState(field, val) {
    setProfileForm(prev => ({ ...prev, [field]: val }));
  }
}
