import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import styles from "./StepResults.module.css";

type Props = {
  subject: "english" | "afrikaans";
  grade: string;
  customText: string;
};

export default function StepResults({ subject, grade, customText }: Props) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePaper() {
    setLoading(true);
    setError(null);
    setContent(null);

    try {
      const client = new GoogleGenerativeAI(
        import.meta.env.VITE_GEMINI_API_KEY!
      );
      const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Different structures for English vs Afrikaans
      let prompt = "";
      if (subject === "english") {
        prompt = `
Generate a full NSC English HL Paper 1 practice exam for Grade ${grade}.
Do not include images or cartoons.
Do not provide answers or memos.

Sections:
- Section A: Comprehension (30 marks).
${
  customText
    ? `Use this passage as Text 1:\n\n${customText}\n\nAlso provide a second text.`
    : "Provide TWO texts."
}
Add 10–12 fully written exam-style questions.
Each question MUST include:
- "question": the full exam-style question (no placeholders).
- "marks": a number.

- Section B: Summary (10 marks).
Provide one factual text. Instruction: "Summarise the passage in 80–90 words selecting 7 points."

- Section C: Language in Context (30 marks).
Q3 (10 marks): Provide a persuasive text followed by 4–5 fully written questions.
Q4 (10 marks): Provide a commentary/satire text followed by 4–5 fully written questions.
Q5 (10 marks): Provide a short language-use passage followed by 4–5 grammar/usage questions.

Return ONLY valid JSON:
{
  "paperTitle": "English HL Paper 1 Practice Exam",
  "grade": "${grade}",
  "totalMarks": 70,
  "sections": [...]
}`;
      } else if (subject === "afrikaans") {
        prompt = `
Skep 'n volledige NSC Afrikaans Eerste Addisionele Taal P1 oefenvraestel vir Graad ${grade}.
Moenie prente of strokiesprente insluit nie.
Moenie antwoorde of memorandums gee nie.

AFDELING A: Leesbegrip (30 punte)
- Provide one or two passages inside a "texts" array.
  Each text must have: { "title": "string", "content": "full passage text" }.
- Provide 10–12 fully written exam-style questions inside "questions".
  Each question MUST have: { "question": "string", "marks": number }.

AFDELING B: Opsomming (10 punte)
- Provide one factual text inside "text".
- Instruction: "Skryf 'n opsomming van 70–80 woorde met 7 kernpunte."
- Add 1 instruction string inside "instructions".

AFDELING C: Taalstrukture en -konvensies (40 punte)
- Vraag 3 (10): Short persuasive text inside "text" + 4–5 questions.
- Vraag 4 (10): Short dialogue or satire inside "text" + 4–5 questions.
- Vraag 5 (20): Short article inside "text" + 6–8 grammar questions.

Return ONLY valid JSON:
{
  "paperTitle": "Afrikaans FAL Paper 1 Oefenvraestel",
  "grade": "${grade}",
  "totalMarks": 80,
  "sections": [
    {
      "title": "Afdeling A: Leesbegrip",
      "texts": [...],
      "questions": [...]
    },
    ...
  ]
}`;
      }

      const result = await model.generateContent(prompt);
      let raw = result.response.text().trim();

      if (raw.startsWith("```")) {
        raw = raw
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
      }

      const parsed = JSON.parse(raw);
      setContent(parsed);
    } catch (err: any) {
      setError(err?.message || "Something went wrong while generating.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generatePaper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, grade, customText]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Generated Exam Paper</h2>
        <div className={styles.badges}>
          <span className={styles.badge}>
            {subject === "english" ? "English HL P1" : "Afrikaans FAL P1"}
          </span>
          <span className={styles.badge}>Grade {grade}</span>
          <span className={styles.badge}>
            Total: {content?.totalMarks || (subject === "english" ? 70 : 80)}{" "}
            marks
          </span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <button
          className={styles.primaryBtn}
          onClick={generatePaper}
          disabled={loading}
        >
          {loading ? "Generating..." : "Regenerate"}
        </button>
      </div>

      {loading && <div className={styles.loadingBox}>Generating paper...</div>}
      {error && <div className={styles.errorBox}>{error}</div>}

      {content && (
        <div className={styles.resultsBox}>
          {content.sections?.map((section: any, si: number) => (
            <div key={si} className={styles.card}>
              <h3>{section.title}</h3>
              {section.instructions && <p>{section.instructions}</p>}

              {section.texts?.map((t: any, ti: number) => (
                <blockquote key={ti}>
                  <strong>{t.title}</strong>
                  <p>{t.content}</p>
                </blockquote>
              ))}

              {section.text && <blockquote>{section.text}</blockquote>}

              {section.questions?.map((q: any, qi: number) => (
                <p key={qi}>
                  {qi + 1}. {q.question || "⚠️ Missing question text"} (
                  {q.marks})
                </p>
              ))}

              {section.subsections?.map((sub: any, subi: number) => (
                <div key={subi}>
                  <h4>
                    {sub.title} ({sub.marks})
                  </h4>
                  <p>{sub.text}</p>
                  {sub.questions?.map((q: any, qi: number) => (
                    <p key={qi}>
                      {qi + 1}. {q.question || "⚠️ Missing question text"} (
                      {q.marks})
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
