export type EventItem = {
  id: number;
  title: string;
  description: string | null;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  link: string;
  faculty_tags: string[];
  is_all_year: boolean;
  user_status?: "applied" | "saved" | null;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; // e.g. "" for same origin, or "http://localhost:3000"

/** Build query string from a params object */
function buildQuery(params: Record<string, any>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      if (v.length) q.set(k, v.join(","));
    } else {
      q.set(k, String(v));
    }
  });
  return q.toString();
}

/** Fetch events with filters + free-text search */
export async function fetchEvents(opts: {
  tags?: string[];
  types?: string[];
  urgent?: boolean;
  limit?: number;
  offset?: number;
  search?: string; // NEW
}): Promise<EventItem[]> {
  const query = {
    tags: opts.tags,
    types: opts.types,
    urgent: opts.urgent ? "true" : undefined,
    limit: opts.limit ?? 200,
    offset: opts.offset ?? 0,
    q: opts.search?.trim() || undefined, // maps to server-side OR ilike
  };
  const qs = buildQuery(query);
  // ⬇️ NOTE: no /api prefix (server uses app.use(router) at "/")
  const res = await fetch(`${API_BASE}/events?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchEventStatuses(userId: string) {
  const res = await fetch(
    `${API_BASE}/events/status?user_id=${encodeURIComponent(userId)}`
  );
  if (!res.ok) throw new Error("Failed to fetch event statuses");
  return (await res.json()) as { event_id: number; status: "applied" | "saved" }[];
}

export async function markApplied(userId: string, eventId: number) {
  const res = await fetch(`${API_BASE}/events/${eventId}/applied`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error("Failed to mark applied");
  return res.json();
}

export async function saveForLater(userId: string, eventId: number) {
  const res = await fetch(`${API_BASE}/events/${eventId}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

export async function unsave(userId: string, eventId: number) {
  const url = `${API_BASE}/events/${eventId}/save?user_id=${encodeURIComponent(
    userId
  )}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to unsave");
}
