import React, { useState } from "react";
import CalendarModal from "./CalendarModal";
import styles from "./CalendarView.module.css";

interface Event {
  date: string;
  title: string;
}

const CalendarView: React.FC = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const date = `${currentYear}-${currentMonth + 1}-${day}`;
    setSelectedDate(date);
  };

  const handleAddEvent = (title: string) => {
    if (selectedDate) {
      setEvents((prev) => [...prev, { date: selectedDate, title }]);
    }
    setSelectedDate(null);
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={styles.empty}></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${currentMonth + 1}-${day}`;
      const dayEvents = events.filter((e) => e.date === date);

      const isToday =
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      days.push(
        <div
          key={day}
          className={`${styles.day} ${isToday ? styles.today : ""}`}
          onClick={() => handleDayClick(day)}
        >
          <span>{day}</span>
          {dayEvents.map((e, i) => (
            <div key={i} className={styles.event}>
              {e.title}
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button onClick={handlePrevMonth}>{"<"}</button>
        <h2>
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
          })}{" "}
          {currentYear}
        </h2>
        <button onClick={handleNextMonth}>{">"}</button>
      </div>

      <div className={styles.grid}>
        <div className={styles.dayLabel}>Sun</div>
        <div className={styles.dayLabel}>Mon</div>
        <div className={styles.dayLabel}>Tue</div>
        <div className={styles.dayLabel}>Wed</div>
        <div className={styles.dayLabel}>Thu</div>
        <div className={styles.dayLabel}>Fri</div>
        <div className={styles.dayLabel}>Sat</div>
        {renderDays()}
      </div>

      {selectedDate && (
        <CalendarModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSave={handleAddEvent}
        />
      )}
    </div>
  );
};

export default CalendarView;
