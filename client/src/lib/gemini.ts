import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY!);

export async function generatePractice(
  format: "mcq" | "flashcards" | "test",
  text: string
) {
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

  let prompt = "";
  if (format === "mcq") {
    prompt = `Generate 5 multiple choice questions about: ${text}.
      Each question should have 4 options and specify the correct answer.
      Return as JSON: [{question, options, answer}]`;
  } else if (format === "flashcards") {
    prompt = `Generate 5 flashcards about: ${text}.
      Each should have a 'front' and a 'back'.
      Return as JSON: [{front, back}]`;
  } else if (format === "test") {
    prompt = `Generate 5 open-ended practice questions about: ${text}.
      Include model answers.
      Return as JSON: [{prompt, answer}]`;
  }

  const result = await model.generateContent(prompt);

  const raw = result.response.text();

  try {
    return JSON.parse(raw);
  } catch {
    return [{ error: "Failed to parse Gemini output", raw }];
  }
}
