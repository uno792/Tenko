// src/pages/practice.tsx
import { useState } from "react";
import styles from "./practice.module.css";
import StepTopicInput from "../components/Practice/StepTopicInput";
import StepCustomizations from "../components/Practice/StepCustomizations";
import StepResults from "../components/Practice/StepResults";

export default function PracticePage() {
  const [step, setStep] = useState(1);

  const [topicText, setTopicText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mcq" | "flashcards" | "test" | null>(
    null
  );
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("medium");

  return (
    <div className={styles.container}>
      {step === 1 && (
        <StepTopicInput
          topicText={topicText}
          setTopicText={setTopicText}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepCustomizations
          pdfFile={pdfFile}
          setPdfFile={setPdfFile}
          onGenerate={(chosenFormat, chosenNumQuestions, chosenDifficulty) => {
            setFormat(chosenFormat);
            setNumQuestions(chosenNumQuestions);
            setDifficulty(chosenDifficulty);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <StepResults
          topicText={topicText}
          pdfFile={pdfFile}
          format={format}
          numQuestions={numQuestions}
          difficulty={difficulty}
        />
      )}
    </div>
  );
}
