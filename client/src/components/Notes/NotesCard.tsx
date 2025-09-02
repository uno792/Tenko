import styles from "./NotesCard.module.css";

interface NotesCardProps {
  title: string;
  subject: string;
  grade: string;
  author: string;
  rating: number;
  downloads: number;
  size: string;
  date: string;
  tag?: string;
}

export default function NotesCard({
  title,
  subject,
  grade,
  author,
  rating,
  downloads,
  size,
  date,
  tag,
}: NotesCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div>
          <h3 className={styles.title}>
            {title}
            {tag && <span className={styles.tag}>{tag}</span>}
          </h3>
          <p className={styles.meta}>
            {subject} • {grade} • by {author}
          </p>
          <div className={styles.stats}>
            <span>⭐ {rating}</span>
            <span>⬇ {downloads}</span>
            <span>{size}</span>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <p className={styles.date}>{date}</p>
        <div className={styles.actions}>
          <button className={styles.preview}>Preview</button>
          <button className={styles.download}>⬇ Download</button>
          <button className={styles.share}>Share</button>
        </div>
      </div>
    </div>
  );
}
