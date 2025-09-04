import React from "react";
import CalendarView from "./CalendarView";
import UpcomingDeadlines from "./UpcomingDeadlines";
import EventCategories from "./EventCategories";
import styles from "./CalendarPage.module.css";

const CalendarPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Your Calendar</h1>
        <p>
          Stay on top of university deadlines, study sessions, and career
          opportunities with your personalized educational calendar.
        </p>
      </div>

      <div className={styles.main}>
        {/* Calendar Section */}
        <CalendarView />

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <UpcomingDeadlines />
          <EventCategories />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
