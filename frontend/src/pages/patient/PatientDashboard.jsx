import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Calendar, MapPin, Clock, XCircle, Bus, Sparkles, Bell, Shield,
  User, HelpCircle, ChevronRight, CheckCircle2, Upload, AlertCircle,
  FileText, Phone, MessageSquare, ArrowRight, Check, Compass, Eye, Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Prescription upload & analysis state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Booking page state
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [bookingForm, setBookingForm] = useState({
    patient_name: user?.name || '',
    patient_age: '',
    patient_gender: 'Male',
    medical_concern: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Health Form State
  const [healthForm, setHealthForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    max_budget: user?.max_budget || 0,
    medical_needs: user?.medical_needs || []
  });
  const [healthFormSuccess, setHealthFormSuccess] = useState(false);

  // Sidebar links definition
  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Heart },
    { id: 'health-form', label: 'Health Registration Form', icon: FileText },
    { id: 'upload-prescription', label: 'Upload Prescription', icon: Upload },
    { id: 'test-analysis', label: 'Test Analysis', icon: ActivityIcon },
    { id: 'recommended-camps', label: 'Recommended Camps', icon: Sparkles },
    { id: 'book-slot', label: 'Book Slot', icon: Calendar },
    { id: 'my-bookings', label: 'My Bookings', icon: CheckCircle2 },
    { id: 'transportation', label: 'Transportation', icon: Bus },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  function ActivityIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      api.getMyBookings(),
      api.getNotifications(),
      api.getCamps()
    ])
      .then(([b, n, c]) => {
        setBookings(b);
        setNotifications(n);
        setCamps(c);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  // Simulate prescription parsing NLP
  const handlePrescriptionUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    
    // Simulate prescription file analysis delay
    setTimeout(async () => {
      try {
        // Send filename to analyze-prescription API to simulate NLP reading
        const result = await api.analyzePrescription('', file.name);
        setAnalysisResult(result);
        
        // Add a local notification
        const newNotif = {
          id: Date.now(),
          title: 'Prescription Analyzed',
          message: `AI identified ${result.recommended_tests.length} recommended tests from "${file.name}".`,
          created_at: new Date().toISOString(),
          type: 'success'
        };
        setNotifications(prev => [newNotif, ...prev]);

        // Auto switch tab to Test Analysis
        setActiveTab('test-analysis');
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    }, 2000);
  };

  const handleUpdateHealthForm = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await api.updateProfile(healthForm);
      updateUser(updatedUser);
      setHealthFormSuccess(true);
      setTimeout(() => setHealthFormSuccess(false), 3000);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleHealthNeed = (id) => {
    setHealthForm(prev => {
      const needs = prev.medical_needs.includes(id)
        ? prev.medical_needs.filter(n => n !== id)
        : [...prev.medical_needs, id];
      return { ...prev, medical_needs: needs };
    });
  };

  const selectCampForBooking = (camp) => {
    setSelectedCamp(camp);
    setBookingDate(camp.camp_date);
    setBookingSuccess(false);
    setBookingError('');
    setSelectedSlotTime('');
    setActiveTab('book-slot');
    
    // Fetch slots
    api.getSlots(camp.id, camp.camp_date).then(res => {
      setAvailableSlots(res.slots);
    });
  };

  const handleDateChange = (dateVal) => {
    setBookingDate(dateVal);
    setSelectedSlotTime('');
    if (selectedCamp) {
      api.getSlots(selectedCamp.id, dateVal).then(res => {
        setAvailableSlots(res.slots);
      });
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCamp || !bookingDate || !selectedSlotTime) {
      setBookingError('Please select camp, date, and slot time.');
      return;
    }
    setBookingError('');
    try {
      const payload = {
        camp_id: selectedCamp.id,
        slot_date: bookingDate,
        slot_time: selectedSlotTime,
        ...bookingForm
      };
      await api.createBooking(payload);
      setBookingSuccess(true);
      loadDashboardData();
      
      // Auto redirect to My Bookings tab after 2.5 seconds
      setTimeout(() => {
        setActiveTab('my-bookings');
        setBookingSuccess(false);
        setSelectedCamp(null);
      }, 2500);
    } catch (err) {
      setBookingError(err.message || 'Failed to book slot.');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.cancelBooking(id);
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter camps based on NLP analysis recommended specialties or selected needs
  const getRecommendedCamps = () => {
    let specialtiesToMatch = [...healthForm.medical_needs];
    
    if (analysisResult && analysisResult.identified_specialties) {
      specialtiesToMatch = [...new Set([...specialtiesToMatch, ...analysisResult.identified_specialties])];
    }

    if (specialtiesToMatch.length === 0) {
      // If no constraints, show all active camps
      return camps.filter(c => c.status === 'active');
    }

    return camps.filter(c => {
      if (c.status !== 'active') return false;
      const text = `${c.title} ${c.description} ${c.specialty} ${(c.services || []).join(' ')}`.toLowerCase();
      
      // Matches the camp specialty or description keywords
      const matchesSpecialty = specialtiesToMatch.some(spec => {
        const specName = spec.toLowerCase();
        return c.specialty.toLowerCase().includes(specName) || text.includes(specName);
      });

      // Filter by city if user has a city filled
      const matchesCity = !user?.city || c.city.toLowerCase() === user.city.toLowerCase();

      // Filter by budget
      const matchesBudget = !user?.max_budget || c.is_free || c.cost <= user.max_budget;

      return matchesSpecialty && matchesCity && matchesBudget;
    });
  };

  const MEDICAL_NEEDS_LIST = [
    { id: 'general', label: 'General Checkup' },
    { id: 'eye', label: 'Eye Care / Ophthalmology' },
    { id: 'dental', label: 'Dental Care' },
    { id: 'diabetes', label: 'Diabetes Screening' },
    { id: 'heart', label: 'Heart / Cardiology' },
    { id: 'women', label: 'Women Health' },
    { id: 'child', label: 'Child Health' },
    { id: 'cancer', label: 'Cancer Screening' },
    { id: 'bone', label: 'Bone & Joint' },
    { id: 'mental', label: 'Mental Health' },
    { id: 'blood', label: 'Blood Pathology' },
    { id: 'kidney', label: 'Kidney & Renal' }
  ];

  // Helper variables for Dashboard Overview
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' && new Date(b.slot_date) >= new Date());
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const recommendedCamps = getRecommendedCamps();

  // Progress flow steps checked
  const isStep1Done = user?.city && user?.pincode && healthForm.medical_needs.length > 0;
  const isStep2Done = !!file;
  const isStep3Done = !!analysisResult;
  const isStep4Done = recommendedCamps.length > 0;
  const isStep5Done = bookings.length > 0;

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-150 flex flex-col hidden lg:flex sticky top-16 h-[calc(100vh-4rem)]">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">SS</div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Sehat Saathi</h3>
            <p className="text-[10px] text-gray-500 font-medium">Patient Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  if (link.id !== 'book-slot') {
                    // Reset selected camp when leaving booking tab
                    setSelectedCamp(null);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'P'}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-xs text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Let's take care of your health together.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{user?.city || 'Set Location'}, India</span>
            </div>
            <button 
              onClick={() => setActiveTab('notifications')}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 shadow-sm relative"
            >
              <Bell className="w-4 h-4" />
              {notifications.some(n => !n.is_read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && activeTab === 'dashboard' ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            <p className="text-gray-500 text-sm mt-3 font-medium">Loading your health network...</p>
          </div>
        ) : (
          <>
            {/* TABS RENDER */}
            
            {/* 1. OVERVIEW DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Your Health Journey Progress Indicator */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-900 mb-4">Your Health Journey</h2>
                  <div className="grid grid-cols-5 gap-2 relative">
                    <div className="absolute top-3.5 left-8 right-8 h-0.5 bg-gray-100 -z-10"></div>
                    
                    {[
                      { step: 1, label: 'Fill Health Form', done: isStep1Done, tab: 'health-form' },
                      { step: 2, label: 'Upload Prescription', done: isStep2Done, tab: 'upload-prescription' },
                      { step: 3, label: 'Test Analysis', done: isStep3Done, tab: 'test-analysis' },
                      { step: 4, label: 'Find Camps', done: isStep4Done, tab: 'recommended-camps' },
                      { step: 5, label: 'Book & Visit', done: isStep5Done, tab: 'my-bookings' }
                    ].map(st => (
                      <button
                        key={st.step}
                        onClick={() => setActiveTab(st.tab)}
                        className="flex flex-col items-center text-center group focus:outline-none"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          st.done
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border-2 border-gray-200 text-gray-400 group-hover:border-emerald-400 group-hover:text-emerald-600'
                        }`}>
                          {st.done ? <Check className="w-4 h-4" /> : st.step}
                        </div>
                        <span className="text-[10px] lg:text-xs font-semibold text-gray-700 mt-2 truncate w-full group-hover:text-emerald-600">
                          {st.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick actions row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setActiveTab('health-form')} 
                    className="p-4 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 rounded-2xl text-left transition-all"
                  >
                    <FileText className="w-6 h-6 text-emerald-600 mb-2" />
                    <h3 className="font-bold text-xs text-emerald-800">Fill Health Form</h3>
                    <p className="text-[10px] text-emerald-600/80 mt-0.5">Tell us about your needs</p>
                  </button>

                  <button 
                    onClick={() => setActiveTab('upload-prescription')} 
                    className="p-4 bg-sky-50 hover:bg-sky-100/70 border border-sky-100 rounded-2xl text-left transition-all"
                  >
                    <Upload className="w-6 h-6 text-sky-600 mb-2" />
                    <h3 className="font-bold text-xs text-sky-800">Upload Prescription</h3>
                    <p className="text-[10px] text-sky-600/80 mt-0.5">AI NLP parsing of tests</p>
                  </button>

                  <button 
                    onClick={() => setActiveTab('test-analysis')} 
                    className="p-4 bg-purple-50 hover:bg-purple-100/70 border border-purple-100 rounded-2xl text-left transition-all"
                  >
                    <ActivityIcon className="w-6 h-6 text-purple-600 mb-2" />
                    <h3 className="font-bold text-xs text-purple-800">View Test Analysis</h3>
                    <p className="text-[10px] text-purple-600/80 mt-0.5">See identified medical needs</p>
                  </button>

                  <button 
                    onClick={() => setActiveTab('recommended-camps')} 
                    className="p-4 bg-amber-50 hover:bg-amber-100/70 border border-amber-100 rounded-2xl text-left transition-all"
                  >
                    <Sparkles className="w-6 h-6 text-amber-600 mb-2" />
                    <h3 className="font-bold text-xs text-amber-800">Find Camps</h3>
                    <p className="text-[10px] text-amber-600/80 mt-0.5">Search and filter active camps</p>
                  </button>
                </div>

                {/* Dashboard layout: Main recommendations vs Bookings widget */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Recommended camps list */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span>Recommended Camps For You</span>
                        {analysisResult && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                            Based on prescription
                          </span>
                        )}
                      </h2>
                      <button onClick={() => setActiveTab('recommended-camps')} className="text-xs text-emerald-600 font-semibold hover:underline">
                        View All
                      </button>
                    </div>

                    {recommendedCamps.length === 0 ? (
                      <div className="bg-white border border-gray-150 rounded-2xl p-8 text-center shadow-sm">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <h4 className="font-bold text-sm text-gray-800">No matching camps found</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                          We couldn't find camps matching your specific interests in your city. Adjust your health form interests or location to view general camps.
                        </p>
                        <button onClick={() => setActiveTab('health-form')} className="btn-primary mt-3 text-xs">
                          Edit Health Form
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {recommendedCamps.slice(0, 4).map(camp => (
                          <div key={camp.id} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                            {camp.image_url ? (
                              <img src={camp.image_url} alt={camp.title} className="w-full h-32 object-cover" />
                            ) : (
                              <div className="w-full h-32 bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                {camp.specialty} Camp
                              </div>
                            )}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                    {camp.specialty}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-500">
                                    {camp.is_free ? 'Free' : `₹${camp.cost}`}
                                  </span>
                                </div>
                                <h3 className="font-bold text-sm text-gray-900 leading-snug truncate mb-1">
                                  {camp.title}
                                </h3>
                                <p className="text-[11px] text-gray-500 line-clamp-2 mb-3">
                                  {camp.description}
                                </p>
                                <div className="text-[11px] text-gray-600 space-y-1">
                                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {camp.camp_date}</div>
                                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {camp.city}</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => selectCampForBooking(camp)}
                                className="btn-primary w-full mt-4 text-xs py-2"
                              >
                                Book Slot
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column Widgets */}
                  <div className="space-y-6">
                    
                    {/* Booking Panel */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-4.5 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-sm text-gray-900">Upcoming Booking</h3>
                        <button onClick={() => setActiveTab('my-bookings')} className="text-[10px] text-emerald-600 font-bold hover:underline">
                          View All
                        </button>
                      </div>

                      {upcomingBookings.length === 0 && pendingBookings.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                          <p className="text-xs text-gray-400 font-medium">No bookings scheduled</p>
                          <button onClick={() => setActiveTab('recommended-camps')} className="text-emerald-600 text-[10px] font-bold mt-1 hover:underline">
                            Find and Book Slot
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Render confirmed first */}
                          {[...upcomingBookings, ...pendingBookings].slice(0, 2).map(b => (
                            <div key={b.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex flex-col justify-between">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-xs text-gray-900 leading-tight truncate">{b.camp_title}</h4>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  b.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {b.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 space-y-0.5 mt-2">
                                <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.slot_date}</p>
                                <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.slot_time}</p>
                                <p className="flex items-center gap-1"><MapPin className="w-3 h-3 font-semibold" /> {b.address?.substring(0, 30)}...</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notifications Widget */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-4.5 shadow-sm">
                      <h3 className="font-bold text-sm text-gray-900 mb-3">Recent Alerts</h3>
                      {notifications.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4 font-medium">No notifications yet</p>
                      ) : (
                        <div className="space-y-3">
                          {notifications.slice(0, 3).map(n => (
                            <div key={n.id} className="text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                              <p className="font-bold text-gray-900">{n.title}</p>
                              <p className="text-gray-500 text-[10px] mt-0.5 leading-snug">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Help Widget */}
                    <div className="bg-emerald-950 text-white rounded-2xl p-4.5 shadow-sm">
                      <h4 className="font-bold text-sm mb-1">Need help?</h4>
                      <p className="text-[10px] text-emerald-200/80 mb-3.5 leading-relaxed">
                        Our support team is here to assist you in getting to the camp or sorting any issues.
                      </p>
                      <button 
                        onClick={() => setActiveTab('help')}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat Support</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Transportation help banner at the bottom */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <Bus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-snug">Need Transportation Help?</h3>
                      <p className="text-emerald-100 text-xs mt-0.5">Get the best route and transport recommendations to reach the camp location easily.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('transportation')}
                    className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-black/10 self-stretch sm:self-auto text-center justify-center"
                  >
                    <span>Get Directions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )}

            {/* 2. HEALTH REGISTRATION FORM */}
            {activeTab === 'health-form' && (
              <div className="max-w-2xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Health Registration Form</h2>
                  <p className="text-gray-500 text-xs mt-0.5">This medical profile helps us find the most appropriate health checkup camps near you.</p>
                </div>

                {healthFormSuccess && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-r-xl text-xs font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Profile and medical preferences updated successfully!
                  </div>
                )}

                <form onSubmit={handleUpdateHealthForm} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
                      <input 
                        value={healthForm.name} 
                        onChange={e => setFormState('name', e.target.value)}
                        className="input-field" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Contact Phone</label>
                      <input 
                        value={healthForm.phone} 
                        onChange={e => setFormState('phone', e.target.value)}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">City</label>
                      <input 
                        value={healthForm.city} 
                        onChange={e => setFormState('city', e.target.value)}
                        className="input-field" 
                        placeholder="e.g. Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Pincode</label>
                      <input 
                        value={healthForm.pincode} 
                        onChange={e => setFormState('pincode', e.target.value)}
                        className="input-field" 
                        placeholder="e.g. 400001"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Maximum Budget (₹) — Enter 0 if looking only for FREE camps</label>
                      <input 
                        type="number" 
                        value={healthForm.max_budget} 
                        onChange={e => setFormState('max_budget', +e.target.value)}
                        className="input-field" 
                        min={0}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Medical Interests / Screening Needs</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {MEDICAL_NEEDS_LIST.map(n => {
                        const isChecked = healthForm.medical_needs.includes(n.id);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => toggleHealthNeed(n.id)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="truncate pr-2">{n.label}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full py-2.5 rounded-xl font-bold shadow-md transform hover:-translate-y-0.5 transition-all"
                  >
                    Save Preferences
                  </button>
                </form>
              </div>
            )}

            {/* 3. UPLOAD PRESCRIPTION */}
            {activeTab === 'upload-prescription' && (
              <div className="max-w-xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Upload Doctor's Prescription</h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Our AI Natural Language Processing (NLP) system analyzes doctor prescriptions to detect what tests are recommended and matches them with available camps.
                  </p>
                </div>

                <form onSubmit={handlePrescriptionUpload} className="space-y-6">
                  <div className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-8 text-center transition-all bg-gray-50/50">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    
                    <input 
                      type="file" 
                      id="prescription-file" 
                      onChange={e => setFile(e.target.files[0])}
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    
                    <label 
                      htmlFor="prescription-file"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      Browse Files
                    </label>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Supports PDF, PNG, JPG (Max 5MB)</p>
                    
                    {file && (
                      <div className="mt-4 p-3 bg-white border border-gray-150 rounded-xl inline-flex items-center gap-2 max-w-full">
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-semibold text-gray-800 truncate max-w-[200px]">{file.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setFile(null)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sample prescription helpers to trigger NLP easily */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Quick Test Tips:</span>
                    </p>
                    <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                      To test cardiac/diabetes logic, select or create files with keywords: <b>heart, cardiology, ecg, diabetes, blood sugar, eye, vision</b>. The mock NLP parser detects keywords in filenames too!
                    </p>
                  </div>

                  {uploading ? (
                    <div className="text-center py-3 bg-emerald-50 rounded-xl border border-emerald-150 flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                      <p className="text-emerald-800 text-xs font-bold animate-pulse">
                        NLP AI System is analyzing prescription text...
                      </p>
                    </div>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={!file}
                      className="btn-primary w-full py-2.5 rounded-xl font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all"
                    >
                      Upload & Analyze Prescription
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* 4. TEST ANALYSIS RESULTS */}
            {activeTab === 'test-analysis' && (
              <div className="max-w-2xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">NLP Test Analysis Results</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Details of medical tests identified by the artificial intelligence model.</p>
                </div>

                {!analysisResult ? (
                  <div className="text-center py-10">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-sm text-gray-800">No prescription analyzed yet</h3>
                    <p className="text-xs text-gray-500 mt-1.5 max-w-sm mx-auto">
                      Upload your prescription. The AI NLP parser will identify the tests prescribed by your physician and recommend relevant health camps.
                    </p>
                    <button onClick={() => setActiveTab('upload-prescription')} className="btn-primary mt-4 text-xs">
                      Go to Upload Prescription
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl">
                      <h3 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">Analysis Summary</h3>
                      <p className="text-xs text-emerald-700 font-semibold leading-relaxed mt-1.5">
                        {analysisResult.summary}
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Source file: {analysisResult.filename}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-gray-800 mb-3">Identified Medical Fields ({analysisResult.identified_specialties.length})</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.identified_specialties.map(spec => (
                          <span key={spec} className="px-3 py-1.5 bg-sky-50 border border-sky-100 text-sky-800 text-xs font-bold rounded-xl capitalize">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-gray-800 mb-3">Required Tests Detected ({analysisResult.recommended_tests.length})</h3>
                      <div className="space-y-2">
                        {analysisResult.recommended_tests.map(test => (
                          <div key={test} className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl bg-gray-50/50">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold text-gray-800">{test}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex gap-3">
                      <button 
                        onClick={() => setActiveTab('recommended-camps')}
                        className="btn-primary flex-1 py-2.5 rounded-xl font-bold text-xs"
                      >
                        Search Recommended Camps
                      </button>
                      <button 
                        onClick={() => { setFile(null); setAnalysisResult(null); setActiveTab('upload-prescription'); }}
                        className="btn-outline px-4 py-2.5 rounded-xl font-bold text-xs"
                      >
                        Upload Another
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. RECOMMENDED CAMPS SEARCH */}
            {activeTab === 'recommended-camps' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Available Test Camps</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Explore medical camps matching your prescription analysis and preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendedCamps.map(camp => (
                        <div key={camp.id} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                          <div>
                            {camp.image_url ? (
                              <img src={camp.image_url} alt={camp.title} className="w-full h-36 object-cover" />
                            ) : (
                              <div className="w-full h-36 bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                {camp.specialty} Camp
                              </div>
                            )}
                            <div className="p-4.5">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                                  {camp.specialty}
                                </span>
                                <span className="text-xs font-semibold text-gray-600">
                                  {camp.is_free ? 'Free' : `₹${camp.cost}`}
                                </span>
                              </div>
                              <h3 className="font-bold text-sm text-gray-900 leading-snug mb-1">{camp.title}</h3>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{camp.description}</p>
                              
                              <div className="text-[11px] text-gray-600 space-y-1 bg-gray-50 p-2.5 rounded-xl">
                                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {camp.camp_date}</div>
                                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {camp.city}</div>
                                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /> {camp.start_time} - {camp.end_time}</div>
                                {camp.transport_available && (
                                  <div className="flex items-center gap-1.5 text-purple-700 font-bold"><Bus className="w-3.5 h-3.5" /> Transport available</div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="p-4.5 pt-0">
                            <button 
                              onClick={() => selectCampForBooking(camp)}
                              className="btn-primary w-full py-2 text-xs font-bold"
                            >
                              Book Slot
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. BOOK SLOT */}
            {activeTab === 'book-slot' && (
              <div className="max-w-2xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Book Appointment Slot</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Secure your health checkup appointment at our partner camps.</p>
                </div>

                {!selectedCamp ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="font-bold text-sm text-gray-800 font-medium">No camp selected</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                      Please browse recommended camps and select one to book your slot.
                    </p>
                    <button onClick={() => setActiveTab('recommended-camps')} className="btn-primary mt-3 text-xs">
                      Browse Camps
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4.5 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">{selectedCamp.specialty}</span>
                      <h3 className="font-bold text-sm text-gray-900 mt-1.5">{selectedCamp.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{selectedCamp.organizer} &middot; {selectedCamp.organizer_type}</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-600 mt-3.5">
                        <div><b>Location:</b> {selectedCamp.address}, {selectedCamp.city}</div>
                        <div><b>Fees:</b> {selectedCamp.is_free ? 'FREE' : `₹${selectedCamp.cost}`}</div>
                        {selectedCamp.contact_phone && <div><b>Contact Details:</b> {selectedCamp.contact_phone}</div>}
                        <div><b>Transportation:</b> {selectedCamp.transport_available ? selectedCamp.transport_details : 'No official transportation provided'}</div>
                      </div>
                    </div>

                    {bookingSuccess ? (
                      <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-r-2xl">
                        <h4 className="font-bold text-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Booking Received!
                        </h4>
                        <p className="text-xs mt-1 font-semibold leading-relaxed">
                          {selectedCamp.user_id 
                            ? 'Your slot booking request has been submitted to the NGO for verification. You can check the approval status under "My Bookings".'
                            : 'Your appointment slot booking is confirmed. The details have been successfully saved.'
                          }
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleBookingSubmit} className="space-y-4">
                        {bookingError && (
                          <div className="bg-red-50 text-red-700 border-l-4 border-red-500 text-xs font-semibold p-3.5 rounded-r-xl">
                            {bookingError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Patient Name</label>
                            <input 
                              value={bookingForm.patient_name} 
                              onChange={e => setBookingForm({ ...bookingForm, patient_name: e.target.value })}
                              className="input-field" 
                              required 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Patient Age</label>
                            <input 
                              type="number" 
                              value={bookingForm.patient_age} 
                              onChange={e => setBookingForm({ ...bookingForm, patient_age: e.target.value })}
                              className="input-field" 
                              required 
                              min={1}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Patient Gender</label>
                            <select 
                              value={bookingForm.patient_gender} 
                              onChange={e => setBookingForm({ ...bookingForm, patient_gender: e.target.value })}
                              className="input-field"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Appt Date</label>
                            <input 
                              type="date" 
                              value={bookingDate} 
                              onChange={e => handleDateChange(e.target.value)}
                              className="input-field" 
                              required 
                              min={selectedCamp.camp_date}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">Available Time Slots</label>
                          {availableSlots.length === 0 ? (
                            <p className="text-xs text-gray-400 font-semibold py-2">Select a valid date to view available time slots.</p>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                              {availableSlots.map(slot => (
                                <button
                                  key={slot.time}
                                  type="button"
                                  disabled={!slot.available}
                                  onClick={() => setSelectedSlotTime(slot.time)}
                                  className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                                    selectedSlotTime === slot.time
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                      : slot.available
                                        ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        : 'bg-gray-150 border-gray-150 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">Medical Concerns / Medical History (Optional)</label>
                          <textarea 
                            value={bookingForm.medical_concern} 
                            onChange={e => setBookingForm({ ...bookingForm, medical_concern: e.target.value })}
                            className="input-field" 
                            placeholder="Describe any symptoms or requests..."
                            rows={2}
                          />
                        </div>

                        <div className="pt-2 flex gap-3">
                          <button 
                            type="submit" 
                            className="btn-primary flex-1 py-2.5 rounded-xl font-bold text-xs"
                          >
                            Submit Slot Booking
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setSelectedCamp(null)}
                            className="btn-outline px-4 py-2.5 rounded-xl font-bold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 7. MY BOOKINGS */}
            {activeTab === 'my-bookings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Manage and track your appointments and verification status.</p>
                </div>

                {bookings.length === 0 ? (
                  <div className="bg-white border border-gray-150 rounded-2xl p-10 text-center shadow-sm max-w-md mx-auto">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-sm text-gray-800">No appointments booked yet</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-normal">
                      Search for available health camps near you and schedule checkup slots.
                    </p>
                    <button onClick={() => setActiveTab('recommended-camps')} className="btn-primary mt-4 text-xs font-bold px-4 py-2 rounded-xl">
                      Find a Camp
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(b => (
                      <div key={b.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-gray-900 leading-snug">{b.camp_title}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : b.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-gray-500">
                            <div><span className="font-semibold text-gray-700">Patient:</span> {b.patient_name}</div>
                            <div><span className="font-semibold text-gray-700">Specialty:</span> {b.specialty}</div>
                            <div><span className="font-semibold text-gray-700">Date:</span> {b.slot_date}</div>
                            <div><span className="font-semibold text-gray-700">Time Slot:</span> {b.slot_time}</div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100/50">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">{b.address}, {b.city}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                          {b.status !== 'cancelled' && (
                            <button 
                              onClick={() => handleCancelBooking(b.id)}
                              className="px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl flex-1 md:flex-initial transition-all"
                            >
                              Cancel Booking
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedCamp({
                                id: b.camp_id,
                                title: b.camp_title,
                                address: b.address,
                                city: b.city,
                                transport_available: b.transport_available,
                                transport_details: b.transport_details,
                                contact_phone: b.contact_phone,
                                latitude: b.latitude,
                                longitude: b.longitude
                              });
                              setActiveTab('transportation');
                            }}
                            className="btn-primary py-2 text-xs flex-1 md:flex-initial"
                          >
                            Route & Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 8. TRANSPORTATION */}
            {activeTab === 'transportation' && (
              <div className="max-w-2xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Transportation & Directions</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Access transit options and guidelines to reach your appointment camp safely.</p>
                </div>

                {selectedCamp ? (
                  <div className="space-y-5">
                    <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl">
                      <h3 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">Destination</h3>
                      <h4 className="font-bold text-sm text-emerald-950 mt-1 leading-snug">{selectedCamp.title}</h4>
                      <p className="text-xs text-emerald-800 mt-0.5 leading-snug">{selectedCamp.address}, {selectedCamp.city}</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-sm text-gray-800">Transit Guidelines</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                          <Bus className="w-5 h-5 text-emerald-600 mb-1.5" />
                          <h4 className="font-bold text-xs text-gray-900">Official Camp Transport</h4>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                            {selectedCamp.transport_available 
                              ? selectedCamp.transport_details 
                              : 'No official transportation provided for this camp. Private transport or local transit is recommended.'
                            }
                          </p>
                        </div>
                        <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                          <Compass className="w-5 h-5 text-emerald-600 mb-1.5" />
                          <h4 className="font-bold text-xs text-gray-900">Public Transportation</h4>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                            Accessible via local city bus services and regional trains. Use the nearest city local terminal and navigate via local auto rickshaws.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-150 rounded-2xl overflow-hidden">
                      <div className="p-3.5 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-800">Mock Route Map</span>
                        {selectedCamp.contact_phone && (
                          <a href={`tel:${selectedCamp.contact_phone}`} className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {selectedCamp.contact_phone}
                          </a>
                        )}
                      </div>
                      
                      {/* Simple Simulated Map Graphics using CSS */}
                      <div className="h-48 bg-emerald-50/40 relative flex items-center justify-center overflow-hidden">
                        {/* Mock Map Lines */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-1/2 left-0 right-0 h-4 bg-emerald-800 transform rotate-12"></div>
                          <div className="absolute top-0 bottom-0 left-1/3 w-4 bg-emerald-800 transform -rotate-45"></div>
                          <div className="absolute top-1/4 bottom-0 right-1/4 w-3 bg-emerald-800 transform rotate-45"></div>
                        </div>
                        
                        <div className="z-10 flex flex-col items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 shadow-md flex items-center justify-center text-white">
                            <MapPin className="w-4 h-4 animate-bounce" />
                          </div>
                          <p className="text-[10px] text-emerald-800 font-bold bg-white/95 px-3 py-1 rounded-full shadow-sm border border-emerald-100">
                            {selectedCamp.city}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <a 
                        href={
                          selectedCamp.latitude && selectedCamp.longitude
                            ? `https://www.google.com/maps/search/?api=1&query=${selectedCamp.latitude},${selectedCamp.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCamp.title + ' ' + selectedCamp.address + ' ' + selectedCamp.city)}`
                        }
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all text-center"
                      >
                        <Compass className="w-4 h-4" />
                        Get Directions on Google Maps
                      </a>
                      
                      <button 
                        onClick={() => setSelectedCamp(null)}
                        className="btn-outline px-4 py-2.5 rounded-xl text-xs font-semibold"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50/30 rounded-2xl border border-gray-150">
                    <Bus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <h3 className="font-bold text-sm text-gray-800">Select a camp to view route details</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Go to "My Bookings" or "Recommended Camps" and click "Route & Details" to see specific travel guides and maps.
                    </p>
                    <button onClick={() => setActiveTab('my-bookings')} className="btn-primary mt-4 text-xs font-bold px-4 py-2 rounded-xl">
                      Go to My Bookings
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 9. NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="max-w-2xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Stay updated with appointment schedules and nearby camps.</p>
                  </div>
                  {notifications.some(n => !n.is_read) && (
                    <button 
                      onClick={() => {
                        api.markAllAsRead().then(() => loadDashboardData());
                      }}
                      className="text-xs text-emerald-600 font-bold hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center font-semibold">No notifications available.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`py-3.5 flex justify-between items-start gap-4 ${!n.is_read ? 'bg-emerald-50/20 px-3 -mx-3 rounded-xl' : ''}`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                            <span>{n.title}</span>
                            {!n.is_read && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>}
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                          <p className="text-[9px] text-gray-400 font-semibold">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                        {!n.is_read && (
                          <button 
                            onClick={() => {
                              api.markAsRead(n.id).then(() => loadDashboardData());
                            }}
                            className="text-[10px] text-emerald-600 font-bold hover:underline"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 10. PROFILE */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Personal Profile</h2>
                  <p className="text-gray-500 text-xs mt-0.5">View and update your login registration profile settings.</p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-lg">
                    {user?.name ? user.name[0].toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{user?.name}</h3>
                    <p className="text-xs text-gray-500">{user?.email} &middot; Role: {user?.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 border border-gray-100 rounded-xl">
                    <span className="font-bold text-gray-500 block">Phone Contact</span>
                    <span className="font-semibold text-gray-800 text-sm block mt-1">{user?.phone || 'Not Set'}</span>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl">
                    <span className="font-bold text-gray-500 block">Residential City</span>
                    <span className="font-semibold text-gray-800 text-sm block mt-1">{user?.city || 'Not Set'}</span>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl">
                    <span className="font-bold text-gray-500 block">Postal Pincode</span>
                    <span className="font-semibold text-gray-800 text-sm block mt-1">{user?.pincode || 'Not Set'}</span>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl">
                    <span className="font-bold text-gray-500 block">Max Cost Budget</span>
                    <span className="font-semibold text-gray-800 text-sm block mt-1">₹{user?.max_budget || 0}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('health-form')}
                  className="btn-primary w-full py-2.5 rounded-xl font-bold text-xs"
                >
                  Edit Profile & Preferences
                </button>
              </div>
            )}

            {/* 11. HELP & SUPPORT */}
            {activeTab === 'help' && (
              <div className="max-w-2xl bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Help & Support</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Connect with the support center or browse frequently asked questions.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-2xl text-center space-y-2">
                    <Phone className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-sm text-gray-900">Call Support</h4>
                    <p className="text-xs text-gray-500">Call our central helpline for booking and transit aid.</p>
                    <p className="font-bold text-emerald-600 text-xs">1800-419-5000 (Toll Free)</p>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-2xl text-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-sm text-gray-900">Chat Helpdesk</h4>
                    <p className="text-xs text-gray-500">Connect with an online support executive immediately.</p>
                    <p className="font-bold text-emerald-600 text-xs">Average response: 2 mins</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-gray-800">Frequently Asked Questions</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { q: 'How does the prescription analysis work?', a: 'When you upload a doctor prescription, our simulated NLP AI identifies keywords relating to medical specialties and recommended tests, showing them in the Test Analysis tab and matching them with active camps.' },
                      { q: 'What is a booking request vs confirmation?', a: 'For NGO-organized camps, slot booking needs to be manually accepted by the organizers. The status starts as "pending" and becomes "confirmed" once approved. For other camps, slots are confirmed immediately.' },
                      { q: 'How do I cancel my booked slots?', a: 'Go to the "My Bookings" tab and click the "Cancel Booking" button on the respective appointment card.' }
                    ].map((f, i) => (
                      <details key={i} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 cursor-pointer">
                        <summary className="font-bold text-gray-800 outline-none">{f.q}</summary>
                        <p className="text-gray-500 mt-2 leading-relaxed font-semibold">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </>
        )}
      </main>
    </div>
  );

  // Helper function to set states in form
  function setFormState(field, val) {
    setHealthForm(prev => ({ ...prev, [field]: val }));
  }
}
