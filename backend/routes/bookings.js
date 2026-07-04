import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { notifyBookingConfirmed, createNotification } from '../services/notifications.js';

const router = Router();

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

router.get('/slots/:campId', (req, res) => {
  const camp = db.find('camps', c => c.id === +req.params.campId);
  if (!camp) return res.status(404).json({ error: 'Camp not found' });

  const { date } = req.query;
  const slotDate = date || camp.camp_date;

  const booked = db.findAll('bookings', b =>
    b.camp_id === camp.id && b.slot_date === slotDate && b.status !== 'cancelled'
  );

  const bookedTimes = new Set(booked.map(b => b.slot_time));
  const available = camp.total_slots - camp.booked_slots;

  const slots = TIME_SLOTS.map(time => ({
    time,
    available: available > 0 && !bookedTimes.has(time),
  }));

  res.json({ camp_id: camp.id, date: slotDate, slots, remaining_slots: Math.max(0, available) });
});

router.post('/', authMiddleware, (req, res) => {
  const { camp_id, slot_date, slot_time, patient_name, patient_age, patient_gender, medical_concern } = req.body;
  if (!camp_id || !slot_date || !slot_time || !patient_name) {
    return res.status(400).json({ error: 'Camp, date, time, and patient name are required' });
  }

  const camp = db.find('camps', c => c.id === +camp_id);
  if (!camp) return res.status(404).json({ error: 'Camp not found' });
  if (camp.booked_slots >= camp.total_slots) {
    return res.status(400).json({ error: 'No slots available for this camp' });
  }

  const existing = db.find('bookings', b =>
    b.user_id === req.user.id && b.camp_id === +camp_id && b.slot_date === slot_date && b.status !== 'cancelled'
  );
  if (existing) return res.status(409).json({ error: 'You already have a booking for this camp on this date' });

  // NGO/Hospital camps require manual acceptance and start as 'pending'
  const isNgoCamp = !!camp.user_id || camp.source === 'ngo_registration';
  const initialStatus = isNgoCamp ? 'pending' : 'confirmed';

  const result = db.insert('bookings', {
    user_id: req.user.id, camp_id: +camp_id, slot_date, slot_time, patient_name,
    patient_age: patient_age || null, patient_gender: patient_gender || null,
    medical_concern: medical_concern || null, status: initialStatus,
  });

  if (initialStatus === 'confirmed') {
    db.update('camps', camp.id, { booked_slots: camp.booked_slots + 1 });
    notifyBookingConfirmed(req.user.id, camp.title, slot_date, slot_time);
  } else {
    if (camp.user_id) {
      createNotification(camp.user_id, 'New Booking Request', `You have a new slot booking request for ${camp.title} from ${patient_name}.`, 'info');
    }
  }

  const booking = db.find('bookings', b => b.id === result.lastInsertRowid);
  res.status(201).json(booking);
});

router.get('/my', authMiddleware, (req, res) => {
  const bookings = db.findAll('bookings', b => b.user_id === req.user.id)
    .map(b => {
      const camp = db.find('camps', c => c.id === b.camp_id);
      return {
        ...b,
        camp_title: camp?.title, city: camp?.city, address: camp?.address,
        specialty: camp?.specialty, organizer: camp?.organizer,
        contact_phone: camp?.contact_phone, transport_available: camp?.transport_available,
        transport_details: camp?.transport_details,
        latitude: camp?.latitude, longitude: camp?.longitude,
      };
    })
    .sort((a, b) => new Date(b.slot_date) - new Date(a.slot_date));
  res.json(bookings);
});

router.put('/:id/cancel', authMiddleware, (req, res) => {
  const booking = db.find('bookings', b => b.id === +req.params.id && b.user_id === req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' });

  db.update('bookings', booking.id, { status: 'cancelled' });
  const camp = db.find('camps', c => c.id === booking.camp_id);
  if (camp) db.update('camps', camp.id, { booked_slots: Math.max(0, camp.booked_slots - 1) });
  res.json({ message: 'Booking cancelled successfully' });
});

export default router;
