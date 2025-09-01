import { GoogleGenerativeAI } from "@google/generative-ai";
import { EventItems, type EventItemT } from "./schema";

const SYSTEM = `
You extract structured events/opportunities for students (South Africa + online).
Return ONLY a JSON array of objects with fields:
- title (string)
- description (<= 240 chars, optional)
- type ("Hackathon"|"Bursary"|"CareerFair"|"Other")
- start_date ("YYYY-MM-DD" or null, optional)
- end_date ("YYYY-MM-DD" or null, optional)
- location (string, optional)
- link (URL string)
At most 10 items. Dates must be ISO if inferable, else null.
`.trim();

export async function llmExtract(content: string, defaultType: string): Promise<EventItemT[]> {
  const apiKey = process.env.GEMINI_API_KEY!;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const user = `
SOURCE_KIND: ${defaultType}
TASK: Extract up to 10 *future* events/opportunities for SA students from the text below.
CONTENT:
"""${content.slice(0, 14000)}"""
Return only JSON array.
`.trim();

  const resp = await model.generateContent([{ text: SYSTEM }, { text: user }]);
  const text = resp.response.text().replace(/```json|```/g, "").trim();

  // Accept either array or {items:[...]}
  const parsed = JSON.parse(text);
  const arr = Array.isArray(parsed) ? parsed : (parsed.items ?? parsed.events ?? []);
  return EventItems.parse(arr || []);
}
