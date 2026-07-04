import express from 'express';
import cors from 'cors';
import './db/database.js';
import authRoutes from './routes/auth.js';
import campRoutes from './routes/camps.js';
import bookingRoutes from './routes/bookings.js';
import schemeRoutes from './routes/schemes.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import ngoRoutes from './routes/ngo.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Medical Camp Finder API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ngo', ngoRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Medical Camp Finder API running on http://localhost:${PORT}`);
});
