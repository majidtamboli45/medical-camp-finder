import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Camps from './pages/Camps';
import CampDetail from './pages/CampDetail';
import BookSlot from './pages/BookSlot';
import Recommendations from './pages/Recommendations';
import Schemes from './pages/Schemes';
import SchemeDetail from './pages/SchemeDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AISearch from './pages/AISearch';
import Admin from './pages/Admin';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/camps" element={<Camps />} />
          <Route path="/camps/:id" element={<CampDetail />} />
          <Route path="/camps/:id/book" element={<BookSlot />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/schemes/:id" element={<SchemeDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/ai-search" element={<AISearch />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
