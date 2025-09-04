import { useState } from "react";
import StepTopicInput from "../components/GeneratePaper/StepTopicInput";
import StepResults from "../components/GeneratePaper/StepResults";
import styles from "./generatepaper.module.css";

export default function GeneratePaperPage() {
  const [step, setStep] = useState(1);

  // Allow both English and Afrikaans
  const [subject, setSubject] = useState<"english" | "afrikaans">("english");
  const [grade, setGrade] = useState("12");
  const [customText, setCustomText] = useState("");

  return (
    <div className={styles.container}>
      {step === 1 && (
        <StepTopicInput
          subject={subject}
          grade={grade}
          customText={customText}
          setSubject={setSubject} // ✅ pass setter
          setGrade={setGrade}
          setCustomText={setCustomText}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepResults subject={subject} grade={grade} customText={customText} />
      )}
    </div>
  );
}
