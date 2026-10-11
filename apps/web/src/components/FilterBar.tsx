import type { CSSProperties } from "react";
import type { VehicleFacets, VehicleFilters } from "../types/vehicle";

interface Props {
  filters: VehicleFilters;
  onChange: (filters: VehicleFilters) => void;
  facets: VehicleFacets;
}

const inputStyle: CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border-strong)",
  color: "var(--ink-primary)",
};

export function FilterBar({ filters, onChange, facets }: Props) {
  const update = (patch: Partial<VehicleFilters>) => onChange({ ...filters, ...patch });
  const hasFilters =
    filters.make ||
    filters.model ||
    filters.priceMin != null ||
    filters.priceMax != null ||
    filters.mileageMax != null ||
    filters.yearMin != null ||
    filters.yearMax != null;

  // Once a make is picked, the model list narrows to only models that
  // actually co-occur with it — otherwise the full set. Switching make
  // clears any model selection that wouldn't exist under the new make.
  const modelOptions = filters.make ? (facets.modelsByMake[filters.make] ?? []) : facets.models;

  return (
    <div
      className="mb-4 flex flex-wrap items-end gap-3 rounded-lg p-3"
      style={{ background: "var(--page)", border: "1px solid var(--border)" }}
    >
      <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
        Make
        <select
          value={filters.make ?? ""}
          onChange={(e) => {
            const make = e.target.value || undefined;
            const modelStillValid = make ? (facets.modelsByMake[make] ?? []).includes(filters.model ?? "") : true;
            update({ make, model: modelStillValid ? filters.model : undefined });
          }}
          className="w-32 rounded px-2 py-1 text-sm"
          style={inputStyle}
        >
          <option value="">Any</option>
          {facets.makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
        Model
        <select
          value={filters.model ?? ""}
          onChange={(e) => update({ model: e.target.value || undefined })}
          className="w-32 rounded px-2 py-1 text-sm"
          style={inputStyle}
        >
          <option value="">Any</option>
          {modelOptions.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
        Min year
        <input
          type="number"
          min={1980}
          value={filters.yearMin ?? ""}
          onChange={(e) => update({ yearMin: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Any"
          className="w-24 rounded px-2 py-1 text-sm"
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
        Max year
        <input
          type="number"
          min={1980}
          value={filters.yearMax ?? ""}
          onChange={(e) => update({ yearMax: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Any"
          className="w-24 rounded px-2 py-1 text-sm"
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
