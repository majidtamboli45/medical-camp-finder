import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { notifyNewCampNearby } from '../services/notifications.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

function parseCamp(row) {
  return {
    ...row,
    services: typeof row.services === 'string' ? JSON.parse(row.services || '[]') : (row.services || []),
    is_free: !!row.is_free,
    transport_available: !!row.transport_available,
  };
}

router.get('/stats', (req, res) => {
  res.json({
    total_camps: db.count('camps'),
    total_users: db.count('users', u => u.role === 'patient'),
    total_bookings: db.count('bookings', b => b.status === 'confirmed'),
    total_schemes: db.count('schemes'),
  });
});

router.get('/camps', (req, res) => {
  const camps = db.findAll('camps')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(parseCamp);
  res.json(camps);
});

router.post('/camps', (req, res) => {
  const c = req.body;
  const result = db.insert('camps', {
    title: c.title, description: c.description, organizer: c.organizer,
    organizer_type: c.organizer_type || 'NGO', specialty: c.specialty,
    services: JSON.stringify(c.services || []), city: c.city, address: c.address,
    pincode: c.pincode || null, latitude: c.latitude || null, longitude: c.longitude || null,
    camp_date: c.camp_date, end_date: c.end_date || null,
    start_time: c.start_time || '09:00', end_time: c.end_time || '17:00',
    is_free: c.is_free ? 1 : 0, cost: c.cost || 0, total_slots: c.total_slots || 100,
    booked_slots: 0, transport_available: c.transport_available ? 1 : 0,
    transport_details: c.transport_details || null, contact_phone: c.contact_phone || null,
    contact_email: c.contact_email || null, source: c.source || 'manual',
    image_url: c.image_url || null, status: 'active',
  });

  db.findAll('users', u => u.city === c.city && u.role === 'patient')
    .forEach(u => notifyNewCampNearby(u.id, c.title, c.city));

  const camp = db.find('camps', x => x.id === result.lastInsertRowid);
  res.status(201).json(parseCamp(camp));
});

router.put('/camps/:id', (req, res) => {
  const c = req.body;
  db.update('camps', +req.params.id, {
    title: c.title, description: c.description, organizer: c.organizer,
    organizer_type: c.organizer_type, specialty: c.specialty,
    services: JSON.stringify(c.services || []), city: c.city, address: c.address,
    pincode: c.pincode, latitude: c.latitude, longitude: c.longitude,
    camp_date: c.camp_date, end_date: c.end_date, start_time: c.start_time, end_time: c.end_time,
    is_free: c.is_free ? 1 : 0, cost: c.cost, total_slots: c.total_slots,
    transport_available: c.transport_available ? 1 : 0, transport_details: c.transport_details,
    contact_phone: c.contact_phone, contact_email: c.contact_email,
    status: c.status || 'active', image_url: c.image_url,
  });
  const camp = db.find('camps', x => x.id === +req.params.id);
  res.json(parseCamp(camp));
});

router.delete('/camps/:id', (req, res) => {
  db.update('camps', +req.params.id, { status: 'inactive' });
  res.json({ message: 'Camp deactivated' });
});

router.delete('/camps/:id', (req, res) => {
  db.update('camps', +req.params.id, { status: 'inactive' });
  res.json({ message: 'Camp deactivated' });
});

