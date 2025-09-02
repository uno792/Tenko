import styles from "./NotesSearchBar.module.css";

export default function NotesSearchBar() {
  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        placeholder="Search notes, papers, or subjects..."
        className={styles.input}
      />
      <select className={styles.select}>
        <option>All Subjects</option>
        <option>Math</option>
        <option>Physics</option>
        <option>Life Sciences</option>
      </select>
      <button className={styles.filterBtn}>⚙</button>
    </div>
  );
}
