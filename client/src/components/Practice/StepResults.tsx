// src/components/Practice/StepResults.tsx
import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractPdfText } from "../../lib/pdf";
import styles from "./StepResults.module.css";

type Props = {
  topicText: string;
  pdfFile: File | null;
  format: "mcq" | "flashcards" | "test" | null;
  numQuestions: number;
  difficulty: string;
};

export default function StepResults({
  topicText,
  pdfFile,
  format,
  numQuestions,
  difficulty,
}: Props) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!format) return;

    async function fetchResults() {
      setLoading(true);
      setRevealed({}); // reset answer visibility when regenerating

      try {
        const inputText = pdfFile ? await extractPdfText(pdfFile) : topicText;

        const client = new GoogleGenerativeAI(
          import.meta.env.VITE_GEMINI_API_KEY!
        );

        const model = client.getGenerativeModel({
          model: "gemini-2.5-flash",
        });

        let prompt = "";
        if (format === "mcq") {
          prompt = `Generate ${numQuestions} multiple choice questions about: ${inputText}.
Each question must have 4 options and specify the correct answer.
Difficulty: ${difficulty}.
Return ONLY valid JSON in this format (no extra text):
[
  { "question": "string", "options": ["string","string","string","string"], "answer": "string" }
]`;
        } else if (format === "flashcards") {
          prompt = `Generate ${numQuestions} flashcards about: ${inputText}.
Difficulty: ${difficulty}.
Return ONLY valid JSON in this format (no extra text):
[
  { "front": "string", "back": "string" }
]`;
        } else if (format === "test") {
          prompt = `Generate ${numQuestions} open-ended practice questions about: ${inputText}.
Difficulty: ${difficulty}.
Return ONLY valid JSON in this format (no extra text):
[
  { "prompt": "string", "answer": "string" }
]`;
        }

        const result = await model.generateContent(prompt);
        let raw = result.response.text().trim();

        if (raw.startsWith("```")) {
          raw = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        }

        try {
          const parsed = JSON.parse(raw);
          setContent(parsed);
        } catch {
          setContent([{ error: "Could not parse AI output", raw }]);
        }
      } catch (err: any) {
        setContent([{ error: err.message }]);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [format, topicText, pdfFile, numQuestions, difficulty]);

  // Toggle function
  const toggleReveal = (i: number) => {
    setRevealed((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Your Practice Results</h2>

      {loading && <p>Generating the future...</p>}

      {!loading && content && (
        <div className={styles.resultsBox}>
          {content.error && <p>Error: {content.error}</p>}

          {/* MCQ */}
          {format === "mcq" &&
            Array.isArray(content) &&
            content.map((q: any, i: number) => (
              <div key={i} className={styles.card}>
                <p>
                  <strong>Q{i + 1}:</strong> {q.question}
                </p>
                <ul>
                  {q.options?.map((opt: string, idx: number) => {
                    const label = String.fromCharCode(65 + idx); // A, B, C, D
                    return (
                      <li key={idx}>
                        <strong>{label}.</strong> {opt}
                      </li>
                    );
                  })}
                </ul>
                {revealed[i] ? (
                  <>
                    <p>
                      <em>Answer: {q.answer}</em>
                    </p>
                    <button onClick={() => toggleReveal(i)}>Hide Answer</button>
                  </>
                ) : (
                  <button onClick={() => toggleReveal(i)}>Show Answer</button>
                )}
              </div>
            ))}

          {/* Flashcards */}
          {format === "flashcards" &&
            Array.isArray(content) &&
            content.map((card: any, i: number) => (
              <div
                key={i}
                className={`${styles.flashcard} ${
                  revealed[i] ? styles.flipped : ""
                }`}
                onClick={() => toggleReveal(i)}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardFront}>
                    <p>{card.front}</p>
                  </div>
                  <div className={styles.cardBack}>
                    <p>{card.back}</p>
                  </div>
                </div>
              </div>
            ))}

          {/* Test */}
          {format === "test" &&
            Array.isArray(content) &&
            content.map((q: any, i: number) => (
              <div key={i} className={styles.card}>
                <p>
                  <strong>Prompt:</strong> {q.prompt}
                </p>
                {!revealed[i] ? (
                  <button onClick={() => toggleReveal(i)}>Show Answer</button>
                ) : (
                  <p>
                    <em>Answer: {q.answer}</em>
                  </p>
                )}
              </div>
            ))}

          {!Array.isArray(content) && !content.error && (
            <pre>{JSON.stringify(content, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
