import styles from "./StepTopicInput.module.css";

type Props = {
  subject: "english" | "afrikaans";
  grade: string;
  customText: string;
  setSubject: (s: "english" | "afrikaans") => void;
  setGrade: (g: string) => void;
  setCustomText: (t: string) => void;
  onNext: () => void;
};

export default function StepTopicInput({
  subject,
  grade,
  customText,
  setSubject,
  setGrade,
  setCustomText,
  onNext,
}: Props) {
  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Generate Exam Paper</h2>

      <div className={styles.field}>
        <label className={styles.label}>Subject:</label>
        <select
          className={styles.select}
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value as "english" | "afrikaans")
          }
        >
          <option value="english">English HL Paper 1</option>
          <option value="afrikaans">Afrikaans FAL Paper 1</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Grade:</label>
        <select
          className={styles.select}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="10">Grade 10</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Optional Text (for Section A / Afdeling A):
        </label>
        <textarea
          className={styles.textarea}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Paste your own passage here (leave blank to auto-generate)..."
        />
      </div>

      <button className={styles.nextButton} onClick={onNext}>
        Generate →
      </button>
    </div>
  );
}
