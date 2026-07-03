import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const { category, state, city, search } = req.query;
  let schemes = db.findAll('schemes');

  if (category) schemes = schemes.filter(s => s.category?.toLowerCase() === category.toLowerCase());
  if (state) schemes = schemes.filter(s => s.state?.toLowerCase().includes(state.toLowerCase()));
  if (city) schemes = schemes.filter(s => !s.city || s.city.toLowerCase() === city.toLowerCase() || s.state === 'All India');
  if (search) {
    const lower = search.toLowerCase();
    schemes = schemes.filter(s =>
      `${s.name} ${s.description} ${s.benefits} ${s.category}`.toLowerCase().includes(lower)
    );
  }

  schemes.sort((a, b) => a.name.localeCompare(b.name));
  res.json(schemes);
});

router.get('/categories', (req, res) => {
  const cats = [...new Set(db.findAll('schemes').map(s => s.category))].sort();
  res.json(cats);
});

router.get('/:id', (req, res) => {
  const scheme = db.find('schemes', s => s.id === +req.params.id);
  if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
  res.json(scheme);
});

export default router;