router.get('/bookings', (req, res) => {
  const bookings = db.findAll('bookings')
    .map(b => {
      const user = db.find('users', u => u.id === b.user_id);
      const camp = db.find('camps', c => c.id === b.camp_id);
      return { ...b, user_name: user?.name, email: user?.email, camp_title: camp?.title };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(bookings);
});

// GET /api/admin/pending-camps
router.get('/pending-camps', (req, res) => {
  const pending = db.findAll('camps', c => c.status === 'pending').map(parseCamp);
  res.json(pending);
});

// PUT /api/admin/camps/:id/verify
router.put('/camps/:id/verify', (req, res) => {
  const { status } = req.body; // 'active' or 'rejected'
  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid verification status' });
  }

  const camp = db.find('camps', c => c.id === +req.params.id);
  if (!camp) return res.status(404).json({ error: 'Camp not found' });

  db.update('camps', camp.id, { status });

  // If approved, notify users in that city
  if (status === 'active') {
    db.findAll('users', u => u.city === camp.city && u.role === 'patient')
      .forEach(u => notifyNewCampNearby(u.id, camp.title, camp.city));

    if (camp.user_id) {
      db.insert('notifications', {
        user_id: camp.user_id,
        title: 'Camp Approved!',
        message: `Your camp "${camp.title}" has been approved and is now active for slot bookings.`,
        type: 'success',
        is_read: 0
      });
    }
  }

  res.json({ success: true, message: `Camp status updated to ${status}` });
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.findAll('users')
    .map(u => {
      const { password, ...safeUser } = u;
      safeUser.medical_needs = JSON.parse(safeUser.medical_needs || '[]');
      return safeUser;
    });
  res.json(users);
});

// PUT /api/admin/users/:id/verify
router.put('/users/:id/verify', (req, res) => {
  const { verified } = req.body; // true or false
  const user = db.find('users', u => u.id === +req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.update('users', user.id, { verified: !!verified });

  db.insert('notifications', {
    user_id: user.id,
    title: verified ? 'Account Verified' : 'Account Suspended',
    message: verified 
      ? 'Your account details have been verified by the administrator.' 
      : 'Your account has been deactivated/suspended by the administrator.',
    type: verified ? 'success' : 'warning',
    is_read: 0
  });

  res.json({ success: true, message: `User verification updated to ${verified}` });
});

// Mock Scraped Advertisements list
const MOCK_SCRAPED_ADS = [
  {
    id: 101,
    title: 'Free Cardiology Camp - Apollo Hearts',
    description: 'Get free ECG and consultation with top cardiologists this Sunday at Central Mall.',
    organizer: 'Apollo Hospital',
    organizer_type: 'Hospital',
    specialty: 'Cardiology',
    services: ['ECG', 'Blood Pressure Check', 'Cardiologist Consultation'],
    city: 'Mumbai',
    address: 'Central Mall Ground Floor, Bandra West',
    pincode: '400050',
    camp_date: '2026-07-26',
    start_time: '10:00',
    end_time: '16:00',
    is_free: 1,
    cost: 0,
    total_slots: 120,
    transport_available: 1,
    transport_details: 'Free pick up from Bandra Local Station',
    contact_phone: '9820012345',
    source: 'social_media',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop'
  },
  {
    id: 102,
    title: 'Vision & Cataract Screening Mela',
    description: 'Free cataract screening and distribution of free glasses for senior citizens.',
    organizer: 'Swasthya NGO',
    organizer_type: 'NGO',
    specialty: 'Ophthalmology',
    services: ['Vision Test', 'Cataract Screening', 'Free Glasses'],
    city: 'Delhi',
    address: 'Sunder Nagar Community Hall',
    pincode: '110001',
    camp_date: '2026-08-02',
    start_time: '09:00',
    end_time: '15:00',
    is_free: 1,
    cost: 0,
    total_slots: 100,
    transport_available: 0,
    transport_details: null,
    contact_phone: '9811098765',
    source: 'hospital_advertisement',
    image_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e902a?w=500&auto=format&fit=crop'
  },
  {
    id: 103,
    title: 'Child Vaccination & Nutrition Drive',
    description: 'Free immunization and nutrition supplements distribution for infants and toddlers.',
    organizer: 'Care Foundation',
    organizer_type: 'NGO',
    specialty: 'Pediatric',
    services: ['Vaccination', 'Growth Monitoring', 'Nutrition Check'],
    city: 'Bangalore',
    address: 'Whitefield Public Park Hall',
    pincode: '560066',
    camp_date: '2026-08-09',
    start_time: '08:30',
    end_time: '13:00',
    is_free: 1,
    cost: 0,
    total_slots: 150,
    transport_available: 1,
    transport_details: 'Shuttle van from Whitefield Bus Stand every 30 minutes',
    contact_phone: '9900055443',
    source: 'government_program',
    image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&auto=format&fit=crop'
  }
];

// Keep track of imported ad IDs in memory
const importedAdIds = new Set();

// GET /api/admin/scraped-ads
router.get('/scraped-ads', (req, res) => {
  const pendingAds = MOCK_SCRAPED_ADS.filter(ad => !importedAdIds.has(ad.id));
  res.json(pendingAds);
});

// POST /api/admin/scraped-ads/import
router.post('/scraped-ads/import', (req, res) => {
  const { ad_id } = req.body;
  const ad = MOCK_SCRAPED_ADS.find(a => a.id === +ad_id);
  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
  if (importedAdIds.has(ad.id)) return res.status(400).json({ error: 'Ad already imported' });

  // Insert the ad as a verified active camp
  db.insert('camps', {
    title: ad.title,
    description: ad.description,
    organizer: ad.organizer,
    organizer_type: ad.organizer_type,
    specialty: ad.specialty,
    services: JSON.stringify(ad.services),
    city: ad.city,
    address: ad.address,
    pincode: ad.pincode,
    latitude: ad.latitude || null,
    longitude: ad.longitude || null,
    camp_date: ad.camp_date,
    start_time: ad.start_time,
    end_time: ad.end_time,
    is_free: ad.is_free,
    cost: ad.cost,
    total_slots: ad.total_slots,
    booked_slots: 0,
    transport_available: ad.transport_available,
    transport_details: ad.transport_details,
    contact_phone: ad.contact_phone,
    source: ad.source,
    image_url: ad.image_url,
    status: 'active', // Imported ads are active immediately
  });

  // Mark as imported
  importedAdIds.add(ad.id);

  // Notify matching users in that city
  db.findAll('users', u => u.city === ad.city && u.role === 'patient')
    .forEach(u => notifyNewCampNearby(u.id, ad.title, ad.city));

  res.json({ success: true, message: 'Advertisement successfully imported as an active camp' });
});

export default router;
