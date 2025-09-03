// src/services/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g., http://localhost:3000

export type Uni = {
  name: string;
  abbreviation?: string | null;
  website?: string | null;
  id?: number; // ⬅️ include id for selector
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

// ---------- Types for APS profile ----------
export type ApsBandKey = "90-100" | "80-89" | "70-79" | "60-69" | "50-59" | "40-49" | "30-39" | "0-29";

export type ApsRowKind =
  | "home_language"
  | "mathematics"
  | "life_orientation"
  | "additional_language"
  | "other";

export type MathsStream = "mathematics" | "maths_literacy";

export type ApsProfileRow = {
  id?: number;
  profile_id?: number;
  kind: ApsRowKind;
  maths_stream?: MathsStream | null;
  subject_id?: number | null; // used for 'other'
  band_key: ApsBandKey;
  aps_points: number;
  position: number; // 0 for fixed; 1..3 for other
};

export type ApsProfile = {
  id?: number | null;
  user_id: string;
  university_id: number;
  total_aps: number;
  rows: ApsProfileRow[];
};

export type SubjectLite = { id: number; name: string };

// ---------- API calls ----------
export async function listSubjects(search = ""): Promise<SubjectLite[]> {
  const url = new URL(`${API_BASE}/subjects`);
  if (search.trim()) url.searchParams.set("search", search.trim());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load subjects");
  return (await res.json()) as SubjectLite[];
}

export async function loadApsProfile(user_id: string, university_id: number) {
  const url = new URL(`${API_BASE}/aps/profile`);
  url.searchParams.set("user_id", user_id);
  url.searchParams.set("university_id", String(university_id));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load APS profile");
  return (await res.json()) as { profile: any | null; subjects: ApsProfileRow[] };
}

export async function saveApsProfile(payload: ApsProfile) {
  const res = await fetch(`${API_BASE}/aps/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save APS profile");
  return await res.json();
}



export async function getUniversities(): Promise<Uni[]> {
  const res = await fetch(`${API_BASE}/universities`);
  if (!res.ok) throw new Error("Failed to load universities");
  return (await res.json()) as Uni[];
}

export type ProgramRecommendation = {
  program: {
    id: number;
    name: string;
    aps_requirement: number | null;
    application_close: string | null;
    university_tag: string;
    website: string | null;
    requirement_notes?: string | null;
  };
  aps_ok: boolean;
  checks: Array<{ tag: string; ok: boolean; need?: string; has?: string }>;
  score: number;
};

export async function getRecommendations(user_id: string, university_id: number) {
  const url = new URL(`${API_BASE}/recommendations`);
  url.searchParams.set("user_id", user_id);
  url.searchParams.set("university_id", String(university_id));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load recommendations");
  return (await res.json()) as ProgramRecommendation[];
}
