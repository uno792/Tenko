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
    <div className={styles.card}>
      <h2 className={styles.heading}>What do you want to learn today?</h2>
      <p className={styles.subheading}>
        Enter a topic, paste some notes, or provide a subject area you’d like to
        practice.
      </p>

      <textarea
        className={styles.textarea}
        value={topicText}
        onChange={(e) => setTopicText(e.target.value)}
        placeholder="e.g. Photosynthesis, World War II, Calculus..."
      />

      <div className={styles.actions}>
        <button
          className={styles.nextButton}
          onClick={onNext}
          disabled={!topicText}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
