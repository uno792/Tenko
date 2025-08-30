// src/components/Practice/StepTopicInput.tsx
import styles from "./StepTopicInput.module.css";

type StepTopicInputProps = {
  topicText: string;
  setTopicText: (t: string) => void;
  onNext: () => void;
};

export default function StepTopicInput({
  topicText,
  setTopicText,
  onNext,
}: StepTopicInputProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>What do you want to learn today?</h2>
      <textarea
        className={styles.textarea}
        value={topicText}
        onChange={(e) => setTopicText(e.target.value)}
        placeholder="Enter a topic or paste some notes..."
      />
      <button
        className={styles.nextButton}
        onClick={onNext}
        disabled={!topicText}
      >
        Next
      </button>
    </div>
  );
}
