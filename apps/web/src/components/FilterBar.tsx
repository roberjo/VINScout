import type { VehicleFilters } from "../types/vehicle";

interface Props {
  filters: VehicleFilters;
  onChange: (filters: VehicleFilters) => void;
}

export function FilterBar({ filters, onChange }: Props) {
  const update = (patch: Partial<VehicleFilters>) => onChange({ ...filters, ...patch });

  const inputClass = "w-28 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100";

  return (
    <div className="mb-3 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Make
        <input
          type="text"
          value={filters.make ?? ""}
          onChange={(e) => update({ make: e.target.value || undefined })}
          placeholder="Any"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Min price
        <input
          type="number"
          min={0}
          value={filters.priceMin ?? ""}
          onChange={(e) => update({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="$0"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Max price
        <input
          type="number"
          min={0}
          value={filters.priceMax ?? ""}
          onChange={(e) => update({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Any"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Max mileage
        <input
          type="number"
          min={0}
          value={filters.mileageMax ?? ""}
          onChange={(e) => update({ mileageMax: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Any"
          className={inputClass}
        />
      </label>

      {(filters.make || filters.priceMin != null || filters.priceMax != null || filters.mileageMax != null) && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="rounded border border-slate-700 px-2 py-1 text-sm text-slate-300"
        >
          Clear
        </button>
      )}
    </div>
  );
}
