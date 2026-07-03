import db from '../db/database.js';

export function createNotification(userId, title, message, type = 'info') {
  return db.insert('notifications', { user_id: userId, title, message, type, is_read: 0 });
}

export function notifyBookingConfirmed(userId, campTitle, slotDate, slotTime) {
  createNotification(
    userId,
    'Booking Confirmed',
    `Your slot at "${campTitle}" on ${slotDate} at ${slotTime} is confirmed.`,
    'success'
  );
}

export function notifyCampReminder(userId, campTitle, campDate) {
  createNotification(
    userId,
    'Camp Reminder',
    `Reminder: "${campTitle}" is scheduled for ${campDate}. Don't forget your appointment!`,
    'reminder'
  );
}

export function notifyNewCampNearby(userId, campTitle, city) {
  createNotification(
    userId,
    'New Camp Near You',
    `A new medical camp "${campTitle}" has been added in ${city}. Check it out!`,
    'info'
  );
}

export function getUserNotifications(userId) {
  return db.findAll('notifications', n => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);
}

export function markAsRead(notificationId, userId) {
  const n = db.find('notifications', x => x.id === +notificationId && x.user_id === userId);
  if (n) db.update('notifications', n.id, { is_read: 1 });
}

export function markAllAsRead(userId) {
  db.findAll('notifications', n => n.user_id === userId && !n.is_read)
    .forEach(n => db.update('notifications', n.id, { is_read: 1 }));
}

export function getUnreadCount(userId) {
  return db.count('notifications', n => n.user_id === userId && !n.is_read);
}
