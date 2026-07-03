const SPECIALTY_MAP = {
  heart: ['Cardiology', 'Cardiac'],
  eye: ['Ophthalmology', 'Eye Care'],
  dental: ['Dental', 'Dentistry'],
  diabetes: ['Diabetes', 'Endocrinology'],
  cancer: ['Oncology', 'Cancer'],
  women: ['Gynecology', 'Women Health'],
  child: ['Pediatric', 'Child Health'],
  bone: ['Orthopedic', 'Bone & Joint'],
  kidney: ['Nephrology', 'Kidney'],
  mental: ['Mental Health', 'Psychiatry'],
  general: ['General', 'Health Checkup', 'Screening'],
  blood: ['Pathology', 'Diagnostic', 'Lab'],
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function specialtyMatch(campSpecialty, userNeeds) {
  if (!userNeeds?.length) return 0;
  const campLower = campSpecialty.toLowerCase();
  let score = 0;
  for (const need of userNeeds) {
    const mapped = SPECIALTY_MAP[need] || [need];
    if (mapped.some(m => campLower.includes(m.toLowerCase()))) {
      score += 30;
    }
  }
  return Math.min(score, 60);
}

export function scoreCamp(camp, user, options = {}) {
  let score = 0;
  const reasons = [];

  const userNeeds = typeof user.medical_needs === 'string'
    ? JSON.parse(user.medical_needs || '[]')
    : user.medical_needs || [];

  const specScore = specialtyMatch(camp.specialty, userNeeds);
  if (specScore > 0) {
    score += specScore;
    reasons.push(`Matches your medical interest: ${camp.specialty}`);
  }

  if (options.specialties?.length) {
    for (const s of options.specialties) {
      const mapped = SPECIALTY_MAP[s] || [s];
      if (mapped.some(m => camp.specialty.toLowerCase().includes(m.toLowerCase()))) {
        score += 25;
        reasons.push(`Matches search: ${camp.specialty}`);
        break;
      }
    }
  }

  if (user.city && camp.city?.toLowerCase() === user.city.toLowerCase()) {
    score += 20;
    reasons.push(`Located in your city (${camp.city})`);
  } else if (options.city && camp.city?.toLowerCase() === options.city.toLowerCase()) {
    score += 20;
    reasons.push(`Located in ${camp.city}`);
  }

  if (user.pincode && camp.pincode === user.pincode) {
    score += 15;
    reasons.push('Same pincode area');
  }

  const distance = haversineDistance(
    user.latitude, user.longitude, camp.latitude, camp.longitude
  );
  if (distance !== null) {
    if (distance < 5) { score += 25; reasons.push(`Very close (${distance.toFixed(1)} km)`); }
    else if (distance < 15) { score += 15; reasons.push(`Nearby (${distance.toFixed(1)} km)`); }
    else if (distance < 30) { score += 8; reasons.push(`Within reach (${distance.toFixed(1)} km)`); }
  }

  const maxBudget = user.max_budget || 0;
  if (camp.is_free) {
    score += 20;
    reasons.push('Free camp');
  } else if (maxBudget > 0 && camp.cost <= maxBudget) {
    score += 15;
    reasons.push(`Within your budget (₹${camp.cost})`);
  } else if (options.isFree && camp.is_free) {
    score += 20;
    reasons.push('Free camp');
  }

  const available = camp.total_slots - camp.booked_slots;
  if (available > 20) { score += 10; reasons.push('Slots available'); }
  else if (available > 0) { score += 5; reasons.push('Limited slots left'); }
  else { score -= 50; reasons.push('Fully booked'); }

  if (camp.transport_available) {
    score += 10;
    reasons.push('Transport assistance available');
  }

  const campDate = new Date(camp.camp_date);
  const now = new Date();
  const daysUntil = (campDate - now) / (1000 * 60 * 60 * 24);
  if (daysUntil >= 0 && daysUntil <= 7) {
    score += 10;
    reasons.push('Happening this week');
  } else if (daysUntil > 7 && daysUntil <= 30) {
    score += 5;
    reasons.push('Upcoming this month');
  }

  return { score: Math.max(0, score), reasons, distance };
}

export function getRecommendations(camps, user, options = {}) {
  return camps
    .map(camp => {
      const { score, reasons, distance } = scoreCamp(camp, user, options);
      return { ...camp, recommendation_score: score, match_reasons: reasons, distance_km: distance };
    })
    .filter(c => c.recommendation_score > 0 && c.status === 'active')
    .sort((a, b) => b.recommendation_score - a.recommendation_score);
}
