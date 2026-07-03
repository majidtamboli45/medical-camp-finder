const MEDICAL_SYNONYMS = {
  heart: ['cardiology', 'cardiac', 'heart', 'ecg', 'echo'],
  eye: ['ophthalmology', 'eye', 'vision', 'cataract', 'glaucoma'],
  dental: ['dental', 'dentistry', 'teeth', 'oral'],
  diabetes: ['diabetes', 'diabetic', 'blood sugar', 'glucose'],
  cancer: ['cancer', 'oncology', 'tumor', 'chemotherapy'],
  women: ['gynecology', 'women', 'maternal', 'prenatal', 'obstetrics'],
  child: ['pediatric', 'children', 'child', 'vaccination', 'immunization'],
  bone: ['orthopedic', 'bone', 'joint', 'fracture', 'arthritis'],
  kidney: ['nephrology', 'kidney', 'dialysis'],
  mental: ['mental health', 'psychiatry', 'counseling', 'depression'],
  general: ['general', 'checkup', 'health camp', 'screening'],
  blood: ['blood test', 'pathology', 'lab', 'diagnostic'],
};

const PINCODE_CITY_MAP = {
  '400001': 'Mumbai', '400050': 'Mumbai', '400058': 'Mumbai',
  '110001': 'Delhi', '110016': 'Delhi', '110092': 'Delhi',
  '560001': 'Bangalore', '560034': 'Bangalore', '560100': 'Bangalore',
  '600001': 'Chennai', '600028': 'Chennai',
  '500001': 'Hyderabad', '500032': 'Hyderabad',
  '411001': 'Pune', '411014': 'Pune',
  '700001': 'Kolkata', '700091': 'Kolkata',
  '380001': 'Ahmedabad', '380015': 'Ahmedabad',
  '302001': 'Jaipur', '302017': 'Jaipur',
};

export function parseNaturalLanguageQuery(query) {
  if (!query) return { specialties: [], keywords: [], intent: 'search' };

  const lower = query.toLowerCase();
  const specialties = [];
  const keywords = lower.split(/\s+/).filter(w => w.length > 2);

  for (const [category, terms] of Object.entries(MEDICAL_SYNONYMS)) {
    if (terms.some(t => lower.includes(t))) {
      specialties.push(category);
    }
  }

  let intent = 'search';
  if (/free|no cost|subsidized|affordable|cheap|low cost/.test(lower)) intent = 'affordable';
  if (/near|nearby|close|around|location/.test(lower)) intent = 'nearby';
  if (/book|appointment|slot|register/.test(lower)) intent = 'booking';
  if (/transport|pickup|shuttle|bus/.test(lower)) intent = 'transport';

  const isFree = /free|no cost|subsidized/.test(lower);
  const maxBudget = /under\s*(\d+)|below\s*(\d+)|max\s*(\d+)/.exec(lower);
  const budget = maxBudget ? parseInt(maxBudget[1] || maxBudget[2] || maxBudget[3]) : null;

  return { specialties, keywords, intent, isFree, budget };
}

export function extractLocationFromQuery(query) {
  const pincodeMatch = query.match(/\b\d{6}\b/);
  if (pincodeMatch) {
    const pincode = pincodeMatch[0];
    return { pincode, city: PINCODE_CITY_MAP[pincode] || null };
  }

  const cities = [...new Set(Object.values(PINCODE_CITY_MAP))];
  const lower = query.toLowerCase();
  const city = cities.find(c => lower.includes(c.toLowerCase()));
  return city ? { city, pincode: null } : { city: null, pincode: null };
}

export function analyzeCampText(text) {
  const parsed = parseNaturalLanguageQuery(text);
  const location = extractLocationFromQuery(text);
  return { ...parsed, ...location };
}
