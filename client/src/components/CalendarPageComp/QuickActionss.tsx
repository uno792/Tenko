import React from "react";
import { FaPlus, FaCalculator, FaUserFriends } from "react-icons/fa";
import styles from "./Sidebar.module.css";

const QuickActions: React.FC = () => {
  return (
    <div className={styles.card}>
      <h3>Quick Actions</h3>
      <ul>
        <li>
          <FaPlus /> Add Event
        </li>
        <li>
          <FaCalculator /> APS Calculator
        </li>
        <li>
          <FaUserFriends /> Find Tutors
        </li>
      </ul>
    </div>
  );
};

export default QuickActions;
