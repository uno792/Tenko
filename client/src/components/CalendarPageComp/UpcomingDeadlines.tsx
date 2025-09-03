import React from "react";
import styles from "./Sidebar.module.css";

const UpcomingDeadlines: React.FC = () => {
  return (
    <div className={styles.card}>
      <h3>Upcoming Deadlines</h3>
      <ul>
        <li>
          <span className={styles.dot} /> UCT Application Deadline
          <small>15 Jan at 23:59</small>
        </li>
        <li>
          <span className={styles.dot} /> NSFAS Application Closes
          <small>31 Jan at 23:59</small>
        </li>
      </ul>
    </div>
  );
};

export default UpcomingDeadlines;
