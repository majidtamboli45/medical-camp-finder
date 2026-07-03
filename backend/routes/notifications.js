import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getUserNotifications, markAsRead, markAllAsRead, getUnreadCount
} from '../services/notifications.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  res.json(getUserNotifications(req.user.id));
});

router.get('/unread-count', authMiddleware, (req, res) => {
  res.json({ count: getUnreadCount(req.user.id) });
});

router.put('/:id/read', authMiddleware, (req, res) => {
  markAsRead(req.params.id, req.user.id);
  res.json({ message: 'Marked as read' });
});

router.put('/read-all', authMiddleware, (req, res) => {
  markAllAsRead(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

export default router;
