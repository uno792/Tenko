// src/components/Practice/StepCustomizations.tsx
import { useState, useRef } from "react";
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

  // for drag & drop highlight
  const uploadRef = useRef<HTMLDivElement | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    uploadRef.current?.classList.remove(styles.dragover);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") {
      uploadRef.current?.classList.add(styles.dragover);
    } else {
      uploadRef.current?.classList.remove(styles.dragover);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Customize Your Practice</h2>

      {/* Upload PDF (modern) */}
      <div className={styles.field}>
        <label className={styles.label}>Upload PDF (optional):</label>

        <div
          ref={uploadRef}
          className={styles.fileUpload}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {/* Visually hidden input, triggered by the label */}
          <input
            id="pdf"
            type="file"
            accept="application/pdf"
            className={styles.fileInput}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setPdfFile(file);
            }}
          />
          <label htmlFor="pdf" className={styles.fileBtn} role="button">
            Choose PDF
          </label>

          <span className={styles.fileName} aria-live="polite">
            {pdfFile ? pdfFile.name : "No file chosen"}
          </span>

          {pdfFile && (
            <button
              type="button"
              className={styles.clearFileBtn}
              onClick={() => setPdfFile(null)}
              aria-label="Clear selected PDF"
              title="Clear"
            >
              ×
            </button>
          )}
        </div>
        <small className={styles.helpText}>
          Drag & drop a PDF here or click “Choose PDF”.
        </small>
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
        <label className={styles.label}>
          Number of Questions: {numQuestions}
        </label>
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
        <label className={styles.label}>Difficulty:</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className={styles.select}
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
          if (format) onGenerate(format, numQuestions, difficulty);
        }}
      >
        Generate
      </button>
    </div>
  );
}
