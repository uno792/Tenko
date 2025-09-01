// server/scripts/ingest_events.ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fetchText } from "./lib/fetchers";
import { llmExtract } from "./lib/llm";
import { upsertEvents } from "./lib/supabase";
import type { EventItemT } from "./lib/schema";
type Source = { name: string; url: string; kind: "Hackathon"|"Bursary"|"CareerFair"|"Other" };

async function run() {
  // __dirname here is .../server/scripts
  const sourcesPath = path.resolve(__dirname, "sources.json");
  const raw = await readFile(sourcesPath, "utf8");
  const sources: Source[] = JSON.parse(raw);

  let total = 0;
  for (const src of sources) {
    console.log(`\n🔎 ${src.name} — ${src.url}`);
    try {
      const text = await fetchText(src.url);
      const items = await llmExtract(text, src.kind);

      const cleaned: EventItemT[] = items.map((it) => ({
        ...it,
        type: (["Hackathon","Bursary","CareerFair","Other"].includes(it.type) ? it.type : src.kind) as any,
        start_date: it.start_date ?? null,
        end_date: it.end_date ?? null
      }));

      const { inserted } = await upsertEvents(cleaned);
      console.log(`✅ Upserted ${inserted}`);
      total += inserted;
    } catch (e: any) {
      console.error(`❌ ${src.name} failed:`, e?.message || e);
    }
  }
  console.log(`\n🎉 Done. Total upserted: ${total}`);
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
