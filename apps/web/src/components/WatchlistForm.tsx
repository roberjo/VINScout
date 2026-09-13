import { useState, type CSSProperties } from "react";
import type { DiscoveryPreferences } from "../types/preferences";

const inputStyle: CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border-strong)",
  color: "var(--ink-primary)",
};

function toCsv(values: string[] | undefined): string {
  return values?.join(", ") ?? "";
}

function fromCsv(text: string): string[] | undefined {
  const values = text
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

interface Props {
  initialName?: string;
  initialCriteria?: DiscoveryPreferences;
  submitLabel: string;
  onSubmit: (name: string, criteria: DiscoveryPreferences) => Promise<void>;
  onCancel: () => void;
}

export function WatchlistForm({ initialName = "", initialCriteria = {}, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialName);
  const [criteria, setCriteria] = useState<DiscoveryPreferences>(initialCriteria);
  const [makesText, setMakesText] = useState(toCsv(initialCriteria.makes));
  const [modelsText, setModelsText] = useState(toCsv(initialCriteria.models));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<DiscoveryPreferences>) => setCriteria((c) => ({ ...c, ...patch }));

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(name.trim(), { ...criteria, makes: fromCsv(makesText), models: fromCsv(modelsText) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
      <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Family SUV"
          className="max-w-xs rounded px-2 py-1 text-sm"
          style={inputStyle}
        />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
          Makes (comma-separated)
          <input
            type="text"
            value={makesText}
            onChange={(e) => setMakesText(e.target.value)}
            placeholder="e.g. Toyota, Honda"
            className="rounded px-2 py-1 text-sm"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
          Models (comma-separated)
          <input
            type="text"
            value={modelsText}
            onChange={(e) => setModelsText(e.target.value)}
            placeholder="e.g. Highlander, Pilot"
            className="rounded px-2 py-1 text-sm"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
          Min price
          <input
            type="number"
            min={0}
            value={criteria.priceMin ?? ""}
            onChange={(e) => update({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="$0"
            className="rounded px-2 py-1 text-sm"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
          Max price
          <input
            type="number"
            min={0}
            value={criteria.priceMax ?? ""}
            onChange={(e) => update({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Any"
            className="rounded px-2 py-1 text-sm"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
          Max mileage
          <input
            type="number"
            min={0}
            value={criteria.mileageMax ?? ""}
            onChange={(e) => update({ mileageMax: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Any"
            className="rounded px-2 py-1 text-sm"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
          Year range
          <div className="flex gap-1">
            <input
              type="number"
              value={criteria.yearMin ?? ""}
              onChange={(e) => update({ yearMin: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="From"
              className="w-full rounded px-2 py-1 text-sm"
              style={inputStyle}
            />
            <input
              type="number"
              value={criteria.yearMax ?? ""}
              onChange={(e) => update({ yearMax: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="To"
              className="w-full rounded px-2 py-1 text-sm"
              style={inputStyle}
            />
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-sm font-medium"
          style={{ border: "1px solid var(--border-strong)", color: "var(--ink-secondary)" }}
        >
          Cancel
        </button>
        {error && <span className="badge badge-critical">{error}</span>}
      </div>
    </div>
  );
}
