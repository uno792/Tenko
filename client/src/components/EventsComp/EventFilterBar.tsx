import React from "react";
import styles from "./EventFilterBar.module.css";

type Props = {
  selected: string;
  onSelect: (filter: string) => void;
};

const EventFilterBar: React.FC<Props> = ({ selected, onSelect }) => {
  const filters = ["All Events", "Recommended", "Urgent Deadlines"];

  return (
    <div className={styles.filterBar}>
      {filters.map((filter) => (
        <button
          key={filter}
          className={`${styles.filterButton} ${
            selected === filter ? styles.active : ""
          }`}
          onClick={() => onSelect(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default EventFilterBar;
