// Opportunity factor: Trim/equipment (spec §18, 10% weight). No source we
// have gives a real options/equipment list, so this is a deliberately mild
// proxy: unknown trim is neutral (we simply don't penalize missing data),
// a known trim nudges up slightly (we know *something*), and a trim name
// matching a widely-recognized "upper trim" naming pattern nudges up more.
// This is a naming-convention heuristic, not a real equipment assessment —
// it will misjudge brands/models it doesn't recognize.
const UPPER_TRIM_KEYWORDS = [
  "limited",
  "platinum",
  "premium",
  "touring",
  "denali",
  "luxury",
  "elite",
  "reserve",
  "overland",
  "trailhawk",
  "summit",
  "high country",
  "laramie",
  "king ranch",
  "black label",
  "signature",
];

const UNKNOWN_TRIM_SCORE = 50;
const KNOWN_TRIM_SCORE = 60;
const UPPER_TRIM_SCORE = 80;

export function trimScore(trim: string | undefined | null): number {
  if (!trim || trim.trim() === "") return UNKNOWN_TRIM_SCORE;

  const normalized = trim.toLowerCase();
  const isUpperTrim = UPPER_TRIM_KEYWORDS.some((keyword) => normalized.includes(keyword));

  return isUpperTrim ? UPPER_TRIM_SCORE : KNOWN_TRIM_SCORE;
}
