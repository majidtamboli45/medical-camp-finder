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

export default router;
