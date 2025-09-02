import styles from "./EventCard.module.css";

interface EventCardProps {
  title: string;
  category: string;
  date: string;
  daysLeft: number;
  urgent?: boolean;
}

export default function EventCard({
  title,
  category,
  date,
  daysLeft,
  urgent,
}: EventCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <h3 className={styles.title}>
          {title}
          {urgent && <span className={styles.badge}>Urgent</span>}
        </h3>
        <p className={styles.category}>{category}</p>
      </div>
      <div className={styles.right}>
        <p className={styles.date}>{date}</p>
        <p className={styles.days}>{daysLeft} days left</p>
      </div>
    </div>
  );
}
