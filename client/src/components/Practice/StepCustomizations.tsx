// src/components/Practice/StepCustomizations.tsx
import { useState } from "react";
import styles from "./StepCustomizations.module.css";

type Props = {
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  onGenerate: (
    format: "mcq" | "flashcards" | "test",
    numQuestions: number,
    difficulty: string
  ) => void;
};

export default function StepCustomizations({
  pdfFile,
  setPdfFile,
  onGenerate,
}: Props) {
  const [format, setFormat] = useState<"mcq" | "flashcards" | "test" | null>(
    null
  );
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("medium");

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Customize Your Practice</h2>

      {/* Upload PDF */}
      <div className={styles.field}>
        <label>Upload PDF (optional):</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setPdfFile(file);
          }}
        />
        {pdfFile && <p>Selected: {pdfFile.name}</p>}
      </div>

      {/* Format selector */}
      <div className={styles.options}>
        <button
          className={`${styles.option} ${
            format === "mcq" ? styles.selected : ""
          }`}
          onClick={() => setFormat("mcq")}
        >
          Multiple Choice
        </button>
        <button
          className={`${styles.option} ${
            format === "flashcards" ? styles.selected : ""
          }`}
          onClick={() => setFormat("flashcards")}
        >
          Flashcards
        </button>
        <button
          className={`${styles.option} ${
            format === "test" ? styles.selected : ""
          }`}
          onClick={() => setFormat("test")}
        >
          Open-Ended Test
        </button>
      </div>

      {/* Number of questions */}
      <div className={styles.field}>
        <label>Number of Questions: {numQuestions}</label>
        <input
          type="range"
          min="1"
          max="20"
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
        />
      </div>

      {/* Difficulty */}
      <div className={styles.field}>
        <label>Difficulty:</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Generate button */}
      <button
        className={styles.generateBtn}
        disabled={!format}
        onClick={() => {
          if (format) {
            onGenerate(format, numQuestions, difficulty);
          }
        }}
      >
        Generate
      </button>
    </div>
  );
}
