// src/components/AIAssistant/AIToolCard.tsx
import styles from "./AIToolCard.module.css";

type Props = {
  title: string;
  description: string;
  icon: string;
  action: () => void;
};

export default function AIToolCard({
  title,
  description,
  icon,
  action,
}: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      <button className={styles.button} onClick={action}>
        Launch Tool
      </button>
    </div>
  );
}
