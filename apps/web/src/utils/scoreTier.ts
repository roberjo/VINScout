// Spec §18's own interpretation table for the opportunity score.
export function scoreTier(score: number): { label: string; classes: string } {
  if (score >= 90) return { label: "Exceptional", classes: "bg-emerald-500/20 text-emerald-300" };
  if (score >= 80) return { label: "Excellent", classes: "bg-green-500/20 text-green-300" };
  if (score >= 70) return { label: "Strong", classes: "bg-sky-500/20 text-sky-300" };
  if (score >= 60) return { label: "Fair", classes: "bg-amber-500/20 text-amber-300" };
  return { label: "Weak", classes: "bg-red-500/20 text-red-300" };
}
