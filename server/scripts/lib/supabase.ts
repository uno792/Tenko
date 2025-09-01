import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import type { EventItemT } from "./schema.js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

export const sb = createClient(url, key, { auth: { persistSession: false } });

export async function upsertEvents(items: EventItemT[]) {
  if (!items.length) return { inserted: 0 };

  const payload = items.map((e) => ({
    title: e.title,
    description: e.description ?? "",
    type: e.type,
    start_date: e.start_date ?? null,
    end_date: e.end_date ?? null,
    location: e.location ?? null,
    link: e.link
  }));

  // Requires: CREATE UNIQUE INDEX IF NOT EXISTS events_link_uidx ON public.events (link);
  const { data, error } = await sb
    .from("events")
    .upsert(payload, { onConflict: "link" })
    .select("id");
  if (error) throw error;
  return { inserted: data?.length ?? 0 };
}
