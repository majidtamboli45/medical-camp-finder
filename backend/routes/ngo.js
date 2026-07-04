import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { createNotification } from '../services/notifications.js';

const router = Router();

router.use(authMiddleware);

// Middleware to ensure the user is an NGO or Admin
router.use((req, res, next) => {
  if (req.user.role !== 'ngo' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'NGO access required' });
  }
  next();
});

function parseCamp(row) {
  return {
    ...row,
    services: typeof row.services === 'string' ? JSON.parse(row.services || '[]') : (row.services || []),
    is_free: !!row.is_free,
    transport_available: !!row.transport_available,
    available_slots: row.total_slots - row.booked_slots,
  };
}

// Get NGO Dashboard Stats
router.get('/stats', (req, res) => {
  const ngoId = req.user.id;
  const camps = db.findAll('camps', c => c.user_id === ngoId);
  const campIds = camps.map(c => c.id);

  const activeCampsCount = camps.filter(c => c.status === 'active').length;
  const pendingCampsCount = camps.filter(c => c.status === 'pending').length;

  const bookings = db.findAll('bookings', b => campIds.includes(b.camp_id));
  const totalBookingsCount = bookings.length;
  const confirmedBookingsCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;

  res.json({
    active_camps: activeCampsCount,
    pending_camps: pendingCampsCount,
    total_bookings: totalBookingsCount,
    patients_served: confirmedBookingsCount,
    pending_requests: pendingBookingsCount
  });
});

// Get all camps created by this NGO
router.get('/camps', (req, res) => {
  const camps = db.findAll('camps', c => c.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(parseCamp);
  res.json(camps);
});

// Create a new camp (pending by default)
router.post('/camps', (req, res) => {
  const c = req.body;
  const user = db.find('users', u => u.id === req.user.id);
  
  const result = db.insert('camps', {
    user_id: req.user.id,
    title: c.title,
    description: c.description,
    organizer: user?.name || c.organizer || 'NGO Partner',
    organizer_type: user?.org_type || c.organizer_type || 'NGO',
    specialty: c.specialty,
    services: JSON.stringify(c.services || []),
    city: c.city,
    address: c.address,
    pincode: c.pincode || null,
    latitude: c.latitude || null,
    longitude: c.longitude || null,
    camp_date: c.camp_date,
    end_date: c.end_date || null,
    start_time: c.start_time || '09:00',
    end_time: c.end_time || '17:00',
    is_free: c.is_free ? 1 : 0,
    cost: c.is_free ? 0 : (c.cost || 0),
    total_slots: c.total_slots || 100,
    booked_slots: 0,
    transport_available: c.transport_available ? 1 : 0,
    transport_details: c.transport_details || null,
    contact_phone: c.contact_phone || user?.phone || null,
    contact_email: c.contact_email || user?.email || null,
    source: 'ngo_registration',
    image_url: c.image_url || null,
    status: 'pending', // Default to pending verification by Admin
  });

  const camp = db.find('camps', x => x.id === result.lastInsertRowid);
  res.status(201).json(parseCamp(camp));
});

// Get bookings for this NGO's camps
router.get('/bookings', (req, res) => {
  const ngoId = req.user.id;
  const camps = db.findAll('camps', c => c.user_id === ngoId);
  const campIds = camps.map(c => c.id);

  const bookings = db.findAll('bookings', b => campIds.includes(b.camp_id))
    .map(b => {
      const u = db.find('users', x => x.id === b.user_id);
      const camp = db.find('camps', c => c.id === b.camp_id);
      return {
        ...b,
        user_name: u?.name,
        email: u?.email,
        phone: u?.phone,
        camp_title: camp?.title,
        specialty: camp?.specialty
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json(bookings);
});

// Accept or Reject a booking slot
router.put('/bookings/:id/status', (req, res) => {
  const { status } = req.body; // 'confirmed' or 'cancelled'
  if (!['confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const booking = db.find('bookings', b => b.id === +req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  // Verify that the camp belongs to this NGO
  const camp = db.find('camps', c => c.id === booking.camp_id);
  if (!camp || (camp.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized to modify this booking' });
  }

  const oldStatus = booking.status;
  db.update('bookings', booking.id, { status });

  // Adjust booked slots count on the camp if status changes
  if (status === 'confirmed' && oldStatus !== 'confirmed') {
    db.update('camps', camp.id, { booked_slots: camp.booked_slots + 1 });
    createNotification(booking.user_id, 'Booking Confirmed!', `Your slot booking at ${camp.title} has been accepted by the organizer.`, 'success');
  } else if (status === 'cancelled' && oldStatus === 'confirmed') {
    db.update('camps', camp.id, { booked_slots: Math.max(0, camp.booked_slots - 1) });
    createNotification(booking.user_id, 'Booking Cancelled', `Your slot booking at ${camp.title} was cancelled or declined.`, 'warning');
  } else if (status === 'cancelled' && oldStatus === 'pending') {
    createNotification(booking.user_id, 'Booking Declined', `Your slot booking request at ${camp.title} was declined by the organizer.`, 'warning');
  }

  const updatedBooking = db.find('bookings', b => b.id === +req.params.id);
  res.json(updatedBooking);
});

export default router;
