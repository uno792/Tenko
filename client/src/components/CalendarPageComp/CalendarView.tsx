import React, { useEffect, useMemo, useRef, useState } from "react";
import CalendarModal from "./CalendarModal";
import styles from "./CalendarView.module.css";
import {
  addCalendarEvent,
  getCalendar,
  type CalendarEvent,
} from "../../services/api";
import { useUser } from "../../Users/UserContext";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
function ymd(y: number, m0: number, d: number) {
  return `${y}-${pad2(m0 + 1)}-${pad2(d)}`;
}
function monthKey(y: number, m0: number) {
  return `${y}-${pad2(m0 + 1)}`;
}

const CalendarView: React.FC = () => {
  const { user } = useUser();
  const userId = user?.id ?? null; // 👈 real signed-in user

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const mk = monthKey(currentYear, currentMonth);

  // Avoid duplicate fetch in React 18 StrictMode (dev only)
  const fetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // If user not ready, reset and bail
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true); // always show a fresh load when (userId|month) changes

    const ac = new AbortController();
    (async () => {
      try {
        const rows = await getCalendar(userId, mk, { signal: ac.signal });
        setEvents(rows);
      } catch (e: any) {
        // If it was an abort, ignore; otherwise log
        if (e?.name !== "AbortError") {
          console.error("Calendar load failed:", e);
          // optionally surface a toast or set an error flag
        }
      } finally {
        setLoading(false);
      }
    })();

    // cancel in-flight fetch if month/user changes or component unmounts
    return () => ac.abort();
  }, [userId, mk]);

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
    setSelectedDate(ymd(currentYear, currentMonth, day));
  };

  const handleAddEvent = async (title: string) => {
    if (!selectedDate || !userId) return;
    try {
      const created = await addCalendarEvent({
        user_id: userId, // 👈 send the real user id
        title,
        date: selectedDate,
      });
      setEvents((prev) => [...prev, created]); // optimistic add
    } catch (e) {
      console.error("Failed to add event:", e);
    } finally {
      setSelectedDate(null);
    }
  };

  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const renderDays = () => {
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className={styles.empty} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = ymd(currentYear, currentMonth, day);
      const dayEvents = dayMap.get(date) ?? [];

      const isToday =
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      cells.push(
        <div
          key={day}
          className={`${styles.day} ${isToday ? styles.today : ""}`}
          onClick={() => handleDayClick(day)}
        >
          <span>{day}</span>
          {dayEvents.map((e) => (
            <div key={e.id} className={styles.event} title={e.title}>
              {e.title}
            </div>
          ))}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button onClick={handlePrevMonth} disabled={loading}>
          {"<"}
        </button>
        <h2>
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
          })}{" "}
          {currentYear}
        </h2>
        <button onClick={handleNextMonth} disabled={loading}>
          {">"}
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.dayLabel}>Sun</div>
        <div className={styles.dayLabel}>Mon</div>
        <div className={styles.dayLabel}>Tue</div>
        <div className={styles.dayLabel}>Wed</div>
        <div className={styles.dayLabel}>Thu</div>
        <div className={styles.dayLabel}>Fri</div>
        <div className={styles.dayLabel}>Sat</div>

        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : (
          renderDays()
        )}
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
