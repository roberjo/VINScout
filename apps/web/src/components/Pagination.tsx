interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, (page + 1) * pageSize);

  if (total <= pageSize) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: "var(--ink-secondary)" }}>
      <span>
        Showing {start}-{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="rounded px-3 py-1 text-sm font-medium disabled:opacity-40"
          style={{ border: "1px solid var(--border-strong)" }}
        >
          Prev
        </button>
        <span style={{ color: "var(--ink-muted)" }}>
          Page {page + 1} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded px-3 py-1 text-sm font-medium disabled:opacity-40"
          style={{ border: "1px solid var(--border-strong)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
