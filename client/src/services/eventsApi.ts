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
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  
  function buildQuery(params: Record<string, any>) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v == null) return;
      if (Array.isArray(v) && v.length) q.set(k, v.join(","));
      else if (!Array.isArray(v)) q.set(k, String(v));
    });
    return q.toString();
  }
  
  export async function fetchEvents(opts: {
    tags?: string[];
    types?: string[];
    urgent?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<EventItem[]> {
    const qs = buildQuery(opts);
    const res = await fetch(`${API_BASE}/api/events?${qs}`);
    if (!res.ok) throw new Error("Failed to fetch events");
    return res.json();
  }
  
  export async function fetchEventStatuses(userId: string) {
    const res = await fetch(`${API_BASE}/api/events/status?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error("Failed to fetch event statuses");
    return (await res.json()) as { event_id: number; status: "applied" | "saved" }[];
  }
  
  export async function markApplied(userId: string, eventId: number) {
    const res = await fetch(`${API_BASE}/api/events/${eventId}/applied`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error("Failed to mark applied");
    return res.json();
  }
  
  export async function saveForLater(userId: string, eventId: number) {
    const res = await fetch(`${API_BASE}/api/events/${eventId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error("Failed to save");
    return res.json();
  }
  
  export async function unsave(userId: string, eventId: number) {
    const url = `${API_BASE}/api/events/${eventId}/save?user_id=${encodeURIComponent(userId)}`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to unsave");
  }
  