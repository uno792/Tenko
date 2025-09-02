import { useEffect, useMemo, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractPdfText } from "../../lib/pdf";
import jsPDF from "jspdf";
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
  const [error, setError] = useState<string | null>(null);

  // Memoize a label for the format badge
  const formatLabel = useMemo(() => {
    if (!format) return "";
    if (format === "mcq") return "Multiple Choice";
    if (format === "flashcards") return "Flashcards";
    return "Open-Ended Test";
  }, [format]);

  async function generate() {
    if (!format) return;

    setLoading(true);
    setError(null);
    setRevealed({});
    setContent(null);

    try {
      const inputText = pdfFile ? await extractPdfText(pdfFile) : topicText;

      const client = new GoogleGenerativeAI(
        import.meta.env.VITE_GEMINI_API_KEY!
      );
      const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

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

      // Strip code fences if present
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
        setError(
          "We generated something, but it wasn’t valid JSON. Showing raw output below."
        );
      }
    } catch (err: any) {
      setError(
        err?.message || "Something went wrong while generating results."
      );
      setContent(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!format) return;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, topicText, pdfFile, numQuestions, difficulty]);

  // Toggle function
  const toggleReveal = (i: number) => {
    setRevealed((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  // Export PDF
  const handleExport = () => {
    if (!content) return;

    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");

    // Title
    doc.setFontSize(16);
    doc.text("Practice Results", 14, 20);
    doc.setFontSize(11);
    doc.text(`Format: ${formatLabel}`, 14, 28);
    doc.text(`Difficulty: ${difficulty}`, 14, 34);
    doc.text(`Questions: ${numQuestions}`, 14, 40);

    let y = 50;

    if (format === "mcq" && Array.isArray(content)) {
      content.forEach((q: any, i: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(`Q${i + 1}: ${q.question}`, 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        q.options.forEach((opt: string, idx: number) => {
          const label = String.fromCharCode(65 + idx);
          doc.text(`${label}. ${opt}`, 20, y);
          y += 6;
        });
        doc.text(`Answer: ${q.answer}`, 20, y);
        y += 10;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }

    if (format === "flashcards" && Array.isArray(content)) {
      content.forEach((card: any, i: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(`Card ${i + 1}`, 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.text(`Front: ${card.front}`, 20, y);
        y += 6;
        doc.text(`Back: ${card.back}`, 20, y);
        y += 10;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }

    if (format === "test" && Array.isArray(content)) {
      content.forEach((q: any, i: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(`Prompt ${i + 1}: ${q.prompt}`, 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.text(`Answer: ${q.answer}`, 20, y);
        y += 10;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }

    const base = (
      pdfFile?.name ||
      topicText?.slice(0, 30) ||
      "practice"
    ).replace(/\s+/g, "_");

    doc.save(`${base}_${format || "results"}.pdf`);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Your Practice Results</h2>

        <div className={styles.badges}>
          {format && <span className={styles.badge}>{formatLabel}</span>}
          <span className={styles.badge}>Difficulty: {difficulty}</span>
          <span className={styles.badge}>Items: {numQuestions}</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <button
          className={styles.primaryBtn}
          onClick={generate}
          disabled={loading || !format}
          aria-busy={loading}
        >
          {loading ? "Generating..." : "Regenerate"}
        </button>
        <button
          className={styles.secondaryBtn}
          onClick={handleExport}
          disabled={!content || loading}
          title="Download as PDF"
        >
          Export PDF
        </button>
      </div>

      {loading && (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} aria-hidden />
          <p>Generating the future...</p>
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorBox} role="alert">
          <strong>Heads up:</strong> {error}
        </div>
      )}

      {!loading && content && (
        <div className={styles.resultsBox}>
          {/* MCQ */}
          {format === "mcq" &&
            Array.isArray(content) &&
            content.map((q: any, i: number) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.qIndex}>Q{i + 1}</div>
                  <div className={styles.cardTitle}>{q.question}</div>
                </div>

                <ul className={styles.options}>
                  {q.options?.map((opt: string, idx: number) => {
                    const label = String.fromCharCode(65 + idx);
                    return (
                      <li key={idx} className={styles.optionItem}>
                        <span className={styles.optionBadge}>{label}</span>
                        <span>{opt}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className={styles.actionsRow}>
                  {revealed[i] ? (
                    <>
                      <em className={styles.answer}>
                        Answer: <strong>{q.answer}</strong>
                      </em>
                      <button
                        className={styles.linkBtn}
                        onClick={() => toggleReveal(i)}
                      >
                        Hide Answer
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.linkBtn}
                      onClick={() => toggleReveal(i)}
                    >
                      Show Answer
                    </button>
                  )}
                </div>
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
                aria-label="Flip flashcard"
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardFace + " " + styles.cardFront}>
                    <p>{card.front}</p>
                  </div>
                  <div className={styles.cardFace + " " + styles.cardBack}>
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
                <div className={styles.cardHeader}>
                  <div className={styles.qIndex}>Q{i + 1}</div>
                  <div className={styles.cardTitle}>{q.prompt}</div>
                </div>

                <div className={styles.actionsRow}>
                  {!revealed[i] ? (
                    <button
                      className={styles.linkBtn}
                      onClick={() => toggleReveal(i)}
                    >
                      Show Answer
                    </button>
                  ) : (
                    <p className={styles.answer}>
                      Answer: <strong>{q.answer}</strong>
                    </p>
                  )}
                </div>
              </div>
            ))}

          {!Array.isArray(content) && !error && (
            <pre className={styles.rawBox}>
              {JSON.stringify(content, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
