// src/services/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g., http://localhost:3000

export type Uni = {
  name: string;
  abbreviation?: string | null;
  website?: string | null; // keep this from previous change
};

export type Program = {
  id: number;
  name: string;
  aps_requirement: number | null;
  application_open: string | null;
  application_close: string | null;
  universities?: Uni | null;
};

export type ApplicationRow = {
  id: number;
  user_id: string;
  program_id: number;
  status: "planning" | "submitted" | "accepted" | "rejected" | "registered";
  deadline: string | null;
  submitted_at: string | null;
  notes: string | null;
  program?: Program | null;
};

export async function searchPrograms(query: string) {
  const url = new URL(`${API_BASE}/programs`);
  if (query.trim()) url.searchParams.set("query", query.trim());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to search programs");
  return (await res.json()) as Program[];
}

export async function getApplications(user_id: string) {
  const url = new URL(`${API_BASE}/applications`);
  url.searchParams.set("user_id", user_id);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load applications");
  return (await res.json()) as ApplicationRow[];
}

export async function addApplication(user_id: string, program_id: number) {
  const res = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, program_id }),
  });
  if (!res.ok) throw new Error("Failed to add application");
  return (await res.json()) as ApplicationRow;
}

export async function deleteApplication(id: number) {
  const res = await fetch(`${API_BASE}/applications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete application");
}

// ⬇️ NEW: patch application (status/deadline/notes)
export async function updateApplication(
  id: number,
  patch: Partial<Pick<ApplicationRow, "status" | "deadline" | "notes">>
) {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update application");
  return (await res.json()) as ApplicationRow;
}
