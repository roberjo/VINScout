import { useEffect, useState, type CSSProperties } from "react";
import type { DiscoveryPreferences } from "../types/preferences";
import { fetchDiscoveryPreferences, saveDiscoveryPreferences } from "../services/vehiclesApi";

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

export function PreferencesPanel() {
  const [prefs, setPrefs] = useState<DiscoveryPreferences>({});
  const [makesText, setMakesText] = useState("");
  const [modelsText, setModelsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscoveryPreferences()
      .then((data) => {
        setPrefs(data);
        setMakesText(toCsv(data.makes));
        setModelsText(toCsv(data.models));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<DiscoveryPreferences>) => setPrefs((p) => ({ ...p, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const toSave: DiscoveryPreferences = {
        ...prefs,
        makes: fromCsv(makesText),
        models: fromCsv(modelsText),
      };
      await saveDiscoveryPreferences(toSave);
      setPrefs(toSave);
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: "var(--ink-muted)" }}>Loading preferences…</p>;

  return (
    <div>
      <p className="mb-3 text-sm" style={{ color: "var(--ink-muted)" }}>
        Applied at discovery time — a vehicle outside these won't be pulled in at all, so it never reaches manual
        Carfax review. Takes effect on the next discovery run (every 6 hours); doesn't remove vehicles already in
        the queue.
      </p>

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
            value={prefs.priceMin ?? ""}
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
            value={prefs.priceMax ?? ""}
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
            value={prefs.mileageMax ?? ""}
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
              value={prefs.yearMin ?? ""}
              onChange={(e) => update({ yearMin: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="From"
              className="w-full rounded px-2 py-1 text-sm"
              style={inputStyle}
            />
            <input
              type="number"
              value={prefs.yearMax ?? ""}
              onChange={(e) => update({ yearMax: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="To"
              className="w-full rounded px-2 py-1 text-sm"
              style={inputStyle}
            />
          </div>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
        {savedAt && (
          <span className="text-xs" style={{ color: "var(--success-text)" }}>
            Saved {savedAt.toLocaleTimeString()}
          </span>
        )}
        {error && <span className="badge badge-critical">{error}</span>}
      </div>
    </div>
  );
}
