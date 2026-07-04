import { Router } from 'express';
import db from '../db/database.js';
import { parseNaturalLanguageQuery, extractLocationFromQuery } from '../services/nlp.js';
import { getRecommendations } from '../services/recommendation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function parseCamp(row) {
  return {
    ...row,
    services: typeof row.services === 'string' ? JSON.parse(row.services || '[]') : (row.services || []),
    is_free: !!row.is_free,
    transport_available: !!row.transport_available,
    available_slots: row.total_slots - row.booked_slots,
  };
}

router.get('/', (req, res) => {
  const { city, specialty, is_free, pincode, search, q, organizer_type, transport } = req.query;
  let camps = db.findAll('camps', c => c.status === 'active').map(parseCamp);

  const query = search || q;
  if (query) {
    const nlp = parseNaturalLanguageQuery(query);
    const loc = extractLocationFromQuery(query);
    const lower = query.toLowerCase();

    camps = camps.filter(c => {
      const text = `${c.title} ${c.description} ${c.specialty} ${c.organizer} ${c.city} ${c.services.join(' ')}`.toLowerCase();
      const keywordMatch = nlp.keywords.some(k => text.includes(k)) || text.includes(lower);
      const specialtyMatch = !nlp.specialties.length || nlp.specialties.some(s => text.includes(s));
      const locMatch = !loc.city || c.city.toLowerCase() === loc.city.toLowerCase();
      const pinMatch = !loc.pincode || c.pincode === loc.pincode;
      const freeMatch = !nlp.isFree || c.is_free;
      const budgetMatch = !nlp.budget || c.is_free || c.cost <= nlp.budget;
      return keywordMatch && specialtyMatch && locMatch && pinMatch && freeMatch && budgetMatch;
    });
  }

  if (city) camps = camps.filter(c => c.city.toLowerCase() === city.toLowerCase());
  if (pincode) camps = camps.filter(c => c.pincode === pincode);
  if (specialty) camps = camps.filter(c => c.specialty.toLowerCase().includes(specialty.toLowerCase()));
  if (is_free === 'true') camps = camps.filter(c => c.is_free);
  if (organizer_type) camps = camps.filter(c => c.organizer_type === organizer_type);
  if (transport === 'true') camps = camps.filter(c => c.transport_available);

  camps.sort((a, b) => new Date(a.camp_date) - new Date(b.camp_date));
  res.json(camps);
});

router.get('/cities', (req, res) => {
  const cities = [...new Set(db.findAll('camps', c => c.status === 'active').map(c => c.city))].sort();
  res.json(cities);
});

router.get('/specialties', (req, res) => {
  const specs = [...new Set(db.findAll('camps', c => c.status === 'active').map(c => c.specialty))].sort();
  res.json(specs);
});

router.get('/ai/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  const nlp = parseNaturalLanguageQuery(q);
  const location = extractLocationFromQuery(q);
  let camps = db.findAll('camps', c => c.status === 'active').map(parseCamp);

  const lower = q.toLowerCase();
  camps = camps.filter(c => {
    const text = `${c.title} ${c.description} ${c.specialty} ${c.city}`.toLowerCase();
    return nlp.keywords.some(k => text.includes(k)) || text.includes(lower);
  });

  if (location.city) camps = camps.filter(c => c.city.toLowerCase() === location.city.toLowerCase());
  if (nlp.isFree) camps = camps.filter(c => c.is_free);

  res.json({
    query: q,
    analysis: { ...nlp, ...location },
    results: camps,
    result_count: camps.length,
  });
});

router.get('/ai/recommendations', authMiddleware, (req, res) => {
  const user = db.find('users', u => u.id === req.user.id);
  user.medical_needs = JSON.parse(user.medical_needs || '[]');
  const camps = db.findAll('camps', c => c.status === 'active').map(parseCamp);
  const recommendations = getRecommendations(camps, user).slice(0, 10);
  res.json(recommendations);
});

router.post('/analyze-prescription', (req, res) => {
  const { text, filename } = req.body;
  
  // Combine text and filename for keyword search
  const contentToAnalyze = `${text || ''} ${filename || ''}`.toLowerCase();
  
  const testMapping = {
    heart: ['ECG', '2D Echo', 'Cardiologist Consultation'],
    eye: ['Vision Test', 'Cataract Screening', 'Glaucoma Check'],
    dental: ['Dental Checkup', 'Scaling', 'Basic Filling'],
    diabetes: ['Blood Sugar Test', 'HbA1c', 'BP Check'],
    cancer: ['Oral Cancer Screening', 'Breast Exam', 'Cervical Screening'],
    women: ['Gynec Checkup', 'Pap Smear', 'Breast Screening'],
    child: ['Vaccination', 'Growth Monitoring', 'Nutrition Check'],
    bone: ['Bone Density Test', 'Joint Exam', 'Arthritis Screening'],
    kidney: ['Kidney Function Test', 'Urine Analysis'],
    general: ['General Checkup', 'BP Check', 'BMI Screening'],
    blood: ['CBC', 'Lipid Profile', 'Blood Sugar Test']
  };

  const identifiedSpecialties = [];
  const recommendedTests = [];

  // Match keywords
  const MEDICAL_SYNONYMS = {
    heart: ['cardiology', 'cardiac', 'heart', 'ecg', 'echo', 'chest pain', 'cardiologist'],
    eye: ['ophthalmology', 'eye', 'vision', 'cataract', 'glaucoma', 'blind', 'spectacles'],
    dental: ['dental', 'dentistry', 'teeth', 'oral', 'cavity', 'scaling', 'toothache'],
    diabetes: ['diabetes', 'diabetic', 'blood sugar', 'glucose', 'insulin', 'hba1c'],
    cancer: ['cancer', 'oncology', 'tumor', 'chemotherapy', 'biopsy', 'mammogram'],
    women: ['gynecology', 'women', 'maternal', 'prenatal', 'obstetrics', 'pregnancy', 'pap smear'],
    child: ['pediatric', 'children', 'child', 'vaccination', 'immunization', 'growth'],
    bone: ['orthopedic', 'bone', 'joint', 'fracture', 'arthritis', 'osteo', 'calcium'],
    kidney: ['nephrology', 'kidney', 'dialysis', 'creatinine', 'urine'],
    blood: ['blood test', 'pathology', 'lab', 'diagnostic', 'cbc', 'lipid', 'cholesterol', 'hemoglobin']
  };

  for (const [specialty, terms] of Object.entries(MEDICAL_SYNONYMS)) {
    if (terms.some(term => contentToAnalyze.includes(term))) {
      identifiedSpecialties.push(specialty);
      testMapping[specialty].forEach(test => {
        if (!recommendedTests.includes(test)) recommendedTests.push(test);
      });
    }
  }

  // Fallback if no keywords matched
  if (identifiedSpecialties.length === 0) {
    identifiedSpecialties.push('general', 'blood');
    testMapping.general.forEach(t => recommendedTests.push(t));
    testMapping.blood.forEach(t => {
      if (!recommendedTests.includes(t)) recommendedTests.push(t);
    });
  }

  res.json({
    success: true,
    filename: filename || 'prescription.pdf',
    identified_specialties: identifiedSpecialties,
    recommended_tests: recommendedTests,
    summary: `Prescription NLP analysis detected indications for: ${identifiedSpecialties.join(', ')}. Recommended screening tests: ${recommendedTests.join(', ')}.`
  });
});

router.get('/:id', (req, res) => {
  const camp = db.find('camps', c => c.id === +req.params.id);
  if (!camp) return res.status(404).json({ error: 'Camp not found' });
  res.json(parseCamp(camp));
});

export default router;
