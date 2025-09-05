import styles from "./NotesCard.module.css";
import { baseURL } from "../../config";
import { useEffect, useState } from "react";

interface NotesCardProps {
  id: number;
  title: string;
  type: string;
  subject: string;
  grade: string;
  author: string;
  authorId: string;
  currentUserId: string;
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
  authorId,
  currentUserId,
  description,
  downloads,
  upvotes,
  date,
  fileUrl,
}: NotesCardProps) {
  // track if user has already upvoted
  const [hasUpvoted, setHasUpvoted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`note-${id}-upvoted-${currentUserId}`);
    if (stored) setHasUpvoted(true);
  }, [id, currentUserId]);

  async function handleUpvote() {
    if (hasUpvoted) {
      alert("You already upvoted this note!");
      return;
    }

    try {
      const res = await fetch(`${baseURL}/resources/${id}/upvote`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to upvote");

      // mark as upvoted locally
      localStorage.setItem(`note-${id}-upvoted-${currentUserId}`, "true");
      setHasUpvoted(true); // update UI without reload
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

  async function handleDelete() {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this note?"
      );
      if (!confirmed) return;

      const res = await fetch(`${baseURL}/resources/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
      });
      if (!res.ok) throw new Error("Failed to delete resource");

      window.location.reload();
    } catch (err) {
      console.error("❌ Delete failed:", err);
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
            <span>👍 {upvotes + (hasUpvoted ? 1 : 0)}</span>
            <span className={styles.date}>{date}</span>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <button
          className={styles.upvote}
          onClick={handleUpvote}
          disabled={hasUpvoted}
        >
          {hasUpvoted ? "👍 Upvoted" : "👍 Upvote"}
        </button>
        <button className={styles.download} onClick={handleDownload}>
          ⬇ Download
        </button>
        {currentUserId === authorId && (
          <button className={styles.delete} onClick={handleDelete}>
            🗑 Delete
          </button>
        )}
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
