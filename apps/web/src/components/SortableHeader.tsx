// Shared by any sortable table (VehicleTable, ReviewQueue) — a plain <th>
// whose whole label acts as a toggle button: click a new column to sort by
// it (starting at `defaultDir`), click the active column again to flip
// direction. Generic over the column name type so each table keeps its own
// whitelist of sortable columns instead of sharing one enum.
export interface SortState<T extends string> {
  sortBy: T;
  sortDir: "asc" | "desc";
}

interface Props<T extends string> {
  label: string;
  column: T;
  sort: SortState<T>;
  onSortChange: (sort: SortState<T>) => void;
  defaultDir: "asc" | "desc";
}

export function SortableHeader<T extends string>({ label, column, sort, onSortChange, defaultDir }: Props<T>) {
  const active = sort.sortBy === column;

  const handleClick = () => {
    if (active) {
      onSortChange({ sortBy: column, sortDir: sort.sortDir === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ sortBy: column, sortDir: defaultDir });
    }
  };

  return (
    <th className="py-2 pr-4 font-semibold">
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1 uppercase tracking-wide"
        style={{ color: active ? "var(--ink-primary)" : "inherit" }}
      >
        {label}
        <span aria-hidden="true" style={{ visibility: active ? "visible" : "hidden" }}>
          {sort.sortDir === "asc" ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}
