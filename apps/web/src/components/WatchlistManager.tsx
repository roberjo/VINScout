import { useEffect, useState } from "react";
import type { DiscoveryPreferences, Watchlist } from "../types/preferences";
import { createWatchlist, deleteWatchlist, fetchWatchlists, updateWatchlist } from "../services/vehiclesApi";
import { summarizeCriteria } from "../utils/summarizeCriteria";
import { WatchlistForm } from "./WatchlistForm";

const MAX_WATCHLISTS = 3;

export function WatchlistManager() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  const load = () => {
    setLoading(true);
    fetchWatchlists()
      .then(setWatchlists)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (name: string, criteria: DiscoveryPreferences) => {
    await createWatchlist(name, criteria);
    setEditingId(null);
    load();
  };

  const handleUpdate = async (id: number, name: string, criteria: DiscoveryPreferences) => {
    await updateWatchlist(id, name, criteria);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: number) => {
    await deleteWatchlist(id);
    load();
  };

  if (loading) return <p style={{ color: "var(--ink-muted)" }}>Loading saved searches…</p>;

  return (
    <div>
      <p className="mb-3 text-sm" style={{ color: "var(--ink-muted)" }}>
        Applied at discovery time — a vehicle outside every saved search below won't be pulled in at all, so it
        never reaches manual Carfax review. Takes effect on the next discovery run (every 6 hours); doesn't remove
        vehicles already in the queue. No saved searches means discovery runs unfiltered.
      </p>

      {error && <p className="badge badge-critical mb-3">{error}</p>}

      <ul className="space-y-2">
        {watchlists.map((w) => (
          <li key={w.id} className="rounded-lg p-3" style={{ border: "1px solid var(--border-strong)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{w.name}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {summarizeCriteria(w.criteria).map((chip) => (
                    <span key={chip} className="badge badge-neutral">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === w.id ? null : w.id)}
                  className="rounded px-3 py-1 text-sm font-medium"
                  style={{ border: "1px solid var(--border-strong)", color: "var(--ink-secondary)" }}
                >
                  {editingId === w.id ? "Cancel" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(w.id)}
                  className="rounded px-3 py-1 text-sm font-medium"
                  style={{ border: "1px solid var(--border-strong)", color: "var(--critical)" }}
                >
                  Delete
                </button>
              </div>
            </div>

            {editingId === w.id && (
              <WatchlistForm
                initialName={w.name}
                initialCriteria={w.criteria}
                submitLabel="Save changes"
                onSubmit={(name, criteria) => handleUpdate(w.id, name, criteria)}
                onCancel={() => setEditingId(null)}
              />
            )}
          </li>
        ))}
      </ul>

      {watchlists.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No saved searches yet.</p>}

      <div className="mt-3">
        {editingId === "new" ? (
          <WatchlistForm submitLabel="Create" onSubmit={handleCreate} onCancel={() => setEditingId(null)} />
        ) : (
          <button
            type="button"
            onClick={() => setEditingId("new")}
            disabled={watchlists.length >= MAX_WATCHLISTS}
            className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            style={{ border: "1px solid var(--border-strong)", color: "var(--ink-secondary)" }}
          >
            + Add saved search
          </button>
        )}
        {watchlists.length >= MAX_WATCHLISTS && (
          <span className="ml-3 text-xs" style={{ color: "var(--ink-muted)" }}>
            Limit of {MAX_WATCHLISTS} reached — delete one to add another.
          </span>
        )}
      </div>
    </div>
  );
}
