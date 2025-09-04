import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import styles from "./StepResults.module.css";

type Props = {
  subject: "english" | "afrikaans" | "it-p2" | "history-p1" | "lo-p1";
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

      // Different structures for English, Afrikaans, IT P2
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
      } else if (subject === "it-p2") {
        prompt = `
Generate a full NSC Information Technology Paper 2 practice exam for Grade ${grade}.
Do not include answers or memos.
Do not include diagrams or screenshots.

Structure it as JSON exactly like this:
{
  "paperTitle": "Information Technology P2 Practice Exam",
  "grade": "${grade}",
  "totalMarks": 150,
  "sections": [
    {
      "title": "Section A: Short Questions",
      "marks": 15,
      "questions": [
        { "question": "Example multiple choice question", "marks": 1 }
      ]
    },
    {
      "title": "Section B: Systems Technologies",
      "marks": 25,
      "questions": [...]
    },
    {
      "title": "Section C: Communication and Network Technologies",
      "marks": 30,
      "questions": [...]
    },
    {
      "title": "Section D: Data and Information Management",
      "marks": 20,
      "questions": [...]
    },
    {
      "title": "Section E: Solution Development",
      "marks": 20,
      "questions": [...]
    },
    {
      "title": "Section F: Integrated Scenario",
      "marks": 40,
      "questions": [...]
    }
  ]
}

Guidelines per section:
- Section A: Multiple choice, matching, and fact recall (systems concepts, networking units, common protocols, program tracing).
- Section B: Hardware/software (CPU vs GPU, SSD vs flash, Wi-Fi vs Bluetooth, SaaS, antivirus).
- Section C: Networking/security (switch vs router, firewalls, Wi-Fi issues, torrenting, star topology, IoT).
- Section D: Databases (ERDs, normalisation, validation, transaction processing, audit trails).
- Section E: Programming (GUI design, arrays, syntax vs logic errors, Boolean logic, classes/objects, flowcharts).
- Section F: Case study (VOD, ergonomics, streaming vs downloading, SSL, phishing, scalability, AI, big data, ethics).
`;
      } else if (subject === "history-p1") {
        prompt = `
Generate a full NSC History Paper 1 practice exam for Grade ${grade}.
Paper 1 covers world history (not South African history).
Do not include answers or memos.

Structure as JSON like this:
{
  "paperTitle": "History Paper 1 Practice Exam",
  "grade": "${grade}",
  "totalMarks": 100,
  "sections": [
    {
      "title": "Section A: Essay Questions",
      "marks": 50,
      "questions": [
        { "question": "Essay question text", "marks": 50 }
      ]
    },
    {
      "title": "Section B: Source-Based Questions",
      "marks": 50,
      "questions": [
        { "question": "Source-based question text", "marks": 50 }
      ]
    }
  ]
}

Guidelines:
- Section A: Provide 2 essay questions (candidates answer 1). Topics from Cold War, Civil Rights, Vietnam, Cuba, China, Civil Society protest.
- Marking grid (50 marks): Analysis & argument (30), Use of relevant evidence (20).
- Section B: Provide 2 source-based questions (candidates answer 1). Topics from Independent Africa, End of Cold War, Globalisation.
- Include comprehension, interpretation, reliability/utility, and an extended paragraph (8 marks).
- Total marks = 100.
`;
      } else if (subject === "lo-p1") {
        prompt = `
Generate a full NSC Life Orientation Paper 1 practice exam for Grade ${grade}.
Do not include answers or memos.

Structure as JSON exactly like this:
{
  "paperTitle": "Life Orientation Paper 1 Practice Exam",
  "grade": "${grade}",
  "totalMarks": 100,
  "sections": [
    {
      "title": "Section A: Short Questions",
      "marks": 20,
      "questions": [
        { "question": "Example multiple choice / short question", "marks": 1 }
      ]
    },
    {
      "title": "Section B: Case Studies & Application Questions",
      "marks": 40,
      "questions": [
        { "question": "Case study application question", "marks": 10 }
      ]
    },
    {
      "title": "Section C: Essays / Extended Paragraphs",
      "marks": 40,
      "questions": [
        { "question": "Essay question text", "marks": 20 }
      ]
    }
  ]
}

Guidelines:
- Section A (20): Multiple choice, one-word, short responses.
  Focus: study skills, workplace rights, ethics, freedom of expression, stress management, nation building, globalisation.
- Section B (40): Case studies with extended responses.
  Focus: lifestyle diseases, social factors, benefits of exercise, youth employability, recruitment trends, technology in job market.
- Section C (40): Essays/extended paragraphs (choose 2 of 3).
  Topics: stereotyping & ill health, entrepreneurship & unemployment, community responsibility for health & environment.
- Total = 100 marks, 2.5 hours.
`;
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
            {subject === "english"
              ? "English HL P1"
              : subject === "afrikaans"
              ? "Afrikaans FAL P1"
              : subject === "it-p2"
              ? "Information Technology P2"
              : subject === "history-p1"
              ? "History P1"
              : "Life Orientation P1"}
          </span>
          <span className={styles.badge}>Grade {grade}</span>
          <span className={styles.badge}>
            Total:{" "}
            {content?.totalMarks ||
              (subject === "english"
                ? 70
                : subject === "afrikaans"
                ? 80
                : subject === "it-p2"
                ? 150
                : subject === "history-p1"
                ? 100
                : 100)}{" "}
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
              <h3>
                {section.title}{" "}
                {section.marks ? `(${section.marks} marks)` : ""}
              </h3>
              {section.instructions && <p>{section.instructions}</p>}

              {section.questions?.map((q: any, qi: number) => (
                <p key={qi}>
                  {qi + 1}. {q.question || "⚠️ Missing question text"} (
                  {q.marks})
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
