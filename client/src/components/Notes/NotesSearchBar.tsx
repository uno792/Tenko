import styles from "./NotesSearchBar.module.css";

interface NotesSearchBarProps {
  onSearch?: (query: string) => void;
  onToggleSort?: () => void;
  isSorted?: boolean;
}

export default function NotesSearchBar({
  onSearch,
  onToggleSort,
  isSorted,
}: NotesSearchBarProps) {
  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        placeholder="Search notes, papers, or subjects..."
        className={styles.input}
        onChange={(e) => onSearch && onSearch(e.target.value)}
      />
      <button
        className={`${styles.sortBtn} ${isSorted ? styles.active : ""}`}
        onClick={onToggleSort}
      >
        {isSorted ? "Sorted by Most Upvoted" : "Most Upvoted"}
      </button>
    </div>
  );
}
