import styles from "./NotesHeader.module.css";

export default function NotesHeader() {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>Notes & Papers</h1>
        <p className={styles.subtitle}>Share and access study materials</p>
      </div>
      <button className={styles.uploadBtn}>⬆ Upload Notes</button>
    </div>
  );
}
