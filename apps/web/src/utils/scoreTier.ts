// Spec §18's interpretation table (90-100 Exceptional ... <60 Weak) keeps its
// exact labels, but the color coding collapses to the 3 fixed status colors
// (good/warning/critical) rather than 5 subtly different hues — a viewer can
// tell 3 states apart at a glance; 5 shades of green-to-red mostly can't be.
export type StatusClass = "badge-good" | "badge-warning" | "badge-critical";

export function scoreTier(score: number): { label: string; badgeClass: StatusClass } {
  if (score >= 90) return { label: "Exceptional", badgeClass: "badge-good" };
  if (score >= 80) return { label: "Excellent", badgeClass: "badge-good" };
  if (score >= 70) return { label: "Strong", badgeClass: "badge-good" };
  if (score >= 60) return { label: "Fair", badgeClass: "badge-warning" };
  return { label: "Weak", badgeClass: "badge-critical" };
}
