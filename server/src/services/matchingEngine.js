/**
 * INTELLIGENT MATCHING ENGINE
 * ─────────────────────────────
 * Score = (0.4 × proximity_score) + (0.4 × urgency_score) + (0.2 × quantity_score)
 *
 * proximity_score : 1 - (distance_km / MAX_DISTANCE_KM)   → closer = higher
 * urgency_score   : 1 - (hoursLeft / MAX_HOURS)           → sooner expiry = higher urgency
 * quantity_score  : min(food.quantity / ngo.capacity, 1)   → best capacity match
 */

const MAX_DISTANCE_KM = 50;   // NGOs beyond this are excluded
const MAX_HOURS = 72;          // Expiry window considered
const WEIGHTS = { proximity: 0.4, urgency: 0.4, quantity: 0.2 };
const SCORE_THRESHOLD = 0.15;

/**
 * Haversine formula: distance in km between two [lng, lat] points
 */
export function haversineDistance([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return (deg * Math.PI) / 180; }

/**
 * Compute urgency score for a food listing (0–1, higher = more urgent).
 */
export function computeUrgencyScore(expiryTime) {
  const hoursLeft = (new Date(expiryTime) - Date.now()) / 3_600_000;
  if (hoursLeft <= 0) return 1; // Already expired — maximum urgency
  return Math.min(1, Math.max(0, 1 - hoursLeft / MAX_HOURS));
}

/**
 * Rank a list of NGO users against a food listing and return sorted matches.
 * @param {Object} food  - FoodListing document
 * @param {Array}  ngos  - Array of User documents with role=ngo
 * @returns {Array} Sorted array of { ngo, score, distance, urgency, quantity } — best first
 */
export function rankNGOs(food, ngos) {
  const foodCoords = food.location?.coordinates || [0, 0];
  const urgencyScore = computeUrgencyScore(food.expiryTime);

  const scored = ngos
    .filter(ngo => ngo.isActive)
    .map(ngo => {
      const ngoCoords = ngo.location?.coordinates || [0, 0];
      const distKm = haversineDistance(foodCoords, ngoCoords);

      if (distKm > MAX_DISTANCE_KM) return null; // Too far

      const proximityScore = Math.max(0, 1 - distKm / MAX_DISTANCE_KM);
      const quantityScore = Math.min(1, food.quantity / Math.max(ngo.capacity || 100, 1));

      const score =
        WEIGHTS.proximity * proximityScore +
        WEIGHTS.urgency * urgencyScore +
        WEIGHTS.quantity * quantityScore;

      return {
        ngo,
        score: parseFloat(score.toFixed(4)),
        proximityScore: parseFloat(proximityScore.toFixed(4)),
        urgencyScore: parseFloat(urgencyScore.toFixed(4)),
        quantityScore: parseFloat(quantityScore.toFixed(4)),
        distanceKm: parseFloat(distKm.toFixed(2)),
      };
    })
    .filter(m => m !== null && m.score >= SCORE_THRESHOLD);

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  return scored;
}
