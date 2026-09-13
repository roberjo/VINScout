import { useState, type FormEvent } from "react";
import type { HistoryVerificationInput } from "../types/review";

const FLAG_LABELS: Array<{ key: keyof HistoryVerificationInput; label: string }> = [
  { key: "accidentReported", label: "Accident reported" },
  { key: "damageReported", label: "Damage reported" },
  { key: "structuralDamage", label: "Structural damage" },
  { key: "airbagDeployment", label: "Airbag deployment" },
  { key: "totalLoss", label: "Total loss" },
  { key: "salvageTitle", label: "Salvage title" },
  { key: "rebuiltTitle", label: "Rebuilt title" },
  { key: "floodDamage", label: "Flood damage" },
  { key: "lemonBuyback", label: "Manufacturer buyback" },
  { key: "odometerProblem", label: "Odometer problem" },
];

const EMPTY_FLAGS: HistoryVerificationInput = {
  accidentReported: false,
  damageReported: false,
  structuralDamage: false,
  airbagDeployment: false,
  totalLoss: false,
  salvageTitle: false,
  rebuiltTitle: false,
  floodDamage: false,
  lemonBuyback: false,
  odometerProblem: false,
};

interface Props {
  onSubmit: (input: HistoryVerificationInput) => Promise<void>;
}

export function HistoryVerificationForm({ onSubmit }: Props) {
  const [flags, setFlags] = useState<HistoryVerificationInput>(EMPTY_FLAGS);
  const [ownerCount, setOwnerCount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        ...flags,
        ownerCount: ownerCount ? Number(ownerCount) : undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-slate-800 pt-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {FLAG_LABELS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={flags[key] as boolean}
              onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))}
              className="h-4 w-4"
            />
            {label}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          Owner count
          <input
            type="number"
            min={1}
            value={ownerCount}
            onChange={(e) => setOwnerCount(e.target.value)}
            className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          />
        </label>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional) — e.g. what the report said"
        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        rows={2}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save review"}
      </button>
    </form>
  );
}
