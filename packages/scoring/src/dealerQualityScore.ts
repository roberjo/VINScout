// Opportunity factor: Dealer/listing quality (spec §18, 5% weight). Photo
// count is the one signal we actually have from a data source (Auto.dev)
// that plausibly correlates with listing transparency/effort. Unknown photo
// count (adapter didn't report one) is neutral, not penalized.
const UNKNOWN_PHOTO_COUNT_SCORE = 50;
const PHOTOS_FOR_MAX_SCORE = 20;

export function dealerQualityScore(photoCount: number | undefined | null): number {
  if (photoCount == null) return UNKNOWN_PHOTO_COUNT_SCORE;

  const score = (Math.max(0, photoCount) / PHOTOS_FOR_MAX_SCORE) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}
