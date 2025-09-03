import styles from "./NotesCard.module.css";
import { baseURL } from "../../config";
interface NotesCardProps {
  id: number;
  title: string;
  type: string;
  subject: string;
  grade: string;
  author: string;
  description: string;
  downloads: number;
  upvotes: number;
  date: string;
  fileUrl: string;
}

export default function NotesCard({
  id,
  title,
  type,
  subject,
  grade,
  author,
  description,
  downloads,
  upvotes,
  date,
  fileUrl,
}: NotesCardProps) {
  async function handleUpvote() {
    try {
      const res = await fetch(`${baseURL}/resources/${id}/upvote`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to upvote");
      window.location.reload(); // quick & simple refresh
    } catch (err) {
      console.error("❌ Upvote failed:", err);
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(`${baseURL}/resources/${id}/download`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to increment download");
      window.open(fileUrl, "_blank"); // open PDF
    } catch (err) {
      console.error("❌ Download failed:", err);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.icon}>📄</div>
        <div>
          <h3 className={styles.title}>
            {title}
            <span
              className={`${styles.tag} ${
                type === "Past Paper"
                  ? styles.pastPaper
                  : type === "Exam Paper"
                  ? styles.examPaper
                  : ""
              }`}
            >
              {type}
            </span>
          </h3>
          <p className={styles.meta}>
            {subject} • {grade} • by {author}
          </p>
          <p className={styles.description}>{description}</p>
          <div className={styles.stats}>
            <span>⬇ {downloads}</span>
            <span>👍 {upvotes}</span>
            <span className={styles.date}>{date}</span>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.upvote} onClick={handleUpvote}>
          👍 Upvote
        </button>
        <button className={styles.download} onClick={handleDownload}>
          ⬇ Download
        </button>
      </div>
    </div>
  );
}

/*import styles from "./NotesCard.module.css";

interface NotesCardProps {
  title: string;
  type: string;
  subject: string;
  grade: string;
  author: string;
  description: string;
  downloads: number;
  upvotes: number;
  date: string;
}

export default function NotesCard({
  title,
  type,
  subject,
  grade,
  author,
  description,
  downloads,
  upvotes,
  date,
}: NotesCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.icon}>📄</div>
        <div>
          <h3 className={styles.title}>
            {title}
            <span
              className={`${styles.tag} ${
                type === "Past Paper"
                  ? styles.pastPaper
                  : type === "Exam Paper"
                  ? styles.examPaper
                  : ""
              }`}
            >
              {type}
            </span>
          </h3>
          <p className={styles.meta}>
            {subject} • {grade} • by {author}
          </p>
          <p className={styles.description}>{description}</p>
          <div className={styles.stats}>
            <span>⬇ {downloads}</span>
            <span>👍 {upvotes}</span>
            <span className={styles.date}>{date}</span>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.upvote}>👍 Upvote</button>
        <button className={styles.download}>⬇ Download</button>
      </div>
    </div>
  );
}*/
