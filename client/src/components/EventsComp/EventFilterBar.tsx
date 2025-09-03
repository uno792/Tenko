import React from "react";
import styles from "./EventFilterBar.module.css";

type Props = {
  mode: "All Events" | "Recommended" | "Urgent Deadlines";
  onMode: (m: Props["mode"]) => void;
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
};

const DEFAULT_TAGS = [
  "Computer Science",
  "Engineering",
  "STEM",
  "Data Science",
  "Accounting",
  "Finance",
  "Business",
  "Design",
  "Entrepreneurship",
];

const MODES: Props["mode"][] = [
  "All Events",
  "Recommended",
  "Urgent Deadlines",
];

const EventFilterBar: React.FC<Props> = ({
  mode,
  onMode,
  tags = DEFAULT_TAGS,
  selectedTags,
  onToggleTag,
}) => {
  const btn = (active: boolean) =>
    active ? `${styles.filterButton} ${styles.active}` : styles.filterButton;

  return (
    <div className={styles.root}>
      <div className={styles.filterBar}>
        {MODES.map((m) => (
          <button key={m} className={btn(mode === m)} onClick={() => onMode(m)}>
            {m}
          </button>
        ))}
      </div>
      <div className={styles.tagsRow}>
        {tags.map((t) => {
          const active = selectedTags.includes(t);
          return (
            <button
              key={t}
              className={btn(active)}
              onClick={() => onToggleTag(t)}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EventFilterBar;
