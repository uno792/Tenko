import styles from "./DeadlineCard.module.css";

interface DeadlineCardProps {
  uni: string;
  course: string;
  date: string;
  daysLeft: number;
  urgent?: boolean;
}

export default function DeadlineCard({
  uni,
  course,
  date,
  daysLeft,
  urgent,
}: DeadlineCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <h3 className={styles.uni}>
          {uni}
          {urgent && <span className={styles.badge}>Urgent</span>}
        </h3>
        <p className={styles.course}>{course}</p>
      </div>
      <div className={styles.right}>
        <p className={styles.date}>{date}</p>
        <p className={styles.days}>{daysLeft} days left</p>
      </div>
    </div>
  );
}
