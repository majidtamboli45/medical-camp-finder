import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { createNotification } from '../services/notifications.js';

const router = Router();

router.post('/register', (req, res) => {
  const { name, email, password, phone, city, pincode, medical_needs, max_budget, role, license_number, org_type, description } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (db.find('users', u => u.email === email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const userRole = role === 'ngo' ? 'ngo' : 'patient';
  const isVerified = userRole === 'patient'; // Patient is verified by default, NGO needs admin approval

  const hash = bcrypt.hashSync(password, 10);
  const result = db.insert('users', {
    name, email, password: hash, phone: phone || null, city: city || null,
    pincode: pincode || null, latitude: null, longitude: null,
    medical_needs: JSON.stringify(medical_needs || []), max_budget: max_budget || 0,
    role: userRole, verified: isVerified,
    license_number: license_number || null, org_type: org_type || null,
    description: description || null
  });

  const user = db.find('users', u => u.id === result.lastInsertRowid);
  createNotification(user.id, 'Welcome!', 'Welcome to Medical Camp Finder. Explore camps and book your health checkups.', 'success');
  const { password: _, ...safeUser } = user;
  safeUser.medical_needs = JSON.parse(safeUser.medical_needs || '[]');
  const token = generateToken(user);
  res.status(201).json({ user: safeUser, token });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.find('users', u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const { password: _, ...safeUser } = user;
  safeUser.medical_needs = JSON.parse(safeUser.medical_needs || '[]');
  const token = generateToken(user);
  res.json({ user: safeUser, token });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.find('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safeUser } = user;
  safeUser.medical_needs = JSON.parse(safeUser.medical_needs || '[]');
  res.json(safeUser);
});

router.put('/profile', authMiddleware, (req, res) => {
  const { name, phone, city, pincode, latitude, longitude, medical_needs, max_budget } = req.body;
  db.update('users', req.user.id, {
    name, phone, city, pincode, latitude: latitude || null, longitude: longitude || null,
    medical_needs: JSON.stringify(medical_needs || []), max_budget: max_budget || 0,
  });
  const updated = db.find('users', u => u.id === req.user.id);
  const { password: _, ...safeUser } = updated;
  safeUser.medical_needs = JSON.parse(safeUser.medical_needs || '[]');
  res.json(safeUser);
});

export default router;
