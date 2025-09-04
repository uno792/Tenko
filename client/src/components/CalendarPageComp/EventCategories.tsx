import React from "react";
import styles from "./SideBar.module.css";

const categories = [
  { color: "#6a1b9a", label: "University Deadlines" },
  { color: "#007bff", label: "Tutoring Sessions" },
  { color: "#d93025", label: "Bursary Applications" },
  { color: "#28a745", label: "Career Events" },
  { color: "#ff9800", label: "Study Sessions" },
];

const EventCategories: React.FC = () => {
  return (
    <div className={styles.card}>
      <h3>Event Categories</h3>
      {/* 👇 use the legend class */}
      <ul className={styles.legend}>
        {categories.map((c, i) => (
          <li key={i}>
            <span
              className={styles.colorDot}
              style={{ backgroundColor: c.color }}
            />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventCategories;
