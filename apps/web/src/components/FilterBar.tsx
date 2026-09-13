import type { CSSProperties } from "react";
import type { VehicleFilters } from "../types/vehicle";

interface Props {
  filters: VehicleFilters;
  onChange: (filters: VehicleFilters) => void;
}

const inputStyle: CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border-strong)",
  color: "var(--ink-primary)",
};

export function FilterBar({ filters, onChange }: Props) {
  const update = (patch: Partial<VehicleFilters>) => onChange({ ...filters, ...patch });
  const hasFilters = filters.make || filters.priceMin != null || filters.priceMax != null || filters.mileageMax != null;

  return (
    <div
      className="mb-4 flex flex-wrap items-end gap-3 rounded-lg p-3"
      style={{ background: "var(--page)", border: "1px solid var(--border)" }}
    >
      <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
        Make
        <input
          type="text"
          value={filters.make ?? ""}
          onChange={(e) => update({ make: e.target.value || undefined })}
          placeholder="Any"
          className="w-28 rounded px-2 py-1 text-sm"
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
        Min price
        <input
          type="number"
          min={0}
          value={filters.priceMin ?? ""}
          onChange={(e) => update({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="$0"
          className="w-28 rounded px-2 py-1 text-sm"
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
        Max price
        <input
          type="number"
          min={0}
          value={filters.priceMax ?? ""}
          onChange={(e) => update({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Any"
          className="w-28 rounded px-2 py-1 text-sm"
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
        Max mileage
        <input
          type="number"
          min={0}
          value={filters.mileageMax ?? ""}
          onChange={(e) => update({ mileageMax: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Any"
          className="w-28 rounded px-2 py-1 text-sm"
          style={inputStyle}
        />
      </label>

      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="rounded px-3 py-1.5 text-sm font-medium"
          style={{ border: "1px solid var(--border-strong)", color: "var(--ink-secondary)" }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
